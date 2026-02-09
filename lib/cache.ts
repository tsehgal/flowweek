/**
 * Simple cache utility for development and production to avoid API costs
 * Stores schedule responses in localStorage
 */

// Debug: Module loaded (client-side only)
if (typeof window !== 'undefined') {
  console.log('🔧 Cache module loaded on CLIENT!');
}

const CACHE_PREFIX = 'flowweek_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (user-facing feature)
const INPUT_CACHE_KEY = 'flowweek_last_input'; // Persist user's input text

interface CacheEntry {
  data: any;
  timestamp: number;
  input: string;
}

/**
 * Generate a simple hash from string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cached response if it exists and is fresh
 */
export function getCachedResponse(input: string): any | null {
  if (typeof window === 'undefined') {
    console.log('⚠️ getCachedResponse called on server (window undefined)');
    return null;
  }

  const cacheKey = CACHE_PREFIX + simpleHash(input.trim().toLowerCase());
  console.log('🔍 Looking for cache key:', cacheKey, 'for input:', input.substring(0, 50));
  const cached = localStorage.getItem(cacheKey);

  if (!cached) {
    console.log('❌ No cache found');
    return null;
  }

  try {
    const entry: CacheEntry = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;

    // Check if cache is still valid
    if (age < CACHE_DURATION && entry.input === input.trim()) {
      console.log('✅ Using cached response (saved API call!)');
      return entry.data;
    } else {
      // Cache expired, remove it
      console.log('⏰ Cache expired or input mismatch, removing');
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (err) {
    console.error('Cache read error:', err);
    return null;
  }
}

/**
 * Store response in cache
 */
export function setCachedResponse(input: string, data: any): void {
  if (typeof window === 'undefined') return;

  const cacheKey = CACHE_PREFIX + simpleHash(input.trim().toLowerCase());
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    input: input.trim(),
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log('💾 Response cached for future use');
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  let cleared = 0;

  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
      cleared++;
    }
  });

  console.log(`🗑️ Cleared ${cleared} cached responses`);
}

/**
 * Get cache stats
 */
export function getCacheStats(): { count: number; totalSize: number } {
  if (typeof window === 'undefined') return { count: 0, totalSize: 0 };

  const keys = Object.keys(localStorage);
  let count = 0;
  let totalSize = 0;

  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      count++;
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
  });

  return { count, totalSize };
}

/**
 * Save user's input text (for persistence across refreshes)
 */
export function saveLastInput(input: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INPUT_CACHE_KEY, input);
    console.log('💾 Saved input to localStorage:', input.substring(0, 50));
  } catch (err) {
    console.error('Failed to save input:', err);
  }
}

/**
 * Get user's last input text
 */
export function getLastInput(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(INPUT_CACHE_KEY);
    console.log('📖 Retrieved saved input:', saved ? saved.substring(0, 50) : 'null');
    return saved;
  } catch (err) {
    console.error('Failed to get last input:', err);
    return null;
  }
}

/**
 * Clear user's saved input
 */
export function clearLastInput(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INPUT_CACHE_KEY);
  } catch (err) {
    console.error('Failed to clear input:', err);
  }
}

/**
 * Generate hash for input (reusing existing logic)
 */
function getInputHash(input: string): string {
  return simpleHash(input.trim().toLowerCase());
}

/**
 * Get edited schedule from localStorage
 */
export function getEditedSchedule(inputHash: string): any[] | null {
  if (typeof window === 'undefined') return null;

  const key = `flowweek_edited_${inputHash}`;
  const cached = localStorage.getItem(key);

  if (!cached) return null;

  try {
    const entry = JSON.parse(cached);
    console.log('✅ Loaded edited schedule from cache');
    return entry.activities;
  } catch (err) {
    console.error('Failed to load edited schedule:', err);
    return null;
  }
}

/**
 * Save edited schedule to localStorage
 */
export function saveEditedSchedule(inputHash: string, activities: any[]): void {
  if (typeof window === 'undefined') return;

  const key = `flowweek_edited_${inputHash}`;
  const entry = {
    activities,
    lastModified: Date.now(),
    originalInputHash: inputHash,
  };

  try {
    localStorage.setItem(key, JSON.stringify(entry));
    console.log('💾 Saved edited schedule to cache');
  } catch (err) {
    console.error('Failed to save edited schedule:', err);
  }
}

/**
 * Clear edited schedule from localStorage
 */
export function clearEditedSchedule(inputHash: string): void {
  if (typeof window === 'undefined') return;

  const key = `flowweek_edited_${inputHash}`;
  try {
    localStorage.removeItem(key);
    console.log('🗑️ Cleared edited schedule');
  } catch (err) {
    console.error('Failed to clear edited schedule:', err);
  }
}
