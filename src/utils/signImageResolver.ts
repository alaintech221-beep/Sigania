/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In-memory cache for fast lookups across components during the session
const memoryCache = new Map<string, string>();

/**
 * Extracts numerical or textual values from a road sign code, name, or description.
 * Examples:
 * - "B14 (50)" -> ["50"]
 * - "B25", "Vitesse minimale obligatoire (30 km/h)" -> ["30", "30 km/h"]
 * - "B12", "Hauteur limitée à 3,5 m" -> ["3,5 m", "3.5 m", "3,5", "3.5"]
 */
export function extractSignValues(code: string, nom?: string, signification?: string): string[] {
  const values: string[] = [];

  // 1. Check parenthetical value in code: e.g., "B14 (50)" -> "50"
  const codeParen = code.match(/\(([^)]+)\)/);
  if (codeParen) {
    values.push(codeParen[1].trim());
  }

  // 2. Specific standard French road sign values:
  const base = getBaseCode(code);
  if (base === 'B25' || base === 'B43') {
    values.push('30');
  } else if (base === 'B10a') {
    values.push('10 m', '10');
  } else if (base === 'B11') {
    values.push('2 m', '2,5 m', '2.5 m', '2,5');
  } else if (base === 'B12') {
    values.push('3,5 m', '3.5 m', '2 m', '3,5', '3.5');
  } else if (base === 'B13') {
    values.push('5,5 t', '5.5 t', '3,5 t', '5,5', '5.5');
  } else if (base === 'B17') {
    values.push('70 m', '70');
  } else if (base === 'B33') {
    values.push('50', '80', '90');
  } else if (base === 'C4a') {
    values.push('50', '30', '70');
  }

  // 3. Extract numbers and measurements from name and signification (e.g. "30 km/h", "3,5 m", "70")
  const text = `${nom || ''} ${signification || ''}`;
  // Match numbers optionally followed by units (km/h, t, m, cm)
  const matches = text.match(/\b\d+(?:[.,]\d+)?\b/g);
  if (matches) {
    for (const m of matches) {
      const numOnly = m.trim();
      if (numOnly && !values.includes(numOnly)) {
        values.push(numOnly);
      }
    }
  }

  // Also match units for metric restrictions like "3,5 m" or "5,5 t"
  const metricMatches = text.match(/\b\d+(?:[.,]\d+)?\s*(?:m|t)\b/gi);
  if (metricMatches) {
    for (const m of metricMatches) {
      const sanitized = m.replace(/[/\\?%*:|"<>]/g, '').trim();
      if (sanitized && !values.includes(sanitized)) {
        values.push(sanitized);
      }
    }
  }

  return values.filter((v) => v.length > 0 && !v.includes('/'));
}

/**
 * Returns the base code without parentheses or extra whitespace.
 * e.g., "B14 (50)" -> "B14", "AB3a " -> "AB3a"
 */
export function getBaseCode(code: string): string {
  return code.replace(/\s*\([^)]*\)/, '').trim();
}

/**
 * Builds a Wikimedia Commons Special:FilePath URL for a given filename.
 */
export function buildWikimediaUrl(filename: string): string {
  // Clean potential File: or Fichier: prefix and extra whitespace
  const clean = filename.replace(/^(File:|Fichier:)/i, '').trim();
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}`;
}

/**
 * Resolves working URL from localStorage or in-memory cache.
 */
export function getCachedSignUrl(code: string): string | null {
  if (memoryCache.has(code)) {
    return memoryCache.get(code)!;
  }
  try {
    const cached = localStorage.getItem(`wm_sign_url_${code}`);
    if (cached) {
      memoryCache.set(code, cached);
      return cached;
    }
  } catch {
    // localStorage might not be available in private mode or iframe
  }
  return null;
}

/**
 * Stores a verified working URL for a road sign.
 */
export function saveWorkingSignUrl(code: string, url: string): void {
  memoryCache.set(code, url);
  try {
    localStorage.setItem(`wm_sign_url_${code}`, url);
  } catch {
    // ignore storage quota / permissions errors
  }
}

/**
 * Generates candidate URLs in the exact priority order requested:
 * 1. France road sign CODE.svg
 * 2. France road sign CODE (valeur).svg when sign has a value (speed, height, weight...)
 * 3. Panneau CODE.svg
 * 4. CODE.svg
 */
export function generateCandidateUrls(
  code: string,
  nom?: string,
  signification?: string,
  initialImageUrl?: string
): string[] {
  if (initialImageUrl && initialImageUrl.startsWith('data:')) {
    return [initialImageUrl];
  }

  const candidates: string[] = [];
  const baseCode = getBaseCode(code);
  const values = extractSignValues(code, nom, signification);

  const addFilename = (filename: string) => {
    const url = buildWikimediaUrl(filename);
    if (!candidates.includes(url)) {
      candidates.push(url);
    }
  };

  // If initialImageUrl was provided in JSON, place it first as it is the verified source URL
  if (initialImageUrl && !candidates.includes(initialImageUrl)) {
    candidates.push(initialImageUrl);
  }

  // Variant 1: France road sign CODE.svg
  // (using exact code as specified, and also base code if different)
  addFilename(`France road sign ${code}.svg`);
  if (baseCode !== code) {
    addFilename(`France road sign ${baseCode}.svg`);
  }

  // Variant 2: France road sign CODE (valeur).svg when sign has a value
  for (const val of values) {
    addFilename(`France road sign ${baseCode} (${val}).svg`);
    addFilename(`France road sign ${baseCode} ${val}.svg`);
  }

  // Variant 3: Panneau CODE.svg
  addFilename(`Panneau ${code}.svg`);
  if (baseCode !== code) {
    addFilename(`Panneau ${baseCode}.svg`);
  }
  for (const val of values) {
    addFilename(`Panneau ${baseCode} (${val}).svg`);
  }

  // Variant 4: CODE.svg
  addFilename(`${code}.svg`);
  if (baseCode !== code) {
    addFilename(`${baseCode}.svg`);
  }

  return candidates;
}

// In-flight API search promises to prevent duplicate simultaneous requests for same code
const searchPromises = new Map<string, Promise<string | null>>();

/**
 * Queries Wikimedia Commons search API with origin=* for "France road sign CODE".
 * Falls back to "Panneau CODE" if needed.
 * Returns the Special:FilePath URL of the first SVG result found, or null.
 */
export async function searchWikimediaForSign(code: string): Promise<string | null> {
  const baseCode = getBaseCode(code);
  const cacheKey = `search_${baseCode}`;

  if (searchPromises.has(cacheKey)) {
    return searchPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    // 1. Search for "France road sign CODE"
    const searchQueries = [
      `France road sign ${baseCode}`,
      `France road sign ${code}`,
      `Panneau ${baseCode}`,
    ];

    for (const query of searchQueries) {
      try {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query
        )}&srnamespace=6&format=json&origin=*`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const results: Array<{ title: string }> = data?.query?.search || [];

        // Find the first SVG file
        const svgMatch = results.find((item) =>
          item.title.toLowerCase().endsWith('.svg')
        );

        if (svgMatch) {
          const filename = svgMatch.title.replace(/^(File:|Fichier:)/i, '').trim();
          return buildWikimediaUrl(filename);
        }
      } catch (err) {
        console.warn(`Wikimedia search API error for query "${query}":`, err);
      }
    }

    return null;
  })();

  searchPromises.set(cacheKey, promise);
  return promise;
}
