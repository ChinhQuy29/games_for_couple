import { useSyncExternalStore } from 'react';
import type { Lang, Text } from '../../shared';
import { load, save } from './storage';

// Each player picks their own language; it's remembered on this device and
// switching updates every screen at once.

const KEY = 'aog.lang.v1';
let current: Lang = load<Lang>(KEY, 'vi');
const listeners = new Set<() => void>();

export function setLang(lang: Lang): void {
  current = lang;
  save(KEY, lang);
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

/** Picks the string for the current language from a {vi, en} pair. */
export function useT() {
  const lang = useLang();
  return (text: Text) => text[lang];
}

/** For screen copy: `const c = useCopy(COPY)` where COPY = { vi: {...}, en: {...} }. */
export function useCopy<T>(copy: Record<Lang, T>): T {
  return copy[useLang()];
}
