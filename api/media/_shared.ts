import {
  MediaSearchCandidate,
  buildTranslatedEnglishQuery,
  extractMediaCoreTokens,
  parseCommonsPages,
  parseWikipediaPages,
  rankAndFilterMediaCandidates
} from './_relevance';

export type MediaSearchResult = MediaSearchCandidate;

const USER_AGENT = 'AsesmenSumatifSD/1.0 (https://sdnsukatinggal.sch.id; mailto:admin@sdnsukatinggal.sch.id)';

async function fetchJsonWithTimeout(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Api-User-Agent': USER_AGENT,
        Accept: 'application/json'
      },
      signal: controller.signal
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim().startsWith('{')) return null;
    return JSON.parse(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function queryCommonsServer(query: string, limit = 10): Promise<MediaSearchCandidate[]> {
  const endpoint =
    `https://commons.wikimedia.org/w/api.php` +
    `?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
    `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|thumbmime|size&iiurlwidth=600&format=json&origin=*`;
  const data = await fetchJsonWithTimeout(endpoint);
  return parseCommonsPages(data);
}

async function queryWikiServer(lang: 'id' | 'en', query: string, limit = 5): Promise<MediaSearchCandidate[]> {
  const endpoint =
    `https://${lang}.wikipedia.org/w/api.php` +
    `?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}` +
    `&gsrlimit=${limit}&prop=pageimages&piprop=thumbnail|original&pithumbsize=600&format=json&origin=*`;
  const data = await fetchJsonWithTimeout(endpoint);
  return parseWikipediaPages(data, `${lang}.wikipedia.org`);
}

export async function searchEducationalMedia(
  rawQuery: string,
  limit = 4
): Promise<MediaSearchResult[]> {
  const cleanQuery = String(rawQuery || '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

  if (!cleanQuery) return [];

  const coreTokens = extractMediaCoreTokens(cleanQuery);
  const coreQuery = coreTokens.length > 0 ? coreTokens.join(' ') : cleanQuery;
  const englishQuery = buildTranslatedEnglishQuery(cleanQuery);

  const primarySearchTerm = coreQuery.length >= 3 ? coreQuery : cleanQuery;
  const commonsId = await queryCommonsServer(primarySearchTerm, 10);
  let allCandidates: MediaSearchCandidate[] = [...commonsId];
  let ranked = rankAndFilterMediaCandidates(allCandidates, primarySearchTerm, limit);
  if (ranked.length >= limit) {
    return ranked;
  }

  const [wikiId, commonsEn, wikiEn] = await Promise.all([
    queryWikiServer('id', primarySearchTerm, 5),
    englishQuery && englishQuery.toLowerCase() !== primarySearchTerm.toLowerCase()
      ? queryCommonsServer(englishQuery, 10)
      : Promise.resolve([]),
    queryWikiServer('en', englishQuery || primarySearchTerm, 5)
  ]);

  allCandidates = [...allCandidates, ...wikiId, ...commonsEn, ...wikiEn];
  ranked = rankAndFilterMediaCandidates(allCandidates, primarySearchTerm, limit);
  if (ranked.length > 0) {
    return ranked;
  }

  // Fallback with top 2 core tokens (Indonesian & English) if 3+ tokens were too narrow
  const compactId = coreTokens.slice(0, 2).join(' ');
  const compactEn = compactId ? buildTranslatedEnglishQuery(compactId) : '';
  if (compactId && compactId.toLowerCase() !== primarySearchTerm.toLowerCase()) {
    const [retryCommonsId, retryWikiId, retryCommonsEn] = await Promise.all([
      queryCommonsServer(compactId, 8),
      queryWikiServer('id', compactId, 4),
      compactEn ? queryCommonsServer(compactEn, 8) : Promise.resolve([])
    ]);
    return rankAndFilterMediaCandidates(
      [...allCandidates, ...retryCommonsId, ...retryWikiId, ...retryCommonsEn],
      compactId,
      limit
    );
  }

  return [];
}

function isDisallowedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().trim();
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) {
    return true;
  }
  if (h === '::1' || h === '[::1]' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) {
    return true;
  }
  const ipv4Match = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

export async function fetchSafeRemoteImage(
  rawUrl: string
): Promise<{ buffer: Uint8Array; contentType: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('URL gambar tidak valid');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Protokol URL tidak didukung');
  }
  if (isDisallowedHostname(parsed.hostname)) {
    throw new Error('Host gambar tidak diizinkan');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/png,image/jpeg,image/webp,image/*;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`Upstream mengembalikan status ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      throw new Error('Konten bukan file gambar yang valid');
    }

    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength > 5 * 1024 * 1024) {
      throw new Error('Ukuran gambar melebihi batas 5 MB');
    }

    return {
      buffer: new Uint8Array(arrayBuf),
      contentType
    };
  } finally {
    clearTimeout(timer);
  }
}
