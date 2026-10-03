/** Shared types for the data → visualization planning step. */

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

export interface MermaidPlan {
  title: string;
  direction: 'lr' | 'tb';
  nodes: Array<{ id: string; label: string; shape?: 'box' | 'pill' | 'diamond' }>;
  edges: Array<{ from: string; to: string; label?: string }>;
}
