import type { CSSProperties } from 'react';
import type { ThemeManifest } from '@/lib/deck/types';

/**
 * Compile ThemeTokens into CSS custom properties. Slide components consume
 * ONLY these variables — swapping `style` re-themes a whole deck instantly.
 */
export function themeToCssVars(theme: ThemeManifest): CSSProperties {
  const t = theme.tokens;
  const vars: Record<string, string> = {
    '--s-bg': t.colors.bg,
    '--s-bg-alt': t.colors.bgAlt,
    '--s-surface': t.colors.surface,
    '--s-text': t.colors.text,
    '--s-muted': t.colors.textMuted,
    '--s-primary': t.colors.primary,
    '--s-primary-contrast': t.colors.primaryContrast,
    '--s-accent': t.colors.accent,
    '--s-border': t.colors.border,
    '--s-font-display': t.fonts.display,
    '--s-font-body': t.fonts.body,
    '--s-font-mono': t.fonts.mono,
    '--s-ts-display': `${t.typeScale.display}px`,
    '--s-ts-h1': `${t.typeScale.h1}px`,
    '--s-ts-h2': `${t.typeScale.h2}px`,
    '--s-ts-h3': `${t.typeScale.h3}px`,
    '--s-ts-body': `${t.typeScale.body}px`,
    '--s-ts-caption': `${t.typeScale.caption}px`,
    '--s-pad': `${t.spacing.slide}px`,
    '--s-gutter': `${t.spacing.gutter}px`,
    '--s-block': `${t.spacing.block}px`,
    '--s-radius-sm': `${t.radius.sm}px`,
    '--s-radius-md': `${t.radius.md}px`,
    '--s-radius-lg': `${t.radius.lg}px`,
    '--s-shadow-soft': t.shadow.soft,
    '--s-shadow-card': t.shadow.card,
    '--s-chart-1': t.chart.palette[0],
    '--s-chart-2': t.chart.palette[1],
    '--s-chart-grid': t.chart.grid,
    '--s-chart-axis': t.chart.axis,
    '--s-motion-duration': `${t.motion.duration}s`,
  };
  return vars as CSSProperties;
}

export const CHART_PALETTE_VAR = '--s-chart-palette';

/** Palette accessible to Recharts via var(--s-chart-N). */
export function chartPaletteVars(theme: ThemeManifest): CSSProperties {
  const vars: Record<string, string> = {};
  theme.tokens.chart.palette.forEach((c, i) => {
    vars[`--s-chart-${i + 1}`] = c;
  });
  return vars as CSSProperties;
}
