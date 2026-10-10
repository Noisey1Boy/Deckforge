'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * useMotionPreference — app-level "Reduce motion" toggle (Settings → Preferences).
 * Persisted to localStorage as 'df_reduce_motion' ("1" | "0"). Consumers:
 *  - the Settings Switch (read + write)
 *  - the landing page (skip entrance animations when true)
 *
 * Implemented with useSyncExternalStore so the preference stays in sync across
 * every mounted consumer (storage events + a local custom event), SSR-safe
 * (server snapshot = false, no hydration mismatch), and without any
 * setState-in-effect cascades. OS-level preference (prefers-reduced-motion)
 * is respected separately via framer-motion's useReducedMotion.
 */

export const REDUCE_MOTION_KEY = 'df_reduce_motion';
const CHANGE_EVENT = 'df:motion-pref-changed';

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function readReduceMotionPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(REDUCE_MOTION_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeReduceMotionPref(value: boolean): void {
  try {
    window.localStorage.setItem(REDUCE_MOTION_KEY, value ? '1' : '0');
  } catch {
    /* private mode / storage disabled — preference just won't persist */
  }
}

export function useMotionPreference(): [boolean, (value: boolean) => void] {
  const reduced = useSyncExternalStore(
    subscribe,
    () => readReduceMotionPref(),
    () => false, // server snapshot — matches the first client render
  );

  const setValue = useCallback((value: boolean) => {
    writeReduceMotionPref(value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [reduced, setValue];
}
