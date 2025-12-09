'use client';

import { WordDetailsOutput } from '@/ai/schemas';

const CACHE_VERSION = 1;
const CACHE_PREFIX = `word_details_cache_v${CACHE_VERSION}_`;

export function getCachedWordDetails(word: string): WordDetailsOutput | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const key = `${CACHE_PREFIX}${word.toLowerCase()}`;
  const cached = window.localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached) as WordDetailsOutput;
    } catch (e) {
      console.error('Failed to parse cached word details:', e);
      window.localStorage.removeItem(key); // Clear corrupted cache
      return null;
    }
  }
  return null;
}

export function setCachedWordDetails(word: string, data: WordDetailsOutput) {
  if (typeof window === 'undefined') {
    return;
  }
  const key = `${CACHE_PREFIX}${word.toLowerCase()}`;
  window.localStorage.setItem(key, JSON.stringify(data));
}
