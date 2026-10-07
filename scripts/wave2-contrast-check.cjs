#!/usr/bin/env node
/**
 * Wave-2 (T-1) WCAG contrast evidence for the 8 new themes.
 * Plain relLuminance math (WCAG 2.1). Rules:
 *   - primary on bg + surface  >= 4.5  (aim >= 5)
 *   - accent-as-text on bg     >= 4.5  (all wave-2 accents are decorative-only:
 *                                      advisory 3:1 non-text target, primaryText
 *                                      fallback governs any text use)
 *   - text / textMuted on bg + surface >= 4.5
 *   - primaryContrast on primary >= 4.5
 *   - every chart series >= 3.0 on surface AND on bg
 * Prints SUGGEST lines with a stepped fix for anything below target.
 * Exit 1 on any failure.
 */
const THEMES = {
  'tokyo-night': {
    bg: '#1a1b26', bgAlt: '#16161e', surface: '#24283b', text: '#c0caf5', textMuted: '#a9b1d6',
    primary: '#7aa2f7', primaryContrast: '#1a1b26', accent: '#bb9af7', accentAsText: false,
    chart: ['#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a', '#e0af68', '#f7768e'],
  },
  'pixel-orbit': {
    bg: '#0a0e27', bgAlt: '#0f1b3d', surface: '#0f1b3d', text: '#e2d5f2', textMuted: '#8f96c9',
    primary: '#5edcf4', primaryContrast: '#0a0e27', accent: '#f0a6ca', accentAsText: false,
    chart: ['#5edcf4', '#f0a6ca', '#f4d03f', '#e2d5f2', '#9aa8e8', '#b8a6f0'],
  },
  vellum: {
    bg: '#2a3870', bgAlt: '#343f80', surface: '#343f80', text: '#e8d85c', textMuted: '#c2bd8c',
    primary: '#e8d85c', primaryContrast: '#2a3870', accent: '#5f9d9d', accentAsText: false,
    chart: ['#e8d85c', '#9fd8cf', '#f0e6a0', '#c8c4e8', '#7fc8bc', '#e8a4a4'],
  },
  'retro-win95': {
    bg: '#c0c0c0', bgAlt: '#d4d0c8', surface: '#d4d0c8', text: '#000000', textMuted: '#404040',
    primary: '#000080', primaryContrast: '#ffffff', accent: '#008080', accentAsText: false,
    chart: ['#000080', '#800000', '#007600', '#666600', '#007070', '#222222'],
  },
  'neo-brutalist': {
    bg: '#fffef0', bgAlt: '#fffbd0', surface: '#ffffff', text: '#000000', textMuted: '#555555',
    primary: '#000000', primaryContrast: '#fffef0', accent: '#ffd400', accentAsText: false,
    chart: ['#000000', '#ec559b', '#3a7cff', '#00a160', '#c96f00', '#555555'],
  },
  'sakura-chroma': {
    bg: '#f1e6cb', bgAlt: '#e5d6b0', surface: '#f6efd9', text: '#3a2516', textMuted: '#71604f',
    primary: '#b7271b', primaryContrast: '#f6efd9', accent: '#3c84ba', accentAsText: false,
    chart: ['#b7271b', '#3c84ba', '#378f40', '#c26f0f', '#c22e6f', '#3a2516'],
  },
  'cobalt-grid': {
    bg: '#f0ebde', bgAlt: '#e6e0ce', surface: '#f5f1e4', text: '#1f2be0', textMuted: '#454dc2',
    primary: '#1f2be0', primaryContrast: '#ffffff', accent: '#5560e5', accentAsText: false,
    chart: ['#1f2be0', '#0f1740', '#5560e5', '#2e3a9e', '#6e6a5a', '#8a5cc8'],
  },
  'pastel-card': {
    bg: '#fef8f1', bgAlt: '#fff1ea', surface: '#ffffff', text: '#2a2340', textMuted: '#5b5470',
    primary: '#6f54b4', primaryContrast: '#ffffff', accent: '#f48b5c', accentAsText: false,
    chart: ['#6f54b4', '#4e7ed6', '#2e9d70', '#c94673', '#b48309', '#d96f2f'],
  },
};

function expand(hex) {
  const h = hex.replace('#', '');
  return h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
}
function relLum(hex) {
  const n = parseInt(expand(hex), 16);
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
function ratio(a, b) {
  const la = relLum(a), lb = relLum(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function mixBlack(hex, t) {
  const n = parseInt(expand(hex), 16);
  const ch = (v) => Math.round(v * (1 - t));
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function stepToward(hex, bg, target) {
  if (ratio(hex, bg) >= target) return { hex, adjusted: false, value: ratio(hex, bg) };
  for (let i = 1; i <= 40; i++) {
    const cand = mixBlack(hex, i / 40);
    if (ratio(cand, bg) >= target) return { hex: cand, adjusted: true, value: ratio(cand, bg) };
  }
  return { hex: '#000000', adjusted: true, value: ratio('#000000', bg) };
}

let failures = 0;
const rows = [];
for (const [id, t] of Object.entries(THEMES)) {
  const r = ratio;
  const checks = [
    ['primary/bg', r(t.primary, t.bg), 4.5],
    ['primary/surface', r(t.primary, t.surface), 4.5],
    ['text/bg', r(t.text, t.bg), 4.5],
    ['muted/bg', r(t.textMuted, t.bg), 4.5],
    ['muted/surface', r(t.textMuted, t.surface), 4.5],
    ['pContrast/primary', r(t.primaryContrast, t.primary), 4.5],
  ];
  if (t.accentAsText) checks.push(['accent-as-text/bg', r(t.accent, t.bg), 4.5]);
  const chartSf = t.chart.map((c) => ['chart ' + c + '/surface', r(c, t.surface), 3]);
  const chartBg = t.chart.map((c) => ['chart ' + c + '/bg', r(c, t.bg), 3]);
  const all = [...checks, ...chartSf, ...chartBg];
  const bad = all.filter(([, v, min]) => v < min);
  if (bad.length) failures += bad.length;
  rows.push({
    id,
    'primary/bg': r(t.primary, t.bg).toFixed(2),
    'accent/bg (deco, adv 3)': r(t.accent, t.bg).toFixed(2),
    'muted/bg': r(t.textMuted, t.bg).toFixed(2),
    'chartMin/surface': Math.min(...t.chart.map((c) => r(c, t.surface))).toFixed(2),
    'chartMin/bg': Math.min(...t.chart.map((c) => r(c, t.bg))).toFixed(2),
    failures: bad.map(([n, v, m]) => `${n}=${v.toFixed(2)}<${m}`).join('; ') || 'none',
  });
}
console.table(rows);
for (const [id, t] of Object.entries(THEMES)) {
  t.chart.forEach((c, i) => {
    for (const bgName of ['surface', 'bg']) {
      const bg = t[bgName];
      if (ratio(c, bg) < 3) {
        const s = stepToward(c, bg, 3.2);
        console.log(`SUGGEST ${id} chart[${i}] ${c} on ${bgName} -> ${s.hex} (${s.value.toFixed(2)})`);
      }
    }
  });
  for (const bgName of ['bg', 'surface']) {
    const bg = t[bgName];
    if (ratio(t.primary, bg) < 4.5) {
      const s = stepToward(t.primary, bg, 5.0);
      console.log(`SUGGEST ${id} primary ${t.primary} on ${bgName} -> ${s.hex} (${s.value.toFixed(2)})`);
    }
    if (ratio(t.textMuted, bg) < 4.5) {
      // try both directions: toward black for light bg, toward white for dark bg
      const dark = stepToward(t.textMuted, bg, 4.7);
      let best = dark;
      const n = parseInt(expand(t.textMuted).slice(0), 16);
      for (let i = 1; i <= 40; i++) {
        const t2 = i / 40;
        const c = (v) => Math.round(v + (255 - v) * t2);
        const r2 = (n >> 16) & 255, g2 = (n >> 8) & 255, b2 = n & 255;
        const cand = '#' + ((c(r2) << 16) | (c(g2) << 8) | c(b2)).toString(16).padStart(6, '0');
        if (ratio(cand, bg) >= 4.7) { best = { hex: cand, value: ratio(cand, bg) }; break; }
      }
      console.log(`SUGGEST ${id} textMuted ${t.textMuted} on ${bgName} -> dark:${dark.hex}(${dark.value.toFixed(2)}) light:${best.hex}(${best.value.toFixed(2)})`);
    }
  }
}
console.log(failures === 0 ? 'ALL CHECKS PASS' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
