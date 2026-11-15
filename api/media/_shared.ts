export interface MediaSearchResult {
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
  score?: number;
}

const USER_AGENT = 'AsesmenSumatifSD/1.0 (https://github.com/vercel/vercel; educational-app)';

const BLOCKED_FILENAME_PATTERNS = [
  /commons-logo/i,
  /wiki-logo/i,
  /wikipedia-logo/i,
  /ambox/i,
  /disambig/i,
  /crystal_clear/i,
  /nuvola_/i,
  /gnome-/i,
  /gtk-/i,
  /padlock/i,
  /question_book/i,
  /edit-clear/i,
  /symbol_/i,
  /signature/i,
  /coat_of_arms_of_west_nusa/i,
  /locator_map/i,
  /location_map/i,
  /logoipsi/i,
  /\.gif(?:\?|$|\/)/i,
  /\.pdf(?:\?|$|\/)/i,
  /\.djvu(?:\?|$|\/)/i,
  /\.tiff?(?:\?|$|\/)/i
];

const NOISE_RESULT_PATTERNS = [
  /\bplaystation\b/i,
  /\bps2\b/i,
  /\bsnes\b/i,
  /\bnintendo\b/i,
  /\bd'academy\b/i,
  /\bdusun\s+people\b/i,
  /dna_simple/i,
  /\bfatou\b/i,
  /\bblaschke\b/i,
  /\bstereographic\b/i,
  /\bgedung[_\s]sate\b/i
];

const STOP_WORDS = new Set([
  'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'dalam',
  'adalah', 'yaitu', 'sebuah', 'suatu', 'ini', 'itu', 'berikut', 'gambar', 'foto',
  'ilustrasi', 'diagram', 'alat', 'benda', 'objek', 'permainan', 'tradisional',
  'khas', 'daerah', 'indonesia', 'nusantara', 'jawa', 'barat', 'sunda', 'sederhana',
  'the', 'of', 'in', 'on', 'at', 'for', 'and', 'with', 'showing', 'simple', 'motif'
]);

const TOKEN_SYNONYMS: Record<string, string[]> = {
  bintang: ['star'],
  rantai: ['chain'],
  beringin: ['banyan'],
  banteng: ['buffalo', 'bull'],
  padi: ['rice'],
  kapas: ['cotton'],
  parkir: ['parking'],
  dilarang: ['no', 'prohibited'],
  rambu: ['sign', 'traffic', 'road'],
  siklus: ['cycle', 'watercycle'],
  hidrologi: ['hydrologic', 'watercycle'],
  air: ['water', 'watercycle'],
  makanan: ['food'],
  tumbuhan: ['plant', 'botany'],
  anatomi: ['anatomy'],
  akar: ['root', 'roots'],
  batang: ['stem'],
  daun: ['leaf', 'leaves'],
  bunga: ['flower'],
  kupu: ['butterfly'],
  fotosintesis: ['photosynthesis'],
  metamorfosis: ['metamorphosis'],
  gerhana: ['eclipse'],
  gunung: ['volcano', 'mountain'],
  berapi: ['volcano'],
  listrik: ['circuit', 'electric'],
  rangkaian: ['circuit'],
  sepak: ['football', 'soccer'],
  bola: ['ball', 'football', 'volleyball', 'basketball'],
  voli: ['volleyball'],
  basket: ['basketball'],
  renang: ['swimming'],
  bulu: ['badminton'],
  tangkis: ['badminton'],
  jam: ['clock', 'watch'],
  dinding: ['wall', 'clock'],
  kabah: ['kaaba', 'kaba', 'kabah', 'mecca'],
  kaabah: ['kaaba', 'kaba', 'kabah', 'mecca'],
  mekkah: ['mecca', 'makkah'],
  makkah: ['mecca', 'mekkah'],
  wudu: ['wudu', 'wudhu', 'ablution'],
  wudhu: ['wudu', 'wudhu', 'ablution'],
  masjid: ['mosque', 'masjid'],
  wayang: ['wayang', 'puppet'],
  anyaman: ['weaving', 'woven', 'bamboo'],
  kubus: ['cube', 'hexahedron'],
  segitiga: ['triangle'],
  tari: ['dance', 'tari'],
  umah: ['house', 'rumah'],
  imah: ['house', 'rumah'],
  rumah: ['house', 'rumah'],
  serabi: ['serabi', 'surabi', 'srabi'],
  surabi: ['serabi', 'surabi', 'srabi']
};

function isAcceptableImageUrl(url: string, title = ''): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  // Thumbnails must end in a raster extension (even when Wikimedia source file was .svg)
  const pathOnly = url.split('?')[0].toLowerCase();
  if (pathOnly.endsWith('.svg')) return false;
  const combined = `${url} ${title}`;
  return !BLOCKED_FILENAME_PATTERNS.some((re) => re.test(combined));
}

function extractCoreTokens(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

  const core = words.filter((w) => !STOP_WORDS.has(w));
  return Array.from(new Set(core.length > 0 ? core : words));
}

function normalizeCandidateText(title: string, thumbUrl: string): string {
  let filePart = '';
  try {
    filePart = decodeURIComponent(thumbUrl.split('?')[0].split('/').pop() || '');
  } catch {
    filePart = thumbUrl.split('?')[0].split('/').pop() || '';
  }
  return `${title} ${filePart}`.toLowerCase().replace(/['’`]/g, '').replace(/[_.-]/g, ' ');
}

function scoreCandidateRelevance(
  candidate: MediaSearchResult,
  coreTokens: string[],
  rawQuery: string
): number {
  const haystack = normalizeCandidateText(candidate.title, candidate.thumbUrl);
  if (NOISE_RESULT_PATTERNS.some((re) => re.test(haystack) && !re.test(rawQuery))) {
    return -100;
  }

  if (coreTokens.length === 0) return 0;

  const doesTokenMatch = (tok: string): boolean => {
    if (haystack.includes(tok)) return true;
    const syns = TOKEN_SYNONYMS[tok] || [];
    return syns.some((s) => haystack.includes(s));
  };

  // Primary subject token (first core noun) MUST match to prevent "D'Academy" or "Gedung Sate" accidents
  const primaryMatched = doesTokenMatch(coreTokens[0]);
  if (!primaryMatched) {
    return -50;
  }

  let matchedCount = 0;
  for (const tok of coreTokens) {
    if (doesTokenMatch(tok)) matchedCount++;
  }

  const requiredMatches = coreTokens.length >= 2 ? Math.min(2, coreTokens.length) : 1;
  if (matchedCount < requiredMatches) {
    return -20;
  }

  let score = matchedCount * 20;
  const titleLower = candidate.title.toLowerCase().replace(/['’`]/g, '');
  const normQuery = rawQuery.toLowerCase().replace(/['’`]/g, '').trim();
  if (titleLower === normQuery || haystack.includes(normQuery)) {
    score += 35;
  } else if (titleLower.includes(coreTokens[0])) {
    score += 15;
  }

  // Prefer Wikimedia Commons File hits when multiple core tokens match inside the actual filename
  if (candidate.source === 'commons.wikimedia.org') {
    score += 10;
  }

  // Penalize overly generic article titles when a more specific file is available
  if (/\b(poster|logo|kota|kabupaten|provinsi|daftar)\b/i.test(titleLower) && !/\b(poster|logo)\b/i.test(normQuery)) {
    score -= 12;
  }

  return score;
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
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

async function queryWikipediaPageImages(
  lang: 'id' | 'en',
  query: string,
  limit = 4
): Promise<MediaSearchResult[]> {
  const endpoint =
    `https://${lang}.wikipedia.org/w/api.php` +
    `?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}` +
    `&gsrlimit=${limit}&prop=pageimages&piprop=thumbnail|original&pithumbsize=600&format=json`;

  const data = await fetchJsonWithTimeout(endpoint);
  const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];
  const results: MediaSearchResult[] = [];

  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  for (const page of pages) {
    const thumb = page?.thumbnail;
    const orig = page?.original;
    const chosenUrl = thumb?.source || orig?.source;
    if (!chosenUrl || !isAcceptableImageUrl(chosenUrl, page?.title)) continue;
    const w = Number(thumb?.width || orig?.width || 0);
    const h = Number(thumb?.height || orig?.height || 0);
    if (w > 0 && w < 100) continue;
    if (w > 0 && h > 0 && (w / h > 3.5 || h / w > 3.5)) continue;
    results.push({
      url: orig?.source || chosenUrl,
      thumbUrl: chosenUrl,
      title: String(page?.title || query),
      source: `${lang}.wikipedia.org`,
      width: w || undefined,
      height: h || undefined
    });
  }
  return results;
}

async function queryWikimediaCommons(query: string, limit = 6): Promise<MediaSearchResult[]> {
  const endpoint =
    `https://commons.wikimedia.org/w/api.php` +
    `?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
    `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|thumbmime|size&iiurlwidth=600&format=json`;

  const data = await fetchJsonWithTimeout(endpoint);
  const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];
  const results: MediaSearchResult[] = [];

  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  for (const page of pages) {
    const info = Array.isArray(page?.imageinfo) ? page.imageinfo[0] : null;
    if (!info) continue;
    const origMime = String(info.mime || '').toLowerCase();
    if (origMime === 'application/pdf' || origMime.includes('djvu') || origMime.includes('tiff') || origMime === 'image/gif') {
      continue;
    }
    const effectiveMime = String(info.thumbmime || info.mime || '').toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(effectiveMime)) continue;
    const thumbUrl = info.thumburl || info.url;
    const fullUrl = info.url || thumbUrl;
    const title = String(page?.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '');
    if (!thumbUrl || !isAcceptableImageUrl(thumbUrl, title) || !isAcceptableImageUrl(fullUrl, title)) continue;
    const w = Number(info.thumbwidth || info.width || 0);
    const h = Number(info.thumbheight || info.height || 0);
    if (w > 0 && w < 120) continue;
    if (w > 0 && h > 0 && (w / h > 3.5 || h / w > 3.5)) continue;
    results.push({
      url: fullUrl,
      thumbUrl,
      title,
      source: 'commons.wikimedia.org',
      width: w || undefined,
      height: h || undefined
    });
  }
  return results;
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

  const coreTokens = extractCoreTokens(cleanQuery);

  // Step 1: Search Wikimedia Commons directly first (matches actual image filenames & diagrams cleanly without article-infobox confusion)
  const commons = await queryWikimediaCommons(cleanQuery, 8);
  const scoredCommons = commons
    .map((item) => ({ ...item, score: scoreCandidateRelevance(item, coreTokens, cleanQuery) }))
    .filter((item) => (item.score ?? -1) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (scoredCommons.length >= limit) {
    return scoredCommons.slice(0, limit);
  }

  // Step 2: Query id.wikipedia (or en.wikipedia if few high-confidence Commons matches)
  const [wikiId, wikiEn] = await Promise.all([
    queryWikipediaPageImages('id', cleanQuery, 4),
    scoredCommons.length === 0 ? queryWikipediaPageImages('en', cleanQuery, 3) : Promise.resolve([])
  ]);

  const combined = [...scoredCommons, ...wikiId, ...wikiEn]
    .map((item) => ({
      ...item,
      score: item.score ?? scoreCandidateRelevance(item, coreTokens, cleanQuery)
    }))
    .filter((item) => (item.score ?? -1) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const merged: MediaSearchResult[] = [];
  const seen = new Set<string>();
  for (const item of combined) {
    const key = item.thumbUrl.split('?')[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
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
