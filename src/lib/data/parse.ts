'use client';

import type { ChartSpec } from '@/lib/deck/types';

/**
 * Client-side data ingestion: CSV / XLSX / JSON → normalized tables.
 * Aggregation happens HERE (deterministically from user data), so the AI
 * can never invent numbers — it only picks the chart config.
 */

export interface ParsedColumn {
  name: string;
  type: 'number' | 'string' | 'date';
}

export interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
  rows: Record<string, string | number>[];
}

export interface TableMeta {
  name: string;
  columns: ParsedColumn[];
  rowCount: number;
  stats: Record<string, { min?: number; max?: number; avg?: number; sum?: number; unique?: number; top?: string }>;
  sample: string[][];
}

// ---------------------------------------------------------------- CSV
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',' || ch === ';' || ch === '\t') {
      cur.push(field);
      field = '';
    } else if (ch === '\n') {
      cur.push(field);
      field = '';
      if (cur.some((c) => c.trim() !== '')) rows.push(cur);
      cur = [];
    } else field += ch;
  }
  cur.push(field);
  if (cur.some((c) => c.trim() !== '')) rows.push(cur);
  return rows;
}

// ---------------------------------------------------------------- helpers
function toNumber(v: string | number | undefined): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const cleaned = v.replace(/[\s,%]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function looksLikeDate(v: string): boolean {
  return /^\d{4}[-/]\d{1,2}([-/]\d{1,2})?$/.test(v.trim()) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(v.trim());
}

export function rowsToTable(name: string, header: string[], rows: string[][]): ParsedTable {
  const cols: ParsedColumn[] = header.map((h, ci) => {
    const values = rows.slice(0, 40).map((r) => String(r[ci] ?? '')).filter((v) => v !== '');
    const numCount = values.filter((v) => toNumber(v) != null).length;
    const dateCount = values.filter((v) => looksLikeDate(v)).length;
    const type: ParsedColumn['type'] =
      values.length > 0 && numCount / values.length > 0.8
        ? 'number'
        : values.length > 0 && dateCount / values.length > 0.8
          ? 'date'
          : 'string';
    return { name: (h.trim() || `Column ${ci + 1}`).slice(0, 40), type };
  });
  const parsedRows = rows.map((r) => {
    const o: Record<string, string | number> = {};
    cols.forEach((c, ci) => {
      const raw = String(r[ci] ?? '');
      o[c.name] = c.type === 'number' ? (toNumber(raw) ?? 0) : raw;
    });
    return o;
  });
  return { name, columns: cols, rows: parsedRows };
}

/** JSON: accepts array of objects or { key: [ ... ] } wrappers. */
export function parseJSONTable(name: string, json: unknown): ParsedTable | null {
  let arr: unknown[] | null = null;
  if (Array.isArray(json)) arr = json;
  else if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    const firstArray = Object.values(obj).find((v) => Array.isArray(v) && v.length > 0 && typeof v[0] === 'object');
    if (firstArray) arr = firstArray as unknown[];
  }
  if (!arr || arr.length === 0 || typeof arr[0] !== 'object') return null;
  const header = [...new Set(arr.slice(0, 50).flatMap((o) => Object.keys(o as object)))].slice(0, 12);
  const rows = arr.slice(0, 2000).map((o) => header.map((h) => String((o as Record<string, unknown>)[h] ?? '')));
  return rowsToTable(name, header, rows);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function tableToMeta(t: ParsedTable): TableMeta {
  const stats: TableMeta['stats'] = {};
  for (const col of t.columns) {
    const vals = t.rows.map((r) => r[col.name]);
    if (col.type === 'number') {
      const nums = vals.map((v) => toNumber(v as string | number)).filter((n): n is number => n != null);
      if (nums.length) {
        const sum = nums.reduce((a, b) => a + b, 0);
        stats[col.name] = {
          min: round3(Math.min(...nums)),
          max: round3(Math.max(...nums)),
          avg: round3(sum / nums.length),
          sum: round3(sum),
        };
      }
    } else {
      const counts = new Map<string, number>();
      vals.forEach((v) => counts.set(String(v), (counts.get(String(v)) ?? 0) + 1));
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      stats[col.name] = { unique: counts.size, top: top ? `${top[0]} (x${top[1]})` : undefined };
    }
  }
  return {
    name: t.name,
    columns: t.columns,
    rowCount: t.rows.length,
    stats,
    sample: t.rows.slice(0, 8).map((r) => t.columns.map((c) => String(r[c.name] ?? ''))),
  };
}

// ---------------------------------------------------------------- chart building
export interface ChartPlan {
  tableIndex: number;
  kind: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut';
  labelColumn: string;
  valueColumn: string;
  aggregation: 'none' | 'sum' | 'avg' | 'min' | 'max' | 'count';
  limit: number;
  sort: 'none' | 'asc' | 'desc';
  unit?: string;
  insight: string;
  title: string;
}

export function buildChartSpec(table: ParsedTable, plan: ChartPlan): ChartSpec | null {
  const labelCol = table.columns.find((c) => c.name === plan.labelColumn);
  const valueCol = table.columns.find((c) => c.name === plan.valueColumn);
  if (!labelCol || !valueCol || valueCol.type !== 'number') return null;

  const groups = new Map<string, number[]>();
  for (const row of table.rows) {
    const label = String(row[labelCol.name] ?? '').trim() || '(blank)';
    const v = row[valueCol.name];
    const n = typeof v === 'number' ? v : (toNumber(String(v)) ?? 0);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(n);
  }

  const agg = plan.aggregation === 'none' && groups.size !== table.rows.length ? 'sum' : plan.aggregation;
  let data = [...groups.entries()].map(([label, nums]) => {
    let value: number;
    switch (agg) {
      case 'none': value = nums[0] ?? 0; break;
      case 'avg': value = nums.reduce((a, b) => a + b, 0) / nums.length; break;
      case 'min': value = Math.min(...nums); break;
      case 'max': value = Math.max(...nums); break;
      case 'count': value = nums.length; break;
      default: value = nums.reduce((a, b) => a + b, 0);
    }
    return { label, value: Math.round(value * 100) / 100 };
  });

  if (plan.sort === 'asc') data.sort((a, b) => a.value - b.value);
  else if (plan.sort === 'desc') data.sort((a, b) => b.value - a.value);

  const capped = data.slice(0, Math.max(2, Math.min(12, plan.limit || 8)));
  if (capped.length < 2) return null;

  return {
    kind: plan.kind,
    data: capped,
    unit: plan.unit,
    insight: plan.insight,
    title: plan.title,
    source: `Source: ${table.name}`,
  };
}

// ---------------------------------------------------------------- file loading
export async function parseFileToTables(file: File): Promise<{ tables: ParsedTable[]; error?: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const name = file.name.replace(/\.[^.]+$/, '');
  try {
    if (ext === 'csv' || ext === 'txt' || file.type === 'text/csv') {
      const text = await file.text();
      if (text.length > 4_000_000) return { tables: [], error: 'CSV too large (max ~4 MB).' };
      const rows = parseCSV(text);
      if (rows.length < 2) return { tables: [], error: 'The CSV needs a header row and at least one data row.' };
      return { tables: [rowsToTable(name, rows[0], rows.slice(1, 2001))] };
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const tables: ParsedTable[] = [];
      for (const sheetName of wb.SheetNames.slice(0, 3)) {
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
        if (rows.length >= 2) {
          tables.push(
            rowsToTable(
              `${name} · ${sheetName}`,
              (rows[0] as unknown[]).map(String),
              (rows.slice(1, 2001) as unknown[][]).map((r) => r.map(String))
            )
          );
        }
      }
      if (!tables.length) return { tables: [], error: 'No data rows found in the workbook.' };
      return { tables };
    }
    if (ext === 'json') {
      const text = await file.text();
      if (text.length > 2_000_000) return { tables: [], error: 'JSON too large (max ~2 MB).' };
      const t = parseJSONTable(name, JSON.parse(text));
      if (!t) return { tables: [], error: 'Could not find an array of objects in the JSON.' };
      return { tables: [t] };
    }
    return { tables: [], error: `Unsupported file type ".${ext}". Use CSV, XLSX or JSON.` };
  } catch (err) {
    console.error('parseFileToTables failed', err);
    return { tables: [], error: 'The file could not be parsed. Is it valid?' };
  }
}
