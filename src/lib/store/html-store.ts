'use client';

/**
 * HTML Template Studio store — the second creation mode ("TEMPLATE STUDIO").
 *
 * Flow: pick a template (or scratch) → brief → generate → viewer.
 * Backend contract (built by HT-b, DO NOT change shapes here):
 *   GET  /api/templates            → { templates: TemplateMeta[], count }
 *   POST /api/htmlgen/outline      → { title, subtitle, slides: [{ title, layout, content_markdown, speaker_notes }] }
 *   POST /api/htmlgen/slides       → SSE {type:'status'|'slide'|'complete'|'error'}
 *   POST /api/htmlgen/scratch      → same SSE (scratch = no template selected)
 *   GET  /api/htmldecks            → { decks: [...] }
 *   GET  /api/htmldecks/[id]       → full deck incl. html
 *   GET  /api/htmldecks/[id]/raw   → text/html document (iframe src)
 *   DELETE /api/htmldecks/[id]
 */

import { create } from 'zustand';
import type { ToneId, Verbosity } from '@/lib/ai/strategies';

/** Mirrors TemplateMeta from src/app/api/templates/route.ts (duplicated on
 *  purpose — route modules import fs/path, never import them client-side). */
export interface TemplateMeta {
  id: string;
  name: string;
  tagline: string;
  category: string;
  style: string;
  palette: string[];
  fonts: string[];
  bestFor: string[];
  tags: string[];
  slidesCount: number;
  framework: 'opendesign' | 'reveal' | 'impress' | 'shower' | 'dzslides';
}

export type HtmlFramework = TemplateMeta['framework'];
/** engine values persisted on html decks (contract §8). */
export type HtmlEngine = HtmlFramework | 'scratch-reveal' | 'scratch-plain';

/** Tiny badge label per framework (mono badges in the picker/cards). */
export const FRAMEWORK_LABEL: Record<HtmlEngine, string> = {
  opendesign: 'open-design',
  reveal: 'reveal.js',
  impress: 'impress.js',
  shower: 'shower',
  dzslides: 'dzslides',
  'scratch-reveal': 'reveal.js · scratch',
  'scratch-plain': 'plain html · scratch',
};

/** Engines whose decks can be snapshotted to PNG/PPTX (html-snapshot.ts). */
export function isSnapshotableEngine(engine: string | null | undefined): boolean {
  return engine === 'opendesign' || engine === 'reveal' || engine === 'scratch-reveal';
}

export type HtmlMode = 'idle' | 'picking' | 'generating' | 'done' | 'error';
export type HtmlModeKind = 'template' | 'scratch';
export type HtmlTab = 'studio' | 'template';
export type ScratchEngine = 'reveal' | 'plain';

export interface HtmlOutlineSlide {
  title: string;
  layout: string;
  content_markdown: string;
  speaker_notes: string;
}

export interface HtmlOutline {
  title: string;
  subtitle?: string;
  slides: HtmlOutlineSlide[];
}

export interface HtmlSlideProgress {
  index: number;
  total: number;
  title: string;
}

export interface HtmlDeckResult {
  deckId: string;
  title: string;
}

interface HtmlState {
  /** Landing mode switch: STUDIO (default) vs TEMPLATE STUDIO. */
  tab: HtmlTab;
  mode: HtmlMode;
  modeKind: HtmlModeKind;
  selectedTemplate: TemplateMeta | null;
  scratchEngine: ScratchEngine;
  /** Template shelf (GET /api/templates) — cached for picker + library dots. */
  templates: TemplateMeta[];
  templatesLoading: boolean;
  templatesError: string | null;
  loadTemplates: () => Promise<void>;
  /** Brief + dials (same enums as the studio brief ticket). */
  brief: string;
  slideCount: number;
  audience: string;
  tone: ToneId;
  verbosity: Verbosity;
  /** Generation feedback. */
  statusMessage: string;
  slideProgress: HtmlSlideProgress | null;
  outline: HtmlOutline | null;
  result: HtmlDeckResult | null;
  error: string | null;

  setTab: (t: HtmlTab) => void;
  openPicker: () => void;
  closePicker: () => void;
  selectTemplate: (t: TemplateMeta) => void;
  clearTemplateChoice: () => void;
  startScratch: (engine?: ScratchEngine) => void;
  setScratchEngine: (e: ScratchEngine) => void;
  setBrief: (b: string) => void;
  setSlideCount: (n: number) => void;
  setAudience: (a: string) => void;
  setTone: (t: ToneId) => void;
  setVerbosity: (v: Verbosity) => void;
  /** POST outline → POST slides-or-scratch → parse SSE → set result. */
  generate: () => Promise<void>;
  /** Used by the deck library to open a saved deck in the viewer. */
  setResult: (r: HtmlDeckResult | null) => void;
  reset: () => void;
}

/** Abort handle so reset() can cancel an in-flight generation. */
let activeController: AbortController | null = null;

export const useHtmlStore = create<HtmlState>((set, get) => ({
  tab: 'studio',
  mode: 'idle',
  modeKind: 'template',
  selectedTemplate: null,
  scratchEngine: 'reveal',
  templates: [],
  templatesLoading: false,
  templatesError: null,
  loadTemplates: async () => {
    const s = get();
    if (s.templatesLoading || (s.templates.length > 0 && !s.templatesError)) return;
    set({ templatesLoading: true, templatesError: null });
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error(`Template shelf failed (HTTP ${res.status})`);
      const j = (await res.json()) as { templates?: TemplateMeta[] };
      set({ templates: Array.isArray(j.templates) ? j.templates : [], templatesLoading: false });
    } catch (e) {
      set({
        templatesLoading: false,
        templatesError: e instanceof Error ? e.message : 'Could not load templates',
      });
    }
  },
  brief: '',
  slideCount: 8,
  audience: '',
  tone: 'professional',
  verbosity: 'standard',
  statusMessage: '',
  slideProgress: null,
  outline: null,
  result: null,
  error: null,

  setTab: (tab) => set({ tab }),
  openPicker: () => set({ mode: 'picking', error: null }),
  closePicker: () => set({ mode: 'idle' }),
  selectTemplate: (t) => set({ selectedTemplate: t, modeKind: 'template', mode: 'idle' }),
  clearTemplateChoice: () => set({ selectedTemplate: null, modeKind: 'template' }),
  startScratch: (engine) =>
    set((s) => ({
      modeKind: 'scratch',
      scratchEngine: engine ?? s.scratchEngine,
      mode: 'idle',
      error: null,
    })),
  setScratchEngine: (scratchEngine) => set({ scratchEngine }),
  setBrief: (brief) => set({ brief }),
  setSlideCount: (slideCount) => set({ slideCount }),
  setAudience: (audience) => set({ audience }),
  setTone: (tone) => set({ tone }),
  setVerbosity: (verbosity) => set({ verbosity }),

  generate: async () => {
    const s = get();
    if (s.mode === 'generating') return;
    const brief = s.brief.trim();
    if (!brief) {
      set({ mode: 'error', error: 'Write a short brief first — what is this deck about?' });
      return;
    }

    const controller = new AbortController();
    activeController = controller;
    set({
      mode: 'generating',
      error: null,
      statusMessage: 'Drafting the outline…',
      slideProgress: null,
      outline: null,
      result: null,
    });

    try {
      // 1 — outline
      const outlineRes = await fetch('/api/htmlgen/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          brief,
          mode: s.modeKind,
          templateId: s.modeKind === 'template' ? s.selectedTemplate?.id || undefined : undefined,
          slideCount: s.slideCount,
          audience: s.audience.trim() || undefined,
          tone: s.tone,
          verbosity: s.verbosity,
        }),
      });
      if (!outlineRes.ok) {
        const j = (await outlineRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Outline failed (HTTP ${outlineRes.status})`);
      }
      const outline = (await outlineRes.json()) as HtmlOutline;
      if (!outline || !Array.isArray(outline.slides) || outline.slides.length === 0) {
        throw new Error('The outline came back empty. Try rephrasing the brief.');
      }
      set({ outline, statusMessage: 'Outline ready — designing slides…' });

      // 2 — slides (template fill) or scratch build; both stream SSE.
      const isScratch = s.modeKind === 'scratch';
      const slidesRes = await fetch(isScratch ? '/api/htmlgen/scratch' : '/api/htmlgen/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(
          isScratch
            ? { outline, mode: s.scratchEngine }
            : { outline, templateId: s.selectedTemplate?.id || '' },
        ),
      });
      if (!slidesRes.ok || !slidesRes.body) {
        const j = (await slidesRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Slide generation failed (HTTP ${slidesRes.status})`);
      }

      // 3 — consume the SSE stream. Events are data-only JSON payloads:
      // {type:'status',message} | {type:'slide',index,total,title}
      // | {type:'complete',deckId,html,title} | {type:'error',message}
      const reader = slidesRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let complete: { deckId: string; title: string } | null = null;

      const handleEvent = (ev: Record<string, unknown>) => {
        switch (ev.type) {
          case 'status':
            set({ statusMessage: String(ev.message || '') });
            break;
          case 'slide':
            set({
              statusMessage: 'Writing slides…',
              slideProgress: {
                index: Number(ev.index) || 0,
                total: Number(ev.total) || 0,
                title: String(ev.title || ''),
              },
            });
            break;
          case 'complete':
            complete = {
              deckId: String(ev.deckId || ''),
              title: String(ev.title || outline.title || 'Untitled deck'),
            };
            break;
          case 'error':
            throw new Error(String(ev.message || 'Generation failed'));
          default:
            break;
        }
      };

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === '[DONE]') continue;
            let ev: Record<string, unknown>;
            try {
              ev = JSON.parse(raw) as Record<string, unknown>;
            } catch {
              continue; // skip malformed fragments
            }
            handleEvent(ev);
          }
        }
      }

      const done = complete as { deckId: string; title: string } | null;
      if (!done || !done.deckId) {
        throw new Error('The generator finished but returned no deck id.');
      }
      set({ result: done, mode: 'done', statusMessage: '', slideProgress: null });
    } catch (e) {
      if (controller.signal.aborted) return; // reset() cancelled the run
      set({
        mode: 'error',
        error: e instanceof Error ? e.message : 'Generation failed',
      });
    } finally {
      if (activeController === controller) activeController = null;
    }
  },

  setResult: (result) =>
    set(result ? { result, mode: 'done', error: null } : { result: null }),

  reset: () => {
    try {
      activeController?.abort();
    } catch {
      /* noop */
    }
    activeController = null;
    set({
      mode: 'idle',
      statusMessage: '',
      slideProgress: null,
      outline: null,
      result: null,
      error: null,
    });
  },
}));
