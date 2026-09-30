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

  setDataAssets: (d: DataAssets) => void;
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
  reorderSlides: (from: number, to: number) => void;
  insertSlide: (index: number, slide: Slide) => void;
  removeSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  setDeckTheme: (themeId: string) => void;
  markSaved: () => void;
}

export function newSlideId(): string {
  return `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'create',
  deck: null,
  outline: null,
  currentSlideIndex: 0,
  themeChoice: DEFAULT_THEME_ID,
  presenting: false,
  progress: { done: 0, total: 0, currentTitle: '' },
  dirty: false,
  dataAssets: EMPTY_DATA_ASSETS,

  setDataAssets: (dataAssets) => set({ dataAssets }),
  setView: (view) => set({ view }),
  setThemeChoice: (themeChoice) => set({ themeChoice }),
  setOutline: (outline) => set({ outline }),
  setDeck: (deck) => set({ deck, currentSlideIndex: 0, dirty: false }),
  patchDeck: (p) => set((s) => ({ deck: s.deck ? { ...s.deck, ...p } : s.deck, dirty: true })),
  setCurrentSlide: (i) => set({ currentSlideIndex: Math.max(0, i) }),
  setPresenting: (presenting) => set({ presenting }),
  setProgress: (progress) => set({ progress }),

  updateSlide: (id, patch) =>
    set((s) => {
      if (!s.deck) return s;
      const slides = s.deck.slides.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl));
      return { deck: { ...s.deck, slides }, dirty: true };
    }),

  reorderSlides: (from, to) =>
    set((s) => {
      if (!s.deck) return s;
      const slides = [...s.deck.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      return { deck: { ...s.deck, slides }, currentSlideIndex: to, dirty: true };
    }),

  insertSlide: (index, slide) =>
    set((s) => {
      if (!s.deck) return s;
      const slides = [...s.deck.slides];
      slides.splice(index, 0, slide);
      return { deck: { ...s.deck, slides }, currentSlideIndex: index, dirty: true };
    }),

  removeSlide: (id) =>
    set((s) => {
      if (!s.deck) return s;
      const idx = s.deck.slides.findIndex((sl) => sl.id === id);
      if (idx === -1) return s;
      const slides = s.deck.slides.filter((sl) => sl.id !== id);
      return {
        deck: { ...s.deck, slides },
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
      return { deck: { ...s.deck, slides }, currentSlideIndex: idx + 1, dirty: true };
    }),

  setDeckTheme: (themeId) =>
    set((s) => {
      if (!s.deck) return s;
      return { deck: { ...s.deck, themeId }, themeChoice: themeId, dirty: true };
    }),

  markSaved: () => set({ dirty: false }),
}));

/** Convenience: active theme of the current deck (or the gallery choice). */
export function useActiveTheme() {
  const deck = useAppStore((s) => s.deck);
  const themeChoice = useAppStore((s) => s.themeChoice);
  return getTheme(deck?.themeId ?? (themeChoice === 'auto' ? DEFAULT_THEME_ID : themeChoice));
}
