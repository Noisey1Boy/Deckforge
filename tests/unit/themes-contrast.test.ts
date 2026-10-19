import { describe, expect, it } from 'vitest';
import { THEMES } from '@/lib/design/themes';

/**
 * Automated WCAG 2.1 contrast check for every design-system theme (P3 audit:
 * the old manual wave2-contrast evidence, now a regression test).
 *
 * Gates (sRGB, WCAG relative luminance):
 *  - body text on bg / bgAlt / surface ≥ 4.5  (AA normal text)
 *  - muted text on bg ≥ 3.5                   (captions — lenient but bounded)
 *  - primaryText on bg ≥ 4.5                  (accent-colored headings/links)
 *  - primaryContrast on primary ≥ 4.5         (button labels)
 */

function parseColor(raw: string): [number, number, number] {
  const v = raw.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = v.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => parseFloat(p));
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  }
  throw new Error(`Unparseable color token: "${raw}"`);
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(rgb: [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(parseColor(a));
  const lb = luminance(parseColor(b));
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme catalog integrity', () => {
  it('exposes at least 20 fully-formed design systems', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  });
});

describe('WCAG 2.1 contrast — all themes', () => {
  for (const theme of THEMES) {
    describe(theme.id, () => {
      const c = theme.tokens.colors;

      it('body text reads on every surface', () => {
        expect(contrastRatio(c.text, c.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(c.text, c.bgAlt)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(c.text, c.surface)).toBeGreaterThanOrEqual(4.5);
      });

      it('muted text stays legible on bg', () => {
        expect(contrastRatio(c.textMuted, c.bg)).toBeGreaterThanOrEqual(3.5);
      });

      it('accent-tinted text reads on bg', () => {
        const accentText = c.primaryText ?? c.primary;
        expect(contrastRatio(accentText, c.bg)).toBeGreaterThanOrEqual(4.5);
      });

      it('button labels read on their primary fill', () => {
        expect(contrastRatio(c.primaryContrast, c.primary)).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});
