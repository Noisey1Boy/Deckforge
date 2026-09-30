'use client';

import { create } from 'zustand';
import type { ChartSpec, Deck, DeckOutline, Slide } from '@/lib/deck/types';
import { DEFAULT_THEME_ID } from '@/lib/design/themes';
import type { ParsedTable } from '@/lib/data/parse';

export type AppView = 'create' | 'outline' | 'generating' | 'editor';

export interface DiagramPlan {
  title: string;
  direction: 'lr' | 'tb';
  nodes: Array<{ id: string; label: string; shape?: 'box' | 'pill' | 'diamond' }>;
  edges: Array<{ from: string; to: string; label?: string }>;
}

export interface DataAssets {
  tables: ParsedTable[];
  charts: ChartSpec[];
  diagram?: DiagramPlan;
  dataContext?: string;
  /** Outline index -> chart spec attachment (decided at outline approval). */
  chartAssignments: Record<string, ChartSpec>;
}

export const EMPTY_DATA_ASSETS: DataAssets = { tables: [], charts: [], chartAssignments: {} };

export interface GenProgress {
  done: number;
  total: number;
  currentTitle: string;
  error?: string;
}

/** Generation controls chosen in CreateView; consumed by the slide pipeline. */
export interface GenSettings {
  audience: string;
  tone: string;
  language: string;
  slideCount: number;
}

export const DEFAULT_GEN_SETTINGS: GenSettings = {
  audience: '',
  tone: 'professional',
  language: 'English',
  slideCount: 10,
};

interface AppState {
  view: AppView;
  deck: Deck | null;
  outline: DeckOutline | null;
  currentSlideIndex: number;
  /** Template picked in the gallery; 'auto' lets the AI decide. */
  themeChoice: string;
  presenting: boolean;
  progress: GenProgress;
  dirty: boolean;
  dataAssets: DataAssets;
  genSettings: GenSettings;
  /** Undo/redo stacks of deck snapshots (structural slide ops only). */
  past: Deck[];
  future: Deck[];

  undo: () => void;
  redo: () => void;

  setDataAssets: (d: DataAssets) => void;
  setGenSettings: (g: GenSettings) => void;
  setView: (v: AppView) => void;
  setThemeChoice: (id: string) => void;
  setOutline: (o: DeckOutline | null) => void;
  setDeck: (d: Deck | null) => void;
  patchDeck: (p: Partial<Deck>) => void;
  setCurrentSlide: (i: number) => void;
  setPresenting: (p: boolean) => void;
  setProgress: (p: GenProgress) => void;

  // slide ops
  updateSlide: (id: string, patch: Partial<Slide>) => void;
  /** Apply many per-slide patches with ONE undo snapshot (batch AI notes). */
  patchSlides: (patches: Record<string, Partial<Slide>>) => void;
  reorderSlides: (from: number, to: number) => void;
  insertSlide: (index: number, slide: Slide) => void;
  removeSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  /** Batch ops: one undo snapshot per call. */
  removeSlides: (ids: string[]) => void;
  duplicateSlides: (ids: string[]) => void;
  setHiddenSlides: (ids: string[], hidden: boolean) => void;
  setDeckTheme: (themeId: string) => void;
  markSaved: () => void;
}

export function newSlideId(): string {
  return `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export const useAppStore = create<AppState>((set, get) => {
  /** Apply a deck mutation with an undo snapshot. */
  const commit = (fn: (deck: Deck) => Deck) =>
    set((s) => {
      if (!s.deck) return s;
      const next = fn(s.deck);
      return {
        deck: next,
        past: [...s.past.slice(-39), s.deck],
        future: [],
        dirty: true,
      };
    });

  return {
  view: 'create',
  deck: null,
  outline: null,
  currentSlideIndex: 0,
  themeChoice: DEFAULT_THEME_ID,
  presenting: false,
  progress: { done: 0, total: 0, currentTitle: '' },
  dirty: false,
  dataAssets: EMPTY_DATA_ASSETS,
  genSettings: DEFAULT_GEN_SETTINGS,
  past: [],
  future: [],

  undo: () =>
    set((s) => {
      if (!s.past.length || !s.deck) return s;
      const prev = s.past[s.past.length - 1];
      return {
        deck: prev,
        past: s.past.slice(0, -1),
        future: [s.deck, ...s.future.slice(0, 39)],
        dirty: true,
      };
    }),
  redo: () =>
    set((s) => {
      if (!s.future.length || !s.deck) return s;
      const next = s.future[0];
      return {
        deck: next,
        past: [...s.past.slice(-39), s.deck],
        future: s.future.slice(1),
        dirty: true,
      };
    }),

  setDataAssets: (dataAssets) => set({ dataAssets }),
  setGenSettings: (genSettings) => set({ genSettings }),
  setView: (view) => set({ view }),
  setThemeChoice: (themeChoice) => set({ themeChoice }),
  setOutline: (outline) => set({ outline }),
  setDeck: (deck) => set({ deck, currentSlideIndex: 0, dirty: false, past: [], future: [] }),
  patchDeck: (p) => set((s) => ({ deck: s.deck ? { ...s.deck, ...p } : s.deck, dirty: true })),
  setCurrentSlide: (i) => set({ currentSlideIndex: Math.max(0, i) }),
  setPresenting: (presenting) => set({ presenting }),
  setProgress: (progress) => set({ progress }),

  updateSlide: (id, patch) =>
    commit((d) => ({
      ...d,
      slides: d.slides.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)),
    })),

  patchSlides: (patches) =>
    commit((d) => ({
      ...d,
      slides: d.slides.map((sl) => (patches[sl.id] ? { ...sl, ...patches[sl.id] } : sl)),
    })),

  reorderSlides: (from, to) =>
    set((s) => {
      if (!s.deck) return s;
      const slides = [...s.deck.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      return {
        deck: { ...s.deck, slides },
        past: [...s.past.slice(-39), s.deck],
        future: [],
        currentSlideIndex: to,
        dirty: true,
      };
    }),

  insertSlide: (index, slide) =>
    set((s) => {
      if (!s.deck) return s;
      const slides = [...s.deck.slides];
      slides.splice(index, 0, slide);
      return {
        deck: { ...s.deck, slides },
        past: [...s.past.slice(-39), s.deck],
        future: [],
        currentSlideIndex: index,
        dirty: true,
      };
    }),

  removeSlide: (id) =>
    set((s) => {
      if (!s.deck) return s;
      const idx = s.deck.slides.findIndex((sl) => sl.id === id);
      if (idx === -1) return s;
      const slides = s.deck.slides.filter((sl) => sl.id !== id);
      return {
        deck: { ...s.deck, slides },
        past: [...s.past.slice(-39), s.deck],
        future: [],
        currentSlideIndex: Math.min(Math.max(0, idx - 1), Math.max(0, slides.length - 1)),
        dirty: true,
      };
    }),

  duplicateSlide: (id) =>
    set((s) => {
      if (!s.deck) return s;
      const idx = s.deck.slides.findIndex((sl) => sl.id === id);
      if (idx === -1) return s;
      const copy: Slide = { ...s.deck.slides[idx], id: newSlideId() };
      const slides = [...s.deck.slides];
      slides.splice(idx + 1, 0, copy);
      return {
        deck: { ...s.deck, slides },
        past: [...s.past.slice(-39), s.deck],
        future: [],
        currentSlideIndex: idx + 1,
        dirty: true,
      };
    }),

  removeSlides: (ids) =>
    set((s) => {
      if (!s.deck || ids.length === 0) return s;
      const drop = new Set(ids);
      const slides = s.deck.slides.filter((sl) => !drop.has(sl.id));
      if (slides.length === 0) return s; // never empty the deck
      const firstRemoved = s.deck.slides.findIndex((sl) => drop.has(sl.id));
      return {
        deck: { ...s.deck, slides },
        past: [...s.past.slice(-39), s.deck],
        future: [],
        currentSlideIndex: Math.min(Math.max(0, firstRemoved - 1), Math.max(0, slides.length - 1)),
        dirty: true,
      };
    }),

  duplicateSlides: (ids) =>
    set((s) => {
      if (!s.deck || ids.length === 0) return s;
      const order = ids.map((id) => s.deck!.slides.findIndex((sl) => sl.id === id));
      if (order.some((i) => i === -1)) return s;
      const slides = [...s.deck.slides];
      // insert copies bottom-up so positions stay valid
      const pairs = ids
        .map((id, k) => ({ id, idx: order[k] }))
        .sort((a, b) => b.idx - a.idx);
      for (const { id, idx } of pairs) {
        slides.splice(idx + 1, 0, { ...s.deck.slides[idx], id: newSlideId() });
      }
      return {
        deck: { ...s.deck, slides },
        past: [...s.past.slice(-39), s.deck],
        future: [],
        dirty: true,
      };
    }),

  setHiddenSlides: (ids, hidden) =>
    set((s) => {
      if (!s.deck || ids.length === 0) return s;
      const target = new Set(ids);
      const slides = s.deck.slides.map((sl) => (target.has(sl.id) ? { ...sl, hidden } : sl));
      return {
        deck: { ...s.deck, slides },
        past: [...s.past.slice(-39), s.deck],
        future: [],
        dirty: true,
      };
    }),

  setDeckTheme: (themeId) => {
    set((s) => ({ themeChoice: themeId }));
    commit((d) => ({ ...d, themeId }));
  },

  markSaved: () => set({ dirty: false }),
  } as AppState;
})

/** Convenience: active theme of the current deck (or the gallery choice). */
export function useActiveTheme() {
  const deck = useAppStore((s) => s.deck);
  const themeChoice = useAppStore((s) => s.themeChoice);
  return getTheme(deck?.themeId ?? (themeChoice === 'auto' ? DEFAULT_THEME_ID : themeChoice));
}

/** Dev/E2E hook: lets browser tests inspect history state without UI indirection. */
export function useAppStoreDebug() {
  if (typeof window !== 'undefined') {
    (window as unknown as { __deckStore?: typeof useAppStore }).__deckStore = useAppStore;
  }
  return useAppStore;
}
