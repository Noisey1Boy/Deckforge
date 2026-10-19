'use client';

import { isValidElement, cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import type { ChartSpec } from '@/lib/deck/types';

export interface SlideChartProps {
  spec: ChartSpec;
  /** Fixed pixel size for static export (ResponsiveContainer cannot measure there). */
  fixed?: { width: number; height: number };
}

function FixedBox({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  return (
    <div style={{ width, height }}>
      <div style={{ width, height, position: 'relative' }}>{children}</div>
    </div>
  );
}

/** Chooses between measurable container (browser) and fixed box (static export). */
function ChartSizer({ fixed, children }: { fixed?: { width: number; height: number }; children: React.ReactNode }) {
  if (fixed && isValidElement(children)) {
    return (
      <FixedBox width={fixed.width} height={fixed.height}>
        {cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          width: fixed.width,
          height: fixed.height,
        })}
      </FixedBox>
    );
  }
  return <BrowserSizer>{children}</BrowserSizer>;
}

/**
 * Mounts ResponsiveContainer only once the wrapper has real, non-zero size —
 * recharts warns (and mis-renders) when measured at 0×0, which happens in
 * thumbnail grids, hidden tabs and animated entrances. A single rAF is not
 * always enough, so a ResizeObserver waits until the box is measurable.
 */
function BrowserSizer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measurable = () => el.clientWidth > 0 && el.clientHeight > 0;
    if (measurable()) {
      const id = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(id);
    }
    const ro = new ResizeObserver(() => {
      if (measurable()) setReady(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {ready ? <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer> : null}
    </div>
  );
}

/**
 * Theme-driven chart renderer. Colors come from CSS vars set by the active
 * theme so charts re-theme instantly with the rest of the deck.
 * Fixed height + ResponsiveContainer: works in editor, present mode, and
 * static HTML export (export falls back to a fixed 840px viewport).
 */
export function SlideChart({ spec, fixed }: SlideChartProps) {
  const palette = useMemo(
    () => [1, 2, 3, 4, 5, 6].map((i) => `var(--s-chart-${i}, #888)`),
    []
  );
  const axis = 'var(--s-chart-axis, #666)';
  const grid = 'var(--s-chart-grid, #eee)';

  const hasMulti = spec.series && spec.series.length > 0;
  const multiData = useMemo(() => {
    if (!hasMulti) return [];
    const cats = spec.data.map((d) => d.label);
    return cats.map((label, i) => {
      const row: Record<string, string | number> = { label };
      spec.series!.forEach((s) => {
        row[s.name] = s.points[i] ?? 0;
      });
      return row;
    });
  }, [hasMulti, spec]);

  const tooltipStyle = {
    background: 'var(--s-surface, #fff)',
    border: '1px solid var(--s-border, #ddd)',
    borderRadius: 10,
    color: 'var(--s-text, #111)',
    fontSize: 13,
  } as const;

  const tick = { fill: axis, fontSize: 13 };
  const unit = spec.unit ? ` ${spec.unit}` : '';

  if (hasMulti && (spec.kind === 'line' || spec.kind === 'area' || spec.kind === 'column')) {
    if (spec.kind === 'line') {
      return (
        <ChartSizer fixed={fixed}>
        <LineChart data={multiData} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={tick} stroke="transparent" />
            <YAxis tick={tick} stroke="transparent" width={52} />
            <Legend wrapperStyle={{ fontSize: 13, color: axis }} />
            {spec.series!.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={palette[i % palette.length]}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 0, fill: palette[i % palette.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
      </ChartSizer>
      );
    }
    if (spec.kind === 'area') {
      return (
        <ChartSizer fixed={fixed}>
        <AreaChart data={multiData} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={tick} stroke="transparent" />
            <YAxis tick={tick} stroke="transparent" width={52} />
            <Legend wrapperStyle={{ fontSize: 13, color: axis }} />
            {spec.series!.map((s, i) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={palette[i % palette.length]}
                fill={palette[i % palette.length]}
                fillOpacity={0.22}
                strokeWidth={2.5}
              />
            ))}
          </AreaChart>
      </ChartSizer>
      );
    }
    return (
      <ChartSizer fixed={fixed}>
        <BarChart data={multiData} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={tick} stroke="transparent" />
          <YAxis tick={tick} stroke="transparent" width={52} />
          <Legend wrapperStyle={{ fontSize: 13, color: axis }} />
          {spec.series!.map((s, i) => (
            <Bar
              key={s.name}
              dataKey={s.name}
              fill={palette[i % palette.length]}
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
            />
          ))}
        </BarChart>
      </ChartSizer>
    );
  }

  const single = spec.data;

  if (spec.kind === 'pie' || spec.kind === 'donut') {
    return (
      <ChartSizer fixed={fixed}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={single}
            dataKey="value"
            nameKey="label"
            innerRadius={spec.kind === 'donut' ? '52%' : 0}
            outerRadius="78%"
            paddingAngle={2}
            label={({ name }) => name}
            labelLine={{ stroke: grid }}
            stroke="var(--s-bg, #fff)"
            strokeWidth={2}
          >
            {single.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartSizer>
    );
  }

  if (spec.kind === 'line') {
    return (
      <ChartSizer fixed={fixed}>
        <LineChart data={single} margin={{ top: 14, right: 20, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={tick} stroke="transparent" />
          <YAxis tick={tick} stroke="transparent" width={52} unit={spec.unit} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={palette[0]}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 0, fill: palette[0] }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartSizer>
    );
  }

  if (spec.kind === 'area') {
    return (
      <ChartSizer fixed={fixed}>
        <AreaChart data={single} margin={{ top: 14, right: 20, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={tick} stroke="transparent" />
          <YAxis tick={tick} stroke="transparent" width={52} unit={spec.unit} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={palette[0]}
            fill={palette[0]}
            fillOpacity={0.22}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ChartSizer>
    );
  }

  if (spec.kind === 'bar') {
    // horizontal bars
    return (
      <ChartSizer fixed={fixed}>
        <BarChart data={single} layout="vertical" margin={{ top: 8, right: 28, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={grid} strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" tick={tick} stroke="transparent" unit={spec.unit} />
          <YAxis type="category" dataKey="label" tick={tick} stroke="transparent" width={140} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={36}>
            {single.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartSizer>
    );
  }

  // default: column
  return (
    <ChartSizer fixed={fixed}>
      <BarChart data={single} margin={{ top: 14, right: 18, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" tick={tick} stroke="transparent" interval={0} />
        <YAxis tick={tick} stroke="transparent" width={52} unit={spec.unit} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
          {single.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartSizer>
  );
}
