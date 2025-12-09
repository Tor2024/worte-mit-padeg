'use client';

import type { WordDetailsOutput } from '@/ai/schemas';

const CACHE_KEY = 'wordDetailsCache';
const CACHE_VERSION = '1'; // Increment to invalidate all caches on schema change
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  version: string;
  timestamp: number;
  data: WordDetailsOutput;
}

// Function to get a cached value
export const getCachedWordDetails = (word: string): WordDetailsOutput | null => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) return null;

    const cache = JSON.parse(cachedData);
    const key = word.toLowerCase();
    const entry: CacheEntry | undefined = cache[key];

    if (!entry) return null;

    // Check version and expiration
    const isExpired = Date.now() - entry.timestamp > CACHE_EXPIRATION_MS;
    if (entry.version !== CACHE_VERSION || isExpired) {
      // If expired or version mismatch, delete the entry
      delete cache[key];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("Failed to read from word cache:", error);
    return null;
  }
};

// Function to set a value in the cache
export const setCachedWordDetails = (word: string, data: WordDetailsOutput): void => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cache = cachedData ? JSON.parse(cachedData) : {};

    const key = word.toLowerCase();
    const newEntry: CacheEntry = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    };

    cache[key] = newEntry;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Failed to write to word cache:", error);
  }
};
