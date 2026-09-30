'use client';

import PptxGenJS from 'pptxgenjs';
import type { Deck, Slide } from '@/lib/deck/types';
import { getTheme } from '@/lib/design/themes';

/**
 * PPTX export with the deck's theme fonts, colors and chart palette applied.
 * Charts are exported as native editable PowerPoint charts.
 * Canvas: 13.333 x 7.5 in (16:9).
 */
export async function exportPptx(deck: Deck): Promise<void> {
  const theme = getTheme(deck.themeId);
  const c = theme.tokens.colors;
  const ts = theme.tokens.typeScale;
  const px2in = (px: number) => px / 96; // canvas px -> inches (96dpi logical)
  const PAD = theme.tokens.spacing.slide;
  const W = 13.333;
  const H = 7.5;

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'DF16x9', width: W, height: H });
  pptx.layout = 'DF16x9';
  pptx.title = deck.title;
  pptx.author = 'DeckForge AI';

  const displayFont = theme.tokens.fonts.display.split(',')[0].replace(/['"]/g, '').trim() || 'Inter';
  const bodyFont = theme.tokens.fonts.body.split(',')[0].replace(/['"]/g, '').trim() || 'Inter';
  const pt = (px: number) => Math.round(px * 0.75); // px -> pt

  const footer = (slide: PptxGenJS.Slide, index: number) => {
    slide.background = { color: c.bg.replace('#', '') };
    slide.addText(String(index + 1).padStart(2, '0'), {
      x: W - 0.7, y: H - 0.42, w: 0.5, h: 0.3,
      fontSize: pt(ts.caption), color: c.textMuted.replace('#', ''), fontFace: bodyFont, align: 'right',
    });
    slide.addText(deck.title.slice(0, 60), {
      x: px2in(PAD), y: H - 0.42, w: 6, h: 0.3,
      fontSize: pt(ts.caption), color: c.textMuted.replace('#', ''), fontFace: bodyFont, align: 'left',
    });
  };

  const titleBox = (slide: PptxGenJS.Slide, text: string, opts: Partial<PptxGenJS.TextProps> = {}) => {
    slide.addText(text, {
      x: px2in(PAD), y: px2in(PAD), w: W - 2 * px2in(PAD), h: 1.1,
      fontSize: pt(ts.h1), bold: true, color: c.text.replace('#', ''), fontFace: displayFont, ...opts,
    });
  };

  deck.slides.forEach((s: Slide, i: number) => {
    const slide = pptx.addSlide();
    slide.background = { color: c.bg.replace('#', '') };
    const primary = c.primary.replace('#', '');

    switch (s.layout) {
      case 'title': {
        if (s.subtitle) slide.addText(s.subtitle.toUpperCase(), { x: px2in(PAD), y: 2.0, w: W - 2 * px2in(PAD), h: 0.4, fontSize: pt(ts.caption), color: primary, fontFace: bodyFont, charSpacing: 4 });
        slide.addText(s.title ?? deck.title, { x: px2in(PAD), y: 2.5, w: W - 2 * px2in(PAD), h: 1.8, fontSize: pt(ts.display), bold: true, color: c.text.replace('#', ''), fontFace: displayFont });
        slide.addShape('rect', { x: px2in(PAD), y: 4.5, w: 1.0, h: 0.06, fill: { color: primary } });
        break;
      }
      case 'section': {
        slide.addText(`SECTION ${String(i).padStart(2, '0')}`, { x: px2in(PAD), y: 2.3, w: 4, h: 0.4, fontSize: pt(ts.h3), color: primary, fontFace: bodyFont, charSpacing: 4 });
        slide.addText(s.title ?? '', { x: px2in(PAD), y: 2.8, w: W - 2 * px2in(PAD), h: 1.6, fontSize: pt(ts.display), bold: true, color: c.text.replace('#', ''), fontFace: displayFont });
        break;
      }
      case 'bullets': {
        if (s.title) titleBox(slide, s.title);
        (s.bullets ?? []).forEach((b, bi) => {
          slide.addShape('roundRect', { x: px2in(PAD), y: 2.15 + bi * 0.72, w: 0.16, h: 0.16, rectRadius: 0.03, fill: { color: primary } });
          slide.addText(b, { x: px2in(PAD + 26), y: 2.0 + bi * 0.72, w: W - 2 * px2in(PAD) - 0.4, h: 0.62, fontSize: pt(ts.h3), color: c.text.replace('#', ''), fontFace: bodyFont, valign: 'middle' });
        });
        break;
      }
      case 'two-column': {
        if (s.title) titleBox(slide, s.title);
        const colW = (W - 2 * px2in(PAD) - 0.4) / 2;
        const mkCol = (x: number, t: string, items: string[]) => {
          slide.addShape('roundRect', { x, y: 2.1, w: colW, h: 4.4, rectRadius: 0.08, fill: { color: c.bgAlt.replace('#', '') }, line: { color: c.border.replace('#', ''), width: 1 } });
          slide.addText(t, { x: x + 0.25, y: 2.3, w: colW - 0.5, h: 0.5, fontSize: pt(ts.h2), bold: true, color: primary, fontFace: displayFont });
          slide.addText(items.map((txt) => ({ text: txt, options: { bullet: { code: '2192' }, breakLine: true } })), {
            x: x + 0.25, y: 2.9, w: colW - 0.5, h: 3.4, fontSize: pt(ts.body), color: c.text.replace('#', ''), fontFace: bodyFont, paraSpaceAfter: 8,
          });
        };
        mkCol(px2in(PAD), s.leftTitle ?? '', s.leftContent ?? []);
        mkCol(px2in(PAD) + colW + 0.4, s.rightTitle ?? '', s.rightContent ?? []);
        break;
      }
      case 'image': {
        if (s.image?.url) {
          try { slide.addImage({ path: s.image.url, x: 0, y: 0, w: W, h: H, sizing: { type: 'cover', w: W, h: H } }); } catch { /* url unreachable */ }
          slide.addShape('rect', { x: 0, y: 4.2, w: W, h: 3.3, fill: { color: '000000', transparency: 45 } });
        }
        if (s.title) slide.addText(s.title, { x: px2in(PAD), y: 4.9, w: W - 2 * px2in(PAD), h: 1.2, fontSize: pt(ts.h1), bold: true, color: 'FFFFFF', fontFace: displayFont });
        if (s.body) slide.addText(s.body, { x: px2in(PAD), y: 6.1, w: W - 2 * px2in(PAD), h: 0.6, fontSize: pt(ts.body), color: 'E5E5E5', fontFace: bodyFont });
        footer(slide, i);
        return; // skip default footer (white text zone)
      }
      case 'quote': {
        slide.addText('\u201C', { x: px2in(PAD), y: 0.9, w: 1.6, h: 1.4, fontSize: 100, color: primary, fontFace: displayFont });
        slide.addText(s.quote ?? '', { x: px2in(PAD + 30), y: 2.2, w: W - 2 * px2in(PAD) - 0.6, h: 2.8, fontSize: pt(ts.h1), color: c.text.replace('#', ''), fontFace: displayFont, italic: true });
        if (s.attribution) slide.addText(`— ${s.attribution}`, { x: px2in(PAD + 30), y: 5.2, w: 6, h: 0.5, fontSize: pt(ts.h3), color: c.textMuted.replace('#', ''), fontFace: bodyFont });
        break;
      }
      case 'stats': {
        if (s.title) titleBox(slide, s.title);
        const stats = (s.stats ?? []).slice(0, 4);
        const gap = 0.3;
        const cardW = (W - 2 * px2in(PAD) - gap * (stats.length - 1)) / Math.max(stats.length, 1);
        stats.forEach((st, si) => {
          const x = px2in(PAD) + si * (cardW + gap);
          slide.addShape('roundRect', { x, y: 2.3, w: cardW, h: 3.6, rectRadius: 0.1, fill: { color: c.surface.replace('#', '') }, line: { color: c.border.replace('#', ''), width: 1 }, shadow: { type: 'outer', blur: 12, offset: 2, angle: 90, color: '000000', opacity: 0.12 } });
          slide.addText(st.value, { x: x + 0.2, y: 2.7, w: cardW - 0.4, h: 1.1, fontSize: pt(ts.display * 0.72), bold: true, color: primary, fontFace: displayFont });
          slide.addText(st.label, { x: x + 0.2, y: 3.9, w: cardW - 0.4, h: 0.7, fontSize: pt(ts.body), bold: true, color: c.text.replace('#', ''), fontFace: bodyFont });
          if (st.context) slide.addText(st.context, { x: x + 0.2, y: 4.7, w: cardW - 0.4, h: 0.9, fontSize: pt(ts.caption + 2), color: c.textMuted.replace('#', ''), fontFace: bodyFont });
        });
        break;
      }
      case 'chart': {
        if (s.title) titleBox(slide, s.title);
        if (s.chart) {
          const palette = theme.tokens.chart.palette.map((x) => x.replace('#', ''));
          const labels = s.chart.data.map((d) => d.label);
          const values = s.chart.data.map((d) => d.value);
          const chartArea = { x: px2in(PAD), y: 2.1, w: 7.6, h: 4.6 };
          if (s.chart.kind === 'pie' || s.chart.kind === 'donut') {
            slide.addChart(pptx.ChartType.pie, [{ name: s.chart.title ?? '', labels, values }], { ...chartArea, chartColors: palette, showLegend: true, legendPos: 'r', holeSize: s.chart.kind === 'donut' ? 55 : 0, dataLabelColor: 'FFFFFF' });
          } else if (s.chart.kind === 'line' || s.chart.kind === 'area') {
            slide.addChart(s.chart.kind === 'area' ? pptx.ChartType.area : pptx.ChartType.line, [{ name: s.chart.title ?? '', labels, values }], { ...chartArea, chartColors: [palette[0]], lineSize: 3, showLegend: false, catAxisLabelColor: c.textMuted.replace('#', ''), valAxisLabelColor: c.textMuted.replace('#', '') });
          } else {
            const barDir: 'bar' | 'col' = s.chart.kind === 'bar' ? 'bar' : 'col';
            slide.addChart(pptx.ChartType.bar, [{ name: s.chart.title ?? '', labels, values }], { ...chartArea, barDir, chartColors: palette, barGapWidthPct: 60, showLegend: false, catAxisLabelColor: c.textMuted.replace('#', ''), valAxisLabelColor: c.textMuted.replace('#', '') });
          }
          // insight rail
          slide.addShape('roundRect', { x: 8.6, y: 2.1, w: 3.9, h: 4.6, rectRadius: 0.1, fill: { color: c.bgAlt.replace('#', '') } });
          slide.addText('INSIGHT', { x: 8.85, y: 2.4, w: 3.4, h: 0.4, fontSize: pt(ts.caption), color: primary, fontFace: bodyFont, charSpacing: 3, bold: true });
          if (s.chart.insight) slide.addText(s.chart.insight, { x: 8.85, y: 2.9, w: 3.4, h: 3.4, fontSize: pt(ts.h3), color: c.text.replace('#', ''), fontFace: bodyFont });
        }
        break;
      }
      case 'diagram': {
        if (s.title) titleBox(slide, s.title);
        if (s.diagram) {
          const nodes = s.diagram.nodes.slice(0, 7);
          const n = nodes.length;
          const boxW = Math.min(2.0, (W - 2 * px2in(PAD) - 0.5 * (n - 1)) / Math.max(n, 1));
          const xs = nodes.map((_, ni) => px2in(PAD) + ni * (boxW + 0.5));
          const y = 3.4;
          nodes.forEach((nd, ni) => {
            slide.addShape('roundRect', { x: xs[ni], y, w: boxW, h: 1.0, rectRadius: 0.1, fill: { color: c.surface.replace('#', '') }, line: { color: primary, width: 1.5 } });
            slide.addText(nd.label, { x: xs[ni], y, w: boxW, h: 1.0, fontSize: pt(ts.body), bold: true, color: c.text.replace('#', ''), fontFace: bodyFont, align: 'center', valign: 'middle' });
            if (ni < n - 1) {
              slide.addShape('line', { x: xs[ni] + boxW + 0.06, y: y + 0.5, w: 0.5 - 0.12, h: 0, line: { color: primary, width: 2, endArrowType: 'triangle' } });
            }
          });
        }
        break;
      }
      case 'comparison': {
        if (s.title) titleBox(slide, s.title);
        if (s.comparison) {
          const rows: PptxGenJS.TableRow[] = [
            [
              { text: '', options: { fill: { color: c.bg.replace('#', '') } } },
              { text: s.comparison.headers[0], options: { bold: true, color: 'FFFFFF', fill: { color: primary }, fontFace: displayFont } },
              { text: s.comparison.headers[1], options: { bold: true, color: 'FFFFFF', fill: { color: primary }, fontFace: displayFont } },
            ],
            ...s.comparison.rows.map((r) => ([
              { text: r.label, options: { bold: true, color: primary, fill: { color: c.bg.replace('#', '') } } },
              { text: r.left, options: { fill: { color: c.bgAlt.replace('#', '') } } },
              { text: r.right, options: { fill: { color: c.bgAlt.replace('#', '') } } },
            ] as PptxGenJS.TableRow)),
          ];
          slide.addTable(rows, {
            x: px2in(PAD), y: 2.2, w: W - 2 * px2in(PAD),
            fontSize: pt(ts.body), fontFace: bodyFont, color: c.text.replace('#', ''),
            border: { type: 'solid', color: c.border.replace('#', ''), pt: 1 },
            colW: [2.6, (W - 2 * px2in(PAD) - 2.6) / 2, (W - 2 * px2in(PAD) - 2.6) / 2],
            rowH: 0.65, valign: 'middle', margin: 0.08,
          });
        }
        break;
      }
      case 'closing': {
        if (s.subtitle) slide.addShape('roundRect', { x: W / 2 - 1.4, y: 2.0, w: 2.8, h: 0.55, rectRadius: 0.3, fill: { color: primary } });
        if (s.subtitle) slide.addText(s.subtitle, { x: W / 2 - 1.4, y: 2.0, w: 2.8, h: 0.55, fontSize: pt(ts.body), bold: true, color: c.primaryContrast.replace('#', ''), fontFace: bodyFont, align: 'center', valign: 'middle' });
        slide.addText(s.title ?? 'Thank you', { x: px2in(PAD), y: 2.8, w: W - 2 * px2in(PAD), h: 1.6, fontSize: pt(ts.display), bold: true, color: c.text.replace('#', ''), fontFace: displayFont, align: 'center' });
        break;
      }
    }

    if (s.notes) slide.addNotes(s.notes);
    footer(slide, i);
  });

  await pptx.writeFile({ fileName: `${deck.title.replace(/[^\w\d -]+/g, '').slice(0, 60) || 'deck'}.pptx` });
}
