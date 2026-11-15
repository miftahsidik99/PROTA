import type { QuestionPG, QuestionIsian, QuestionUraian, VisualType } from './NaskahSumatifGenerator';
import {
  extractMediaCoreTokens,
  parseCommonsPages,
  parseWikipediaPages,
  rankAndFilterMediaCandidates
} from './api/media/_relevance';
import { isSpoilerIdentificationQuestion, synthesizeContextual2dVisual } from './dynamic2dVisualHelper';

export interface WebImageHit {
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
}

const searchCandidatesCache = new Map<string, WebImageHit[]>();

// Real-world concepts whose internet photos/diagrams accurately match the question context.
// Exact numeric/labeled bank diagrams (clock_*, fraction_*, shape_*, plant_anatomy nomor (2), chart_bar)
// keep their exact labeled visualSvg so measurements & numbered labels stay 100% consistent.
const VISUAL_TYPE_SEARCH_QUERIES: Partial<Record<VisualType, { query: string; fallbackQuery?: string; title: string }>> = {
  water_cycle: { query: 'Siklus air', fallbackQuery: 'Water cycle diagram', title: 'Diagram Siklus Air (Evaporasi - Kondensasi - Presipitasi)' },
  food_chain: { query: 'Rantai makanan', fallbackQuery: 'Simple food chain diagram', title: 'Diagram Rantai Makanan' },
  garuda_bintang: { query: 'Pancasila Sila 1 Star', fallbackQuery: 'Bintang Pancasila', title: 'Lambang Sila Ke-1 Pancasila' },
  garuda_rantai: { query: 'Pancasila Sila 2 Chain', fallbackQuery: 'Rantai Pancasila', title: 'Lambang Sila Ke-2 Pancasila' },
  garuda_beringin: { query: 'Pancasila Sila 3 Banyan', fallbackQuery: 'Beringin Pancasila', title: 'Lambang Sila Ke-3 Pancasila' },
  garuda_banteng: { query: 'Pancasila Sila 4 Buffalo', fallbackQuery: 'Banteng Pancasila', title: 'Lambang Sila Ke-4 Pancasila' },
  garuda_padi_kapas: { query: 'Pancasila Sila 5 Rice Cotton', fallbackQuery: 'Padi kapas Pancasila', title: 'Lambang Sila Ke-5 Pancasila' },
  traffic_sign: { query: 'Rambu dilarang parkir', fallbackQuery: 'No parking road sign', title: 'Rambu Lalu Lintas' }
};

interface ContextualVisualRule {
  pattern: RegExp;
  query: string;
  fallbackQuery?: string;
  title: string;
}

const CONTEXTUAL_VISUAL_RULES: ContextualVisualRule[] = [
  // Bahasa Sunda & Seni Budaya Daerah
  { pattern: /\btangkuban\s+parahu\b/i, query: 'Tangkuban Parahu', title: 'Gunung Tangkuban Parahu' },
  { pattern: /\bsitu\s+bagendit\b/i, query: 'Situ Bagendit Garut', title: 'Situ Bagendit' },
  { pattern: /\bangklung\b/i, query: 'Angklung', fallbackQuery: 'Angklung Jawa Barat', title: 'Alat Musik Tradisional' },
  { pattern: /\bwayang\s+golek\b/i, query: 'Wayang Golek', fallbackQuery: 'Wayang golek Sunda', title: 'Kasenian Wayang Golek' },
  { pattern: /\bjaipong\b/i, query: 'Tari Jaipong', title: 'Tari Jaipongan' },
  { pattern: /\bcongklak\b/i, query: 'Congklak', fallbackQuery: 'Dakon congklak', title: 'Kaulinan Tradisional' },
  { pattern: /\begrang|jajangkungan\b/i, query: 'Egrang', fallbackQuery: 'Stilts Indonesia', title: 'Kaulinan Tradisional' },
  { pattern: /\bsurabi|serabi\b/i, query: 'Serabi', fallbackQuery: 'Surabi makanan', title: 'Kadaharan Khas Daerah' },
  { pattern: /\baksara\s+sunda|kaganga\b/i, query: 'Aksara Sunda', fallbackQuery: 'Sundanese script', title: 'Aksara Sunda Kaganga' },
  { pattern: /\bjulang\s+ngapak|tepas\s+imah\b/i, query: 'Rumah adat Sunda', fallbackQuery: 'Julang Ngapak', title: 'Imah Adat Sunda' },
  { pattern: /\bsisingaan\b/i, query: 'Sisingaan Subang', title: 'Kasenian Sisingaan' },
  { pattern: /\bkujang\b/i, query: 'Kujang Jawa Barat', title: 'Kujang' },
  { pattern: /\bcalung\b/i, query: 'Calung', title: 'Alat Musik Tradisional' },
  { pattern: /\bhayam\s+jago\b/i, query: 'Ayam jago', title: 'Sasatoan Piaraan' },
  { pattern: /\bmelak\s+cau|tangkal\s+cau\b/i, query: 'Pohon pisang', title: 'Tangkal Cau' },
  { pattern: /\btangkal\s+kalapa\b/i, query: 'Pohon kelapa pantai', title: 'Tangkal Kalapa' },
  { pattern: /\bbubuahan\s+seger|gedang\b/i, query: 'Buah pepaya', title: 'Bubuahan Seger' },

  // IPAS / IPA
  { pattern: /\bfotosintesis\b/i, query: 'Fotosintesis', fallbackQuery: 'Photosynthesis diagram', title: 'Proses Fotosintesis' },
  { pattern: /\bmetamorfosis|daur\s+hidup\s+kupu-kupu\b/i, query: 'Metamorfosis kupu-kupu', fallbackQuery: 'Butterfly metamorphosis', title: 'Daur Hidup Hewan' },
  { pattern: /\bbunglon\b/i, query: 'Bunglon', fallbackQuery: 'Chameleon', title: 'Adaptasi Hewan' },
  { pattern: /\bsiklus\s+air|daur\s+air\b/i, query: 'Siklus air', fallbackQuery: 'Water cycle diagram', title: 'Siklus Air' },
  { pattern: /\brantai\s+makanan\b/i, query: 'Rantai makanan', fallbackQuery: 'Simple food chain diagram', title: 'Rantai Makanan' },
  { pattern: /\bgerhana\s+matahari\b/i, query: 'Gerhana matahari', fallbackQuery: 'Solar eclipse', title: 'Gerhana Matahari' },
  { pattern: /\bgerhana\s+bulan\b/i, query: 'Gerhana bulan', fallbackQuery: 'Lunar eclipse', title: 'Gerhana Bulan' },
  { pattern: /\bgunung\s+(berapi|meletus)\b/i, query: 'Gunung berapi', fallbackQuery: 'Volcano eruption', title: 'Gunung Berapi' },
  { pattern: /\brangkaian\s+listrik\b/i, query: 'Rangkaian listrik', fallbackQuery: 'Electrical circuit', title: 'Rangkaian Listrik' },
  { pattern: /\bmagnet\b/i, query: 'Magnet batang', fallbackQuery: 'Bar magnet', title: 'Sifat Magnet' },
  { pattern: /\bhutan\s+bakau|mangrove\b/i, query: 'Hutan bakau', fallbackQuery: 'Mangrove forest', title: 'Ekosistem Hutan Bakau' },
  { pattern: /\btata\s+surya\b/i, query: 'Tata surya', fallbackQuery: 'Solar system', title: 'Sistem Tata Surya' },
  { pattern: /\bkucing\b/i, query: 'Kucing', title: 'Makhluk Hidup di Sekitar' },
  { pattern: /\bsinar\s+matahari\b/i, query: 'Matahari pagi', title: 'Sumber Energi Matahari' },
  { pattern: /\bes\s+lilin|es\s+batu|freezer\b/i, query: 'Es batu', title: 'Perubahan Wujud Benda' },

  // PJOK
  { pattern: /\bpencak\s+silat\b/i, query: 'Pencak silat', title: 'Olahraga Pencak Silat' },
  { pattern: /\bbola\s+voli\b/i, query: 'Bola voli', fallbackQuery: 'Volleyball match', title: 'Permainan Bola Voli' },
  { pattern: /\bsepak\s+bola|bermain\s+bola\b/i, query: 'Pertandingan sepak bola', fallbackQuery: 'Association football', title: 'Permainan Sepak Bola' },
  { pattern: /\bbola\s+basket\b/i, query: 'Bola basket', fallbackQuery: 'Basketball game', title: 'Permainan Bola Basket' },
  { pattern: /\bbulu\s+tangkis\b/i, query: 'Bulu tangkis', fallbackQuery: 'Badminton', title: 'Permainan Bulu Tangkis' },
  { pattern: /\btenis\s+meja\b/i, query: 'Tenis meja', fallbackQuery: 'Table tennis', title: 'Permainan Tenis Meja' },
  { pattern: /\blompat\s+jauh\b/i, query: 'Lompat jauh', fallbackQuery: 'Long jump', title: 'Atletik Lompat Jauh' },
  { pattern: /\bsenam\s+lantai\b/i, query: 'Senam lantai', fallbackQuery: 'Floor gymnastics', title: 'Senam Lantai' },
  { pattern: /\brenang\b/i, query: 'Renang olahraga', fallbackQuery: 'Swimming pool sport', title: 'Olahraga Renang' },
  { pattern: /\bluka\s+lecet|pertolongan\s+pertama|p3k\b/i, query: 'Kotak P3K', title: 'Pertolongan Pertama (P3K)' },

  // Pendidikan Pancasila, Bahasa Indonesia & IPS
  { pattern: /\bgaruda\s+pancasila\b/i, query: 'Garuda Pancasila', title: 'Lambang Negara Garuda Pancasila' },
  { pattern: /\bbendera\s+merah\s+putih|upacara\s+bendera\b/i, query: 'Bendera Indonesia', title: 'Upacara Bendera Merah Putih' },
  { pattern: /\bcandi\s+borobudur\b/i, query: 'Candi Borobudur', title: 'Candi Borobudur' },
  { pattern: /\bcandi\s+prambanan\b/i, query: 'Candi Prambanan', title: 'Candi Prambanan' },
  { pattern: /\bmonas|monumen\s+nasional\b/i, query: 'Monas Jakarta', title: 'Monumen Nasional' },
  { pattern: /\bkomodo\b/i, query: 'Komodo', title: 'Komodo' },
  { pattern: /\borangutan\b/i, query: 'Orangutan', title: 'Orangutan' },
  { pattern: /\bpohon\s+kelapa|tepi\s+pantai\b/i, query: 'Pohon kelapa pantai', title: 'Pemandangan Pesisir Pantai' },
  { pattern: /\breboisasi|menanam\s+pohon\b/i, query: 'Penanaman pohon', title: 'Kegiatan Reboisasi' },
  { pattern: /\bsemut\b/i, query: 'Semut', title: 'Ilustrasi Cerita Fabel' },
  { pattern: /\bkancil\b/i, query: 'Kancil', fallbackQuery: 'Tragulus', title: 'Ilustrasi Cerita Fabel' },
  { pattern: /\bperpustakaan\b/i, query: 'School library', title: 'Perpustakaan Sekolah' },
  { pattern: /\bsawah|petani\s+padi\b/i, query: 'Sawah padi Indonesia', fallbackQuery: 'Rice paddy terrace Indonesia', title: 'Lahan Pertanian Padi' },
  { pattern: /\bpasar\s+tradisional\b/i, query: 'Pasar tradisional Indonesia', title: 'Pasar Tradisional' },
  { pattern: /\bzebra\s+cross|lampu\s+lalu\s+lintas\b/i, query: 'Traffic light Indonesia', fallbackQuery: 'Zebra crossing', title: 'Keselamatan Jalan Raya' },
  { pattern: /\brumah\s+adat|rumah\s+gadang|joglo\b/i, query: 'Rumah Gadang', fallbackQuery: 'Rumah adat Indonesia', title: 'Rumah Adat Nusantara' },
  { pattern: /\bgotong\s+royong|kerja\s+bakti\b/i, query: 'Gotong royong Indonesia', title: 'Kegiatan Gotong Royong' },

  // Bahasa Inggris
  { pattern: /\bfried\s+rice|chicken\s+noodles\b/i, query: 'Nasi goreng', title: 'Indonesian Food' },
  { pattern: /\bapples?\b/i, query: 'Red apple', title: 'Fruits' },
  { pattern: /\btall\s+wild\s+animal|giraffe\b/i, query: 'Giraffe', title: 'Wild Animal' },
  { pattern: /\blibrary\b/i, query: 'School library', title: 'School Library' },
  { pattern: /\belephant\b/i, query: 'Elephant', title: 'Wild Animal' },
  { pattern: /\bsumatran\s+tiger|\btiger\b/i, query: 'Sumatran tiger', title: 'Wild Animal' },
  { pattern: /\bclassroom\b/i, query: 'Classroom', title: 'Classroom' },
  { pattern: /\bbicycle\b/i, query: 'Bicycle', title: 'Transportation' },

  // PAI
  { pattern: /\bka'?bah|masjidil\s+haram\b/i, query: 'Kabah Mekkah', fallbackQuery: 'Kaaba Mecca', title: "Ka'bah Masjidil Haram" },
  { pattern: /(?:ber)?wud[hu]u?\b/i, query: 'Tempat wudhu', fallbackQuery: 'Wudhu', title: 'Tata Cara Berwudu' },
  { pattern: /\b(?:salat|shalat)\s+(?:fardu|wajib|lima\s+waktu|berjamaah)\b|\bmasjid\b/i, query: 'Masjid Istiqlal Jakarta', fallbackQuery: 'Mosque Indonesia', title: 'Ibadah di Masjid' },
  { pattern: /\bal-?qur'?an|mushaf|surah\s+al-/i, query: 'Mushaf Quran', fallbackQuery: 'Quran', title: 'Kitab Suci Al-Quran' },
  { pattern: /\bidulfitri|bulan\s+ramadan\b/i, query: 'Ketupat Lebaran', fallbackQuery: 'Masjid Istiqlal Jakarta', title: 'Tradisi Hari Raya Idulfitri' },

  // Seni Rupa
  { pattern: /\bbatik\b/i, query: 'Batik Indonesia', title: 'Seni Batik Nusantara' },
  { pattern: /\bgamelan\b/i, query: 'Gamelan Indonesia', title: 'Alat Musik Gamelan' },
  { pattern: /\banyaman\b/i, query: 'Anyaman bambu', fallbackQuery: 'Bamboo weaving Indonesia', title: 'Kerajinan Anyaman' },
  { pattern: /\bgerabah\b/i, query: 'Gerabah Indonesia', fallbackQuery: 'Indonesian pottery', title: 'Kerajinan Gerabah' },
  { pattern: /\btopeng\b/i, query: 'Topeng Indonesia', fallbackQuery: 'Tari topeng', title: 'Karya Seni Topeng' },
  { pattern: /\bmelukis|cat\s+air\b/i, query: 'Melukis cat air', title: 'Seni Lukis Cat Air' },
  { pattern: /\bkolase|mozaik\b/i, query: 'Mosaic art', title: 'Karya Seni Mozaik' },
  { pattern: /\bpatung\b/i, query: 'Patung Indonesia', title: 'Karya Seni Patung' }
];

async function fetchJsonDirectCors(url: string, timeoutMs = 7000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
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

/**
 * Direct browser-side Wikimedia Commons & Wikipedia CORS fallback (&origin=*).
 * Returns up to 5 ranked candidates so duplicate images can be skipped across questions.
 */
async function searchDirectFromBrowserWikimedia(rawQuery: string, limit = 5): Promise<WebImageHit[]> {
  const cleanQuery = String(rawQuery || '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  if (!cleanQuery || typeof fetch !== 'function') return [];

  const toHits = (ranked: any[]): WebImageHit[] =>
    ranked
      .filter((r) => r && r.thumbUrl)
      .map((r) => ({
        url: r.url || r.thumbUrl,
        thumbUrl: r.thumbUrl,
        title: r.title || cleanQuery,
        source: r.source || 'internet'
      }));

  const tryDirect = async (q: string): Promise<WebImageHit[]> => {
    const commonsUrl =
      `https://commons.wikimedia.org/w/api.php` +
      `?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=10&prop=imageinfo&iiprop=url|mime|thumbmime|size&iiurlwidth=600&format=json&origin=*`;
    const commonsData = await fetchJsonDirectCors(commonsUrl);
    const commonsCandidates = parseCommonsPages(commonsData);
    let ranked = rankAndFilterMediaCandidates(commonsCandidates, q, limit);
    if (ranked.length >= 2) {
      return toHits(ranked);
    }

    const wikiIdUrl =
      `https://id.wikipedia.org/w/api.php` +
      `?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=5&prop=pageimages&piprop=thumbnail|original&pithumbsize=600&format=json&origin=*`;
    const wikiIdData = await fetchJsonDirectCors(wikiIdUrl);
    const wikiIdCandidates = parseWikipediaPages(wikiIdData, 'id.wikipedia.org');
    ranked = rankAndFilterMediaCandidates([...commonsCandidates, ...wikiIdCandidates], q, limit);
    if (ranked.length >= 2) {
      return toHits(ranked);
    }

    const wikiEnUrl =
      `https://en.wikipedia.org/w/api.php` +
      `?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=5&prop=pageimages&piprop=thumbnail|original&pithumbsize=600&format=json&origin=*`;
    const wikiEnData = await fetchJsonDirectCors(wikiEnUrl);
    const wikiEnCandidates = parseWikipediaPages(wikiEnData, 'en.wikipedia.org');
    ranked = rankAndFilterMediaCandidates([...commonsCandidates, ...wikiIdCandidates, ...wikiEnCandidates], q, limit);
    return toHits(ranked);
  };

  const directHits = await tryDirect(cleanQuery);
  if (directHits.length > 0) return directHits;

  const coreTokens = extractMediaCoreTokens(cleanQuery);
  const compactQuery = coreTokens.slice(0, 2).join(' ');
  if (compactQuery && compactQuery.toLowerCase() !== cleanQuery.toLowerCase()) {
    return await tryDirect(compactQuery);
  }
  return [];
}

let backendMediaUnavailable = false;
let backendEmptyStreak = 0;

async function searchSingleQueryCandidates(query: string): Promise<WebImageHit[]> {
  const key = query.trim().toLowerCase();
  if (!key) return [];
  if (searchCandidatesCache.has(key)) {
    return searchCandidatesCache.get(key) || [];
  }

  if (typeof fetch !== 'function') return [];

  // 1. Try app backend endpoint (/api/media/search) with short timeout unless already marked unavailable
  if (!backendMediaUnavailable) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`/api/media/search?q=${encodeURIComponent(query)}&limit=5`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          const results: WebImageHit[] = Array.isArray(data?.results)
            ? data.results
                .filter((r: any) => r && r.thumbUrl)
                .map((r: any) => ({
                  url: r.url || r.thumbUrl,
                  thumbUrl: r.thumbUrl,
                  title: r.title || query,
                  source: r.source || 'internet'
                }))
            : [];
          if (results.length > 0) {
            backendEmptyStreak = 0;
            searchCandidatesCache.set(key, results);
            return results;
          }
          backendEmptyStreak++;
          if (backendEmptyStreak >= 2) {
            backendMediaUnavailable = true;
          }
        } else {
          backendMediaUnavailable = true;
        }
      } else {
        backendMediaUnavailable = true;
      }
    } catch {
      backendMediaUnavailable = true;
    }
  }

  // 2. Fallback directly from browser to Wikimedia/Wikipedia CORS (&origin=*)
  const browserHits = await searchDirectFromBrowserWikimedia(query, 5);
  searchCandidatesCache.set(key, browserHits);
  return browserHits;
}

export async function searchInternetImageCandidates(query: string, fallbackQuery?: string): Promise<WebImageHit[]> {
  const primary = await searchSingleQueryCandidates(query);
  if (fallbackQuery && fallbackQuery.trim() && fallbackQuery.trim().toLowerCase() !== query.trim().toLowerCase()) {
    if (primary.length >= 2) return primary;
    const secondary = await searchSingleQueryCandidates(fallbackQuery);
    return [...primary, ...secondary];
  }
  return primary;
}

export async function searchInternetImage(query: string, fallbackQuery?: string): Promise<WebImageHit | null> {
  const hits = await searchInternetImageCandidates(query, fallbackQuery);
  return hits[0] || null;
}

function canonicalizeImageUrl(rawUrl: string): { urlKey: string; baseName: string } {
  const clean = String(rawUrl || '').trim().split('?')[0].toLowerCase();
  const segments = clean.split('/').filter(Boolean);
  let lastSeg = segments[segments.length - 1] || clean;
  // Normalize Wikimedia thumb filename (e.g., "600px-Foo.jpg" -> "foo.jpg")
  lastSeg = lastSeg.replace(/^\d+px-/, '');
  return { urlKey: clean, baseName: lastSeg };
}

function isUrlAlreadyUsed(rawUrl: string, usedUrls: Set<string>, usedBaseNames: Set<string>): boolean {
  const { urlKey, baseName } = canonicalizeImageUrl(rawUrl);
  if (!urlKey) return true;
  if (usedUrls.has(urlKey)) return true;
  if (baseName && baseName.length > 4 && usedBaseNames.has(baseName)) return true;
  return false;
}

function markUrlAsUsed(rawUrl: string, usedUrls: Set<string>, usedBaseNames: Set<string>): void {
  const { urlKey, baseName } = canonicalizeImageUrl(rawUrl);
  if (urlKey) usedUrls.add(urlKey);
  if (baseName && baseName.length > 4) usedBaseNames.add(baseName);
}

function pickUnusedWebHit(
  hits: WebImageHit[],
  usedUrls: Set<string>,
  usedBaseNames: Set<string>
): WebImageHit | null {
  for (const hit of hits) {
    if (!hit || !hit.thumbUrl) continue;
    if (!isUrlAlreadyUsed(hit.thumbUrl, usedUrls, usedBaseNames)) {
      return hit;
    }
  }
  return null;
}

function isPureMathMeasurementQuestion(question: string, stimulus?: string): boolean {
  const txt = `${stimulus || ''} ${question || ''}`.toLowerCase();
  return /\b(\d+\s*(cm|mm|dm|m|km|kg|gram|gr|liter|ml|jam|menit|detik|derajat|°)|pecahan\s+\d+\/\d+|berukuran\s+\d+|keliling\s+(persegi|segitiga|lingkaran)|luas\s+(persegi|segitiga|lingkaran)|volume\s+(kubus|balok))\b/.test(txt);
}

function isLinguisticGrammarQuestion(question: string, stimulus?: string): boolean {
  const qLower = (question || '').toLowerCase();
  const txt = `${stimulus || ''} ${question || ''}`.toLowerCase();
  return (
    /\b(kata\s+tanya|kata\s+hubung|konjungsi|imbuhan|awalan|akhiran|sinonim|antonim|ide\s+pokok|gagasan\s+utama|kalimat\s+utama|tanda\s+(?:petik|tanya|seru|titik|koma)|huruf\s+kapital|kalimat\s+(?:efektif|langsung|rumpang)|majas|personifikasi|hiperbola|metafora)\b/.test(
      qLower
    ) ||
    (/\[\.\.\.\]|\.\.\./.test(qLower) && /\b(kapan|siapa|mengapa|di\s+mana|bagaimana|tanda|imbuhan)\b/.test(txt))
  );
}

export function deriveVisualSearchSpec(
  question: string,
  stimulus: string | undefined,
  _subject: string,
  visualType?: VisualType | string,
  visualTitle?: string,
  explicitQuery?: string,
  allowStrictPgTopicRule = false
): { query: string; fallbackQuery?: string; title: string; ruleKey?: string } | null {
  const normType = String(visualType || 'none').trim().toLowerCase() as VisualType;

  // Preserve exact labeled/measured 2D SVG diagrams instead of swapping them to unmatching web photos
  if (
    normType === 'clock_0900' ||
    normType === 'clock_0200' ||
    normType === 'fraction_circle' ||
    normType === 'fraction_rect' ||
    normType === 'shape_rect' ||
    normType === 'shape_triangle' ||
    normType === 'shape_cube' ||
    normType === 'shape_cuboid' ||
    normType === 'cube_net' ||
    normType === 'plant_anatomy' ||
    normType === 'chart_bar' ||
    normType.startsWith('dynamic_')
  ) {
    return null;
  }

  const avoidSpoiler = isSpoilerIdentificationQuestion(question);

  if (normType && normType !== 'none' && VISUAL_TYPE_SEARCH_QUERIES[normType]) {
    const mapped = VISUAL_TYPE_SEARCH_QUERIES[normType]!;
    return {
      query: mapped.query,
      fallbackQuery: mapped.fallbackQuery,
      title: avoidSpoiler ? 'Gambar Konteks Soal' : (visualTitle?.trim() || mapped.title),
      ruleKey: `type:${normType}`
    };
  }

  const combinedText = `${stimulus || ''} ${question || ''}`;
  const explicitlyAsksForImage = /\b(perhatikan\s+gambar|amati\s+gambar|titénan\s+gambar|titenan\s+gambar|gambar\s+di\s+handap|gambar\s+berikut|ilustrasi\s+berikut)\b/i.test(
    combinedText
  );

  if (explicitQuery && explicitQuery.trim()) {
    if (isPureMathMeasurementQuestion(question, stimulus) && !explicitlyAsksForImage) {
      return null;
    }
    const cleanExplicit = explicitQuery.trim();
    return {
      query: cleanExplicit,
      title: avoidSpoiler ? 'Gambar Konteks Soal' : (visualTitle?.trim() || cleanExplicit),
      ruleKey: `query:${cleanExplicit.toLowerCase()}`
    };
  }

  if (
    explicitlyAsksForImage ||
    (allowStrictPgTopicRule &&
      !isPureMathMeasurementQuestion(question, stimulus) &&
      !isLinguisticGrammarQuestion(question, stimulus))
  ) {
    for (const rule of CONTEXTUAL_VISUAL_RULES) {
      if (rule.pattern.test(combinedText)) {
        return {
          query: rule.query,
          fallbackQuery: rule.fallbackQuery,
          title: avoidSpoiler ? 'Gambar Konteks Soal' : (visualTitle?.trim() || rule.title),
          ruleKey: `rule:${rule.query.toLowerCase()}`
        };
      }
    }
  }

  return null;
}

/**
 * Enriches assessment questions with:
 * 1. Exact parameterized 2D Math/Science SVG diagrams matching exact numbers/dimensions in the question.
 * 2. Real internet images for real-world/observational questions, strictly deduplicated across ALL items.
 * 3. Context-matched 2D fallback SVG illustrations whenever internet search has no relevant/unique match,
 *    guaranteeing Matematika, Bahasa Indonesia, and all subjects show relevant non-duplicate visuals.
 */
export async function enrichAssessmentWithWebImages(params: {
  pgQuestions: QuestionPG[];
  isianQuestions: QuestionIsian[];
  uraianQuestions: QuestionUraian[];
  subject: string;
  includeVisuals: boolean;
}): Promise<{
  pgQuestions: QuestionPG[];
  isianQuestions: QuestionIsian[];
  uraianQuestions: QuestionUraian[];
}> {
  const { pgQuestions, isianQuestions, uraianQuestions, subject, includeVisuals } = params;

  if (!includeVisuals) {
    return {
      pgQuestions: pgQuestions.map((q) => ({
        ...q,
        visualType: 'none',
        visualTitle: '',
        visualSvg: undefined,
        visualImageUrl: undefined,
        visualQuery: undefined
      })),
      isianQuestions: isianQuestions.map((q) => ({
        ...q,
        visualType: 'none',
        visualTitle: '',
        visualSvg: undefined,
        visualImageUrl: undefined,
        visualQuery: undefined
      })),
      uraianQuestions: uraianQuestions.map((q) => ({
        ...q,
        visualType: 'none',
        visualTitle: '',
        visualSvg: undefined,
        visualImageUrl: undefined,
        visualQuery: undefined
      }))
    };
  }

  const MAX_WEB_IMAGES = 8;
  let fetchedWebCount = 0;

  const usedCanonicalUrls = new Set<string>();
  const usedFileBasenames = new Set<string>();
  const usedSvgSignatures = new Set<string>();
  const usedRuleKeys = new Set<string>();

  type EnrichableQ = {
    question: string;
    stimulus?: string;
    options?: { key: string; text: string }[];
    correctAnswer?: string;
    visualType?: VisualType | string;
    visualTitle?: string;
    visualSvg?: string;
    visualQuery?: string;
    visualImageUrl?: string;
    __lockedExact2d?: boolean;
  };

  // Step 0: Parameterize exact 2D Math/Science SVGs and deduplicate pre-existing static SVGs/URLs
  const prepareExactAndDedupe = <T extends EnrichableQ>(items: T[]): T[] =>
    items.map((q) => {
      if (q.visualImageUrl) {
        if (isUrlAlreadyUsed(q.visualImageUrl, usedCanonicalUrls, usedFileBasenames)) {
          return { ...q, visualImageUrl: undefined, visualSvg: undefined, visualType: 'none', visualQuery: undefined };
        }
        markUrlAsUsed(q.visualImageUrl, usedCanonicalUrls, usedFileBasenames);
        return { ...q, visualSvg: undefined };
      }

      const avoidSpoiler = isSpoilerIdentificationQuestion(q.question);
      const exact2d = synthesizeContextual2dVisual(q, subject, { allowGeneralScene: false });
      if (exact2d) {
        if (usedSvgSignatures.has(exact2d.signature)) {
          // Exact same parameterized SVG already exists on another question -> avoid duplicate diagram
          return { ...q, visualSvg: undefined, visualType: 'none', visualTitle: '', visualQuery: undefined };
        }
        usedSvgSignatures.add(exact2d.signature);
        return {
          ...q,
          visualType: exact2d.visualType as VisualType,
          visualTitle: avoidSpoiler ? 'Gambar Konteks Soal' : (q.visualTitle?.trim() || exact2d.title),
          visualSvg: exact2d.svg,
          visualImageUrl: undefined,
          visualQuery: undefined,
          __lockedExact2d: true
        };
      }

      const normType = String(q.visualType || 'none').trim().toLowerCase();
      if (q.visualSvg && normType && normType !== 'none') {
        const staticSig = `static_${normType}`;
        if (usedSvgSignatures.has(staticSig)) {
          return { ...q, visualSvg: undefined, visualType: 'none', visualTitle: '', visualQuery: undefined };
        }
        usedSvgSignatures.add(staticSig);
      }

      return q;
    });

  let pgPrepared = prepareExactAndDedupe(pgQuestions as EnrichableQ[]);
  let isianPrepared = prepareExactAndDedupe(isianQuestions as EnrichableQ[]);
  let uraianPrepared = prepareExactAndDedupe(uraianQuestions as EnrichableQ[]);

  // Helper to resolve internet search + 2D contextual fallback for a list of questions
  const resolvePass = async <T extends EnrichableQ>(
    items: T[],
    allowContextualTopicFallback: boolean,
    targetPgVisualCap: number
  ): Promise<T[]> => {
    const currentVisualTotal = pgPrepared.filter((x) => x.visualImageUrl || x.visualSvg).length;
    let addedInPass = 0;

    const out: T[] = [];
    for (const q of items) {
      if (q.__lockedExact2d || q.visualImageUrl) {
        out.push(q);
        continue;
      }

      // When running Pass 2 contextual enrichment on PG, stop once we already have target visuals
      if (allowContextualTopicFallback && currentVisualTotal + addedInPass >= targetPgVisualCap) {
        out.push(q);
        continue;
      }

      // Skip already-assigned static visual during Pass 2
      if (allowContextualTopicFallback && q.visualSvg) {
        out.push(q);
        continue;
      }

      const combinedText = `${q.stimulus || ''} ${q.question || ''}`;
      const explicitlyAsksForImage = /\b(perhatikan\s+gambar|amati\s+gambar|titénan\s+gambar|titenan\s+gambar|gambar\s+di\s+handap|gambar\s+berikut|ilustrasi\s+berikut)\b/i.test(
        combinedText
      );

      const spec = deriveVisualSearchSpec(
        q.question,
        q.stimulus,
        subject,
        q.visualType,
        q.visualTitle,
        q.visualQuery,
        allowContextualTopicFallback
      );

      let resolvedWebHit: WebImageHit | null = null;
      if (spec && fetchedWebCount < MAX_WEB_IMAGES) {
        const ruleUsed = spec.ruleKey && usedRuleKeys.has(spec.ruleKey);
        if (!ruleUsed) {
          const candidates = await searchInternetImageCandidates(spec.query, spec.fallbackQuery);
          resolvedWebHit = pickUnusedWebHit(candidates, usedCanonicalUrls, usedFileBasenames);
          if (resolvedWebHit && spec.ruleKey) {
            usedRuleKeys.add(spec.ruleKey);
          }
        }
      }

      if (resolvedWebHit && resolvedWebHit.thumbUrl) {
        fetchedWebCount++;
        addedInPass++;
        markUrlAsUsed(resolvedWebHit.thumbUrl, usedCanonicalUrls, usedFileBasenames);
        // If replacing a static SVG placeholder (e.g. garuda_bintang / water_cycle), free its static signature
        const normType = String(q.visualType || 'none').trim().toLowerCase();
        if (normType && normType !== 'none') {
          usedSvgSignatures.delete(`static_${normType}`);
        }
        out.push({
          ...q,
          visualQuery: spec!.query,
          visualTitle: spec!.title || q.visualTitle?.trim() || '',
          visualImageUrl: resolvedWebHit.thumbUrl,
          visualSvg: undefined
        });
        continue;
      }

      // Web search returned no relevant/unique match (or item has no web rule):
      // Fall back to contextual 2D SVG if question asks for image, has a visualType, OR in Pass 2!
      const normType = String(q.visualType || 'none').trim().toLowerCase();
      const shouldTry2dFallback =
        explicitlyAsksForImage ||
        allowContextualTopicFallback ||
        (normType !== 'none' && !q.visualSvg) ||
        Boolean(q.visualQuery && q.visualQuery.trim());

      if (shouldTry2dFallback) {
        const scene2d = synthesizeContextual2dVisual(q, subject, { allowGeneralScene: true });
        if (scene2d && !usedSvgSignatures.has(scene2d.signature)) {
          usedSvgSignatures.add(scene2d.signature);
          addedInPass++;
          const avoidSpoiler = isSpoilerIdentificationQuestion(q.question);
          out.push({
            ...q,
            visualType: scene2d.visualType as VisualType,
            visualTitle: avoidSpoiler ? 'Gambar Konteks Soal' : (q.visualTitle?.trim() || scene2d.title),
            visualSvg: scene2d.svg,
            visualImageUrl: undefined,
            visualQuery: undefined
          });
          continue;
        }
      }

      // Keep pre-existing unique static SVG if it exists (e.g. water_cycle / plant_anatomy / garuda_* offline)
      if (q.visualSvg) {
        out.push(q);
      } else {
        out.push({
          ...q,
          visualQuery: undefined,
          visualImageUrl: undefined,
          visualSvg: undefined
        });
      }
    }
    return out;
  };

  // Pass 1: Explicit visual queries, symbol visualTypes, and explicit "Perhatikan gambar..." across all sections
  pgPrepared = await resolvePass(pgPrepared, false, 8);
  isianPrepared = await resolvePass(isianPrepared, false, 8);
  uraianPrepared = await resolvePass(uraianPrepared, false, 8);

  // Pass 2 (PG ONLY, never Isian/Uraian Essay #4!):
  // Guarantee 2–4 distinct relevant visuals (internet OR 2D SVG) across ALL subjects including Matematika & Bahasa Indonesia!
  const pgTargetVisuals = pgPrepared.length >= 10 ? 3 : 2;
  const currentPgVisuals = pgPrepared.filter((q) => q.visualImageUrl || q.visualSvg).length;
  if (currentPgVisuals < pgTargetVisuals) {
    pgPrepared = await resolvePass(pgPrepared, true, Math.max(pgTargetVisuals, 4));
  }

  const stripInternal = <T extends EnrichableQ>(items: T[]): T[] =>
    items.map(({ __lockedExact2d: _ignored, ...rest }) => rest as T);

  return {
    pgQuestions: stripInternal(pgPrepared) as QuestionPG[],
    isianQuestions: stripInternal(isianPrepared) as QuestionIsian[],
    uraianQuestions: stripInternal(uraianPrepared) as QuestionUraian[]
  };
}

