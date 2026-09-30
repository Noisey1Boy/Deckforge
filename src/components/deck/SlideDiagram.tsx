import type { DiagramSpec } from '@/lib/deck/types';

/**
 * Token-driven SVG diagram renderer. Layout: BFS depth layering (left→right
 * or top→bottom), bezier connectors with optional labels. Pure SVG so it
 * also renders in static HTML export.
 */
export function SlideDiagram({ spec }: { spec: DiagramSpec }) {
  const W = 1060;
  const H = 470;
  const dir = spec.direction === 'tb' ? 'tb' : 'lr';

  // --- BFS layering -------------------------------------------------------
  const nodeIds = spec.nodes.map((n) => n.id);
  const idSet = new Set(nodeIds);
  const adj = new Map<string, string[]>(
    spec.nodes.map((n) => [n.id, [] as string[]])
  );
  const indeg = new Map<string, number>(spec.nodes.map((n) => [n.id, 0]));
  for (const e of spec.edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }

  const depth = new Map<string, number>();
  const roots = spec.nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  const queue = [...(roots.length ? roots : nodeIds.slice(0, 1))];
  queue.forEach((id) => depth.set(id, 0));
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const nx of adj.get(cur) ?? []) {
      const nd = (depth.get(cur) ?? 0) + 1;
      if (!depth.has(nx) || depth.get(nx)! < nd) {
        depth.set(nx, nd);
        queue.push(nx);
      }
    }
  }
  nodeIds.forEach((id) => { if (!depth.has(id)) depth.set(id, 0); });

  const maxDepth = Math.max(...[...depth.values()], 0);
  const layers: string[][] = Array.from({ length: maxDepth + 1 }, () => []);
  nodeIds.forEach((id) => layers[depth.get(id)!].push(id));

  // --- positions ----------------------------------------------------------
  const pos = new Map<string, { x: number; y: number }>();
  const NW = 172;
  const NH = 64;
  layers.forEach((layer, d) => {
    const n = layer.length;
    const span = dir === 'lr' ? H : W;
    const gap = span / (n + 1);
    layer.forEach((id, i) => {
      const along = gap * (i + 1);
      if (dir === 'lr') {
        const across = ((d + 1) / (maxDepth + 2)) * W;
        pos.set(id, { x: across - NW / 2, y: along - NH / 2 });
      } else {
        const across = ((d + 1) / (maxDepth + 2)) * H;
        pos.set(id, { x: along - NW / 2, y: across - NH / 2 });
      }
    });
  });

  const anchor = (id: string) => {
    const p = pos.get(id);
    if (!p) return null;
    return {
      cx: p.x + NW / 2,
      cy: p.y + NH / 2,
      l: p.x, r: p.x + NW, t: p.y, b: p.y + NH,
    };
  };

  const nodeShape = (shape: 'box' | 'pill' | 'diamond' | undefined, x: number, y: number) => {
    if (shape === 'diamond') {
      return `${x + NW / 2},${y} ${x + NW},${y + NH / 2} ${x + NW / 2},${y + NH} ${x},${y + NH / 2}`;
    }
    return null;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: '100%' }}
      role="img"
      aria-label="Diagram"
    >
      <defs>
        <marker id="df-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--s-primary)" />
        </marker>
      </defs>

      {spec.edges.map((e, i) => {
        const a = anchor(e.from);
        const b = anchor(e.to);
        if (!a || !b) return null;
        let x1: number, y1: number, x2: number, y2: number;
        if (dir === 'lr') {
          const forward = b.cx >= a.cx;
          x1 = forward ? a.r : a.l;
          x2 = forward ? b.l : b.r;
          y1 = a.cy;
          y2 = b.cy;
        } else {
          const forward = b.cy >= a.cy;
          x1 = a.cx;
          x2 = b.cx;
          y1 = forward ? a.b : a.t;
          y2 = forward ? b.t : b.b;
        }
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const d =
          dir === 'lr'
            ? `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
            : `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="var(--s-primary)" strokeWidth={2} opacity={0.65} markerEnd="url(#df-arrow)" />
            {e.label ? (
              <text
                x={mx}
                y={my - 8}
                textAnchor="middle"
                fontSize={13}
                fill="var(--s-muted)"
                fontFamily="var(--s-font-mono)"
              >
                {e.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {spec.nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        const dia = nodeShape(n.shape, p.x, p.y);
        return (
          <g key={n.id}>
            {dia ? (
              <polygon points={dia} fill="var(--s-surface)" stroke="var(--s-primary)" strokeWidth={2} />
            ) : (
              <rect
                x={p.x}
                y={p.y}
                width={NW}
                height={NH}
                rx={n.shape === 'pill' ? NH / 2 : 12}
                fill="var(--s-surface)"
                stroke="var(--s-border)"
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }}
              />
            )}
            <foreignObject x={p.x} y={p.y} width={NW} height={NH}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '4px 8px',
                  color: 'var(--s-text)',
                  fontSize: 15,
                  lineHeight: 1.25,
                  fontWeight: 600,
                  fontFamily: 'var(--s-font-body)',
                  pointerEvents: 'none',
                }}
              >
                {n.label}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
