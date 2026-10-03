'use client';

import './deck.css';
import type { CSSProperties } from 'react';
import type { Slide, ThemeManifest } from '@/lib/deck/types';
import { fitFactor } from '@/lib/deck/limits';
import { themeToCssVars, chartPaletteVars } from '@/lib/design/css-vars';
import { SlideChart } from './SlideChart';
import { SlideDiagram } from './SlideDiagram';

export interface SlideViewProps {
  slide: Slide;
  theme: ThemeManifest;
  deckTitle?: string;
  index?: number;
  pageCount?: number;
  showFooter?: boolean;
  /** Render the "01 / 10" counter in the footer (default true). */
  showPageNumbers?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Render charts at fixed pixel size (used by static HTML export). */
  fixedCharts?: boolean;
}

/** Small helpers ---------------------------------------------------------- */
function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="s-kicker">{children}</div>;
}

function Decor({ theme }: { theme: ThemeManifest }) {
  switch (theme.tokens.decor) {
    case 'rule-top':
      return <div className="slide-decor decor-rule-top" aria-hidden />;
    case 'bar-left':
      return <div className="slide-decor decor-bar-left" aria-hidden />;
    case 'corner':
      return <div className="slide-decor decor-corner" aria-hidden />;
    case 'band':
      return <div className="slide-decor decor-band" aria-hidden />;
    case 'dots':
      return <div className="slide-decor decor-dots" aria-hidden />;
    case 'frame':
      return <div className="slide-decor decor-frame" aria-hidden />;
    default:
      return null;
  }
}

function Footer({
  deckTitle,
  index,
  pageCount,
  showPageNumbers = true,
}: {
  deckTitle?: string;
  index?: number;
  pageCount?: number;
  showPageNumbers?: boolean;
}) {
  return (
    <div className="slide-footer" aria-hidden>
      <span>{deckTitle ?? ''}</span>
      {showPageNumbers && typeof index === 'number' && typeof pageCount === 'number' ? (
        <span className="page-no">
          {String(index + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}
        </span>
      ) : null}
    </div>
  );
}

function truncate(s: string | undefined, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// --------------------------------------------------------------------------
// Layouts
// --------------------------------------------------------------------------
function TitleLayout({ slide }: { slide: Slide }) {
  return (
    <div className="slide-pad">
      <div className="lay-title-wrap">
        {slide.subtitle ? <Kicker>{truncate(slide.subtitle, 110)}</Kicker> : null}
        <h1 className="s-display">{truncate(slide.title, 90) || 'Untitled deck'}</h1>
        <div className="lay-title-rule" aria-hidden />
        {slide.body ? <p className="s-body s-muted" style={{ maxWidth: 720 }}>{truncate(slide.body, 160)}</p> : null}
      </div>
    </div>
  );
}

function SectionLayout({ slide, index }: { slide: Slide; index?: number }) {
  return (
    <div className="slide-pad">
      <div className="lay-section">
        <div className="section-index">
          {typeof index === 'number' ? `SECTION ${String(index).padStart(2, '0')}` : 'SECTION'}
        </div>
        <h1 className="s-display">{truncate(slide.title, 80)}</h1>
        <div className="section-rule" aria-hidden />
        {slide.subtitle ? (
          <p className="s-body s-muted" style={{ maxWidth: 760 }}>{truncate(slide.subtitle, 120)}</p>
        ) : null}
      </div>
    </div>
  );
}

function BulletsLayout({ slide }: { slide: Slide }) {
  return (
    <div className="slide-pad">
      <h1 className="s-h1">{truncate(slide.title, 90)}</h1>
      {slide.body ? (
        <p className="s-body s-muted" style={{ marginTop: 'calc(var(--s-block) * 0.5)', maxWidth: 920 }}>
          {truncate(slide.body, 200)}
        </p>
      ) : null}
      <ul className="bullet-list" style={{ marginTop: 'calc(var(--s-block) * 1.2)' }}>
        {(slide.bullets ?? []).slice(0, 7).map((b, i) => (
          <li key={i}>{truncate(b, 110)}</li>
        ))}
      </ul>
    </div>
  );
}

function TwoColumnLayout({ slide }: { slide: Slide }) {
  return (
    <div className="slide-pad">
      <h1 className="s-h1">{truncate(slide.title, 90)}</h1>
      <div className="cols-2">
        <div className="col-card accent-top">
          {slide.leftTitle ? <h2 className="s-h3">{truncate(slide.leftTitle, 50)}</h2> : null}
          <ul className="col-list">
            {(slide.leftContent ?? []).slice(0, 5).map((c, i) => (
              <li key={i}>{truncate(c, 90)}</li>
            ))}
          </ul>
        </div>
        <div className="col-card accent-top alt">
          {slide.rightTitle ? <h2 className="s-h3">{truncate(slide.rightTitle, 50)}</h2> : null}
          <ul className="col-list">
            {(slide.rightContent ?? []).slice(0, 5).map((c, i) => (
              <li key={i}>{truncate(c, 90)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ImageLayout({ slide }: { slide: Slide }) {
  const url = slide.image?.url;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--s-bg-alt)' }}>
      {url ? (
        <img className="slide-img" src={url} alt={slide.image?.alt || ''} />
      ) : null}
      <div className="img-overlay" aria-hidden />
      <div className="img-content">
        {slide.subtitle ? <Kicker>{truncate(slide.subtitle, 80)}</Kicker> : null}
        <h1 className="s-h1">{truncate(slide.title, 90)}</h1>
        {slide.body ? <p className="s-body" style={{ maxWidth: 760 }}>{truncate(slide.body, 160)}</p> : null}
      </div>
      {slide.image?.credit ? <div className="img-credit">{slide.image.credit}</div> : null}
    </div>
  );
}

function QuoteLayout({ slide }: { slide: Slide }) {
  return (
    <div className="slide-pad">
      <div className="lay-quote">
        <div className="quote-mark" aria-hidden>&ldquo;</div>
        <blockquote className="quote-text" style={{ margin: 0 }}>
          {truncate(slide.quote || slide.title, 260)}
        </blockquote>
        {slide.attribution ? <div className="quote-attrib">{slide.attribution}</div> : null}
      </div>
    </div>
  );
}

function StatsLayout({ slide }: { slide: Slide }) {
  const stats = (slide.stats ?? []).slice(0, 4);
  return (
    <div className="slide-pad">
      <h1 className="s-h1">{truncate(slide.title, 90)}</h1>
      {slide.body ? <p className="s-body s-muted" style={{ marginTop: 8 }}>{truncate(slide.body, 140)}</p> : null}
      <div className="stats-grid" style={{ gridTemplateColumns: `repeat(${Math.max(stats.length, 1)}, minmax(0,1fr))` }}>
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-value">{truncate(s.value, 14)}</div>
            <div className="stat-label">{truncate(s.label, 44)}</div>
            {s.context ? <div className="stat-context">{truncate(s.context, 80)}</div> : null}
          </div>
        ))}
      </div>
      {slide.illustrative ? (
        <p className="stat-note" style={{ marginTop: 14 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden style={{ display: 'inline', verticalAlign: '-1px', marginRight: 5 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><circle cx="12" cy="16.6" r="0.4" fill="currentColor" /></svg>
          Illustrative figures — replace with your own data
        </p>
      ) : null}
    </div>
  );
}

function ChartLayout({ slide, fixedCharts }: { slide: Slide; fixedCharts?: boolean }) {
  if (!slide.chart) return <BulletsLayout slide={slide} />;
  return (
    <div className="slide-pad">
      <h1 className="s-h1">{truncate(slide.title, 90)}</h1>
      <div className="chart-area">
        <div className="chart-box">
          <SlideChart spec={slide.chart} fixed={fixedCharts ? { width: 780, height: 420 } : undefined} />
        </div>
        {slide.chart.insight ? (
          <aside className="chart-insight">
            <span className="pill">Insight</span>
            <p>{truncate(slide.chart.insight, 130)}</p>
            {slide.chart.source ? <div className="chart-source">{slide.chart.source}</div> : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function DiagramLayout({ slide }: { slide: Slide }) {
  if (!slide.diagram) return <BulletsLayout slide={slide} />;
  return (
    <div className="slide-pad">
      <h1 className="s-h1">{truncate(slide.title, 90)}</h1>
      {slide.body ? <p className="s-body s-muted" style={{ marginTop: 6 }}>{truncate(slide.body, 140)}</p> : null}
      <div className="diagram-area">
        <SlideDiagram spec={slide.diagram} />
      </div>
    </div>
  );
}

function ComparisonLayout({ slide }: { slide: Slide }) {
  if (!slide.comparison) return <BulletsLayout slide={slide} />;
  const rows = slide.comparison.rows.slice(0, 5);
  return (
    <div className="slide-pad">
      <h1 className="s-h1">{truncate(slide.title, 90)}</h1>
      <div className="compare-grid">
        <div className="compare-header">
          <div className="cell lead">Compare</div>
          <div className="cell">{truncate(slide.comparison.headers[0], 30)}</div>
          <div className="cell">{truncate(slide.comparison.headers[1], 30)}</div>
        </div>
        {rows.map((r, i) => (
          <div className="compare-row" key={i}>
            <div className="cell label">{truncate(r.label, 32)}</div>
            <div className="cell">{truncate(r.left, 80)}</div>
            <div className="cell">{truncate(r.right, 80)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClosingLayout({ slide }: { slide: Slide }) {
  return (
    <div className="slide-pad">
      <div className="lay-closing">
        {slide.subtitle ? <div className="closing-chip">{truncate(slide.subtitle, 60)}</div> : null}
        <h1 className="s-display">{truncate(slide.title, 80)}</h1>
        {slide.bullets && slide.bullets.length > 0 ? (
          <div className="closing-list">
            {slide.bullets.slice(0, 3).map((b, i) => (
              <span key={i}>{truncate(b, 60)}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Root
// --------------------------------------------------------------------------
export function SlideView({ slide, theme, deckTitle, index, pageCount, showFooter = true, showPageNumbers = true, className, style, fixedCharts }: SlideViewProps) {
  const fit = fitFactor(slide);
  const vars: CSSProperties = {
    ...themeToCssVars(theme),
    ...chartPaletteVars(theme),
    ...(fit < 1 ? { ['--s-fit' as string]: String(fit) } : {}),
    ...style,
  };

  return (
    <div
      className={`slide ${className ?? ''}`}
      style={vars}
      role="group"
      aria-label={`Slide ${(index ?? 0) + 1}: ${slide.title || slide.layout}`}
    >
      {slide.layout !== 'image' ? <Decor theme={theme} /> : null}

      {slide.layout === 'title' && <TitleLayout slide={slide} />}
      {slide.layout === 'section' && <SectionLayout slide={slide} index={index} />}
      {slide.layout === 'bullets' && <BulletsLayout slide={slide} />}
      {slide.layout === 'two-column' && <TwoColumnLayout slide={slide} />}
      {slide.layout === 'image' && <ImageLayout slide={slide} />}
      {slide.layout === 'quote' && <QuoteLayout slide={slide} />}
      {slide.layout === 'stats' && <StatsLayout slide={slide} />}
      {slide.layout === 'chart' && <ChartLayout slide={slide} fixedCharts={fixedCharts} />}
      {slide.layout === 'diagram' && <DiagramLayout slide={slide} />}
      {slide.layout === 'comparison' && <ComparisonLayout slide={slide} />}
      {slide.layout === 'closing' && <ClosingLayout slide={slide} />}

      {showFooter && slide.layout !== 'image' ? (
        <Footer deckTitle={deckTitle} index={index} pageCount={pageCount} showPageNumbers={showPageNumbers} />
      ) : null}
    </div>
  );
}
