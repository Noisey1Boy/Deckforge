import { NextRequest, NextResponse } from 'next/server';
import { extractJson, getZAI, rateLimit, sanitizeText, clientKey, bodyTooLarge } from '@/lib/ai/helpers';
import type { ChartPlan, MermaidPlan } from '@/lib/data/plans';

export const maxDuration = 120;

/**
 * The client sends COMPACT, already-parsed table metadata (columns, types,
 * precomputed stats, tiny sample). The AI only *chooses* how to chart the
 * data (kind + column mapping + aggregation) and writes the insight text.
 * The actual numbers are computed on the client from the user's file, so
 * values can never be invented here.
 */

interface TableMeta {
  name: string;
  columns: Array<{ name: string; type: 'number' | 'string' | 'date' }>;
  rowCount: number;
  stats: Record<string, { min?: number; max?: number; avg?: number; sum?: number; unique?: number; top?: string }>;
  sample: string[][];
}

interface Req {
  tables?: TableMeta[];
  mermaid?: string;
  language?: string;
  context?: string;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`analyze:${clientKey(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 });
  }
  if (bodyTooLarge(req, 2_000_000)) {
    return NextResponse.json({ error: 'Payload too large — send compact table metadata (max 2 MB).' }, { status: 413 });
  }
  try {
    const body = (await req.json()) as Req;
    const tables = Array.isArray(body.tables) ? body.tables.slice(0, 3) : [];
    const mermaid = sanitizeText(body.mermaid, 3000);
    const language = sanitizeText(body.language, 40) || 'English';
    if (!tables.length && !mermaid) {
      return NextResponse.json({ error: 'No data provided to analyze.' }, { status: 400 });
    }

    const zai = await getZAI();
    const system = `You are a data-visualization expert. You receive already-parsed table metadata (with TRUE aggregate statistics) and/or a Mermaid diagram. You plan how to visualize them. You NEVER invent or compute numbers — you only reference the provided aggregates in prose, and you select chart CONFIG (columns + aggregation). Respond with STRICT JSON only.`;

    const user = tables.length
      ? `Plan 1 chart per table (max 3).
Language: ${language}
Tables:
${JSON.stringify(
  tables.map((t, i) => ({
    tableIndex: i,
    name: t.name,
    columns: t.columns,
    rowCount: t.rowCount,
    stats: t.stats,
    sampleRows: t.sample.slice(0, 5),
  })),
  null,
  1
)}

Choose the most insightful mapping for each table. Rules:
- labelColumn: a low-cardinality string/date column (unique <= 12 ideal).
- valueColumn: a numeric column. aggregation: "none" if rows are already aggregates (e.g. one row per month), else "sum"/"avg".
- limit: 3-8 categories max (keep the most significant via sort desc).
- kind: column/bar for categories, line/area only when labels are ordered time steps, pie/donut only for 3-6 part-of-whole categories.
- insight: ONE specific sentence citing REAL numbers from the provided stats (<=130 chars).
- title: slide chart title (<=60 chars). unit: short suffix like "%", "k USD" (<=8 chars) or omit.

JSON: { "charts": [ { "tableIndex": 0, "kind": "...", "labelColumn": "...", "valueColumn": "...", "aggregation": "...", "limit": 6, "sort": "desc", "unit": "...", "title": "...", "insight": "..." } ] }`
      : `Convert this Mermaid diagram into a structured flow. Keep node labels short (<=30 chars). Language: ${language}.
Mermaid:
${mermaid}

JSON: { "title": string (<=60 chars), "direction": "lr"|"tb", "nodes": [{"id":"a","label":"...","shape":"box"|"pill"|"diamond"}], "edges": [{"from":"a","to":"b","label":"optional"}] }
Max 7 nodes, max 10 edges.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: user },
      ],
      thinking: { type: 'disabled' },
    });
    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<{ charts?: ChartPlan[]; title?: string; direction?: string; nodes?: MermaidPlan['nodes']; edges?: MermaidPlan['edges'] }>(raw);

    // strict sanitize
    const kinds = ['bar', 'column', 'line', 'area', 'pie', 'donut'] as const;
    const aggs = ['none', 'sum', 'avg', 'min', 'max', 'count'] as const;
    const charts = (parsed.charts ?? [])
      .filter((c) => tables[c.tableIndex ?? -1])
      .map((c) => ({
        tableIndex: Math.max(0, Math.min(tables.length - 1, c.tableIndex | 0)),
        kind: kinds.includes(c.kind as never) ? c.kind : 'column',
        labelColumn: String(c.labelColumn ?? ''),
        valueColumn: String(c.valueColumn ?? ''),
        aggregation: aggs.includes(c.aggregation as never) ? c.aggregation : 'sum',
        limit: Math.max(2, Math.min(12, (c.limit | 0) || 6)),
        sort: c.sort === 'asc' || c.sort === 'desc' ? c.sort : 'desc',
        unit: sanitizeText(c.unit, 8) || undefined,
        insight: sanitizeText(c.insight, 140),
        title: sanitizeText(c.title, 70),
      }));

    let diagram: MermaidPlan | undefined;
    if (mermaid && parsed.nodes?.length) {
      diagram = {
        title: sanitizeText(parsed.title, 70) || 'Diagram',
        direction: parsed.direction === 'tb' ? 'tb' : 'lr',
        nodes: (parsed.nodes ?? []).slice(0, 7).map((n, i) => ({
          id: sanitizeText(n.id, 8) || `n${i}`,
          label: sanitizeText(n.label, 34) || `Node ${i + 1}`,
          shape: (['box', 'pill', 'diamond'].includes(String(n.shape)) ? n.shape : 'box') as 'box' | 'pill' | 'diamond',
        })),
        edges: (parsed.edges ?? []).slice(0, 10).map((e) => ({
          from: sanitizeText(e.from, 8),
          to: sanitizeText(e.to, 8),
          label: sanitizeText(e.label, 20) || undefined,
        })),
      };
    }

    // Build a compact data context string for the outline prompt
    const dataContext = tables
      .map((t, i) => {
        const chart = charts.find((c) => c.tableIndex === i);
        return [
          `Dataset "${t.name}": ${t.rowCount} rows, columns: ${t.columns.map((c) => `${c.name}(${c.type})`).join(', ')}.`,
          `Key stats: ${Object.entries(t.stats).slice(0, 6).map(([col, s]) => {
            const bits = [s.min != null ? `min ${s.min}` : null, s.max != null ? `max ${s.max}` : null, s.avg != null ? `avg ${s.avg}` : null, s.sum != null ? `sum ${s.sum}` : null, s.unique != null ? `${s.unique} unique` : null].filter(Boolean);
            return `${col}: ${bits.join(', ')}`;
          }).join('; ')}`,
          chart ? `Planned chart: ${chart.kind} of ${chart.valueColumn} by ${chart.labelColumn} — ${chart.insight}` : '',
        ].filter(Boolean).join(' ');
      })
      .join('\n') + (diagram ? `\nDiagram "${diagram.title}": ${diagram.nodes.length} nodes flow.` : '');

    return NextResponse.json({ charts, diagram, dataContext });
  } catch (err) {
    console.error('data/analyze failed', err);
    return NextResponse.json({ error: 'Could not analyze the data. Please check the file and retry.' }, { status: 500 });
  }
}
