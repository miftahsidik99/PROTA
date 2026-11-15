import type { QuestionPG, QuestionIsian, QuestionUraian, VisualType } from './NaskahSumatifGenerator';
import {
  extractMediaCoreTokens,
  parseCommonsPages,
  parseWikipediaPages,
  rankAndFilterMediaCandidates
} from './api/media/_relevance';

export interface WebImageHit {
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
}

const searchCache = new Map<string, WebImageHit | null>();

// Real-world concepts whose internet photos/diagrams accurately match the question context.
// Exact numeric/labeled bank diagrams (clock_0900, fraction_circle 2/6, shape_rect 12x6, plant_anatomy nomor (2), chart_bar)
// keep their exact labeled visualSvg fallback so measurements & numbered labels stay 100% consistent.
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
  { pattern: /\bcandi\s+borobudur\b/i, query: 'Candi Borobudur', title: 'Candi Borobudur' },
  { pattern: /\bcandi\s+prambanan\b/i, query: 'Candi Prambanan', title: 'Candi Prambanan' },
  { pattern: /\bmonas|monumen\s+nasional\b/i, query: 'Monas Jakarta', title: 'Monumen Nasional' },
  { pattern: /\bkomodo\b/i, query: 'Komodo', title: 'Komodo' },
  { pattern: /\borangutan\b/i, query: 'Orangutan', title: 'Orangutan' },
  { pattern: /\bpohon\s+kelapa|tepi\s+pantai\b/i, query: 'Pohon kelapa pantai', title: 'Pemandangan Pesisir Pantai' },
  { pattern: /\breboisasi|menanam\s+pohon\b/i, query: 'Penanaman pohon', title: 'Kegiatan Reboisasi' },
  { pattern: /\bsemut\b/i, query: 'Semut', title: 'Ilustrasi Cerita Fabel' },
  { pattern: /\bperpustakaan\b/i, query: 'School library', title: 'Perpustakaan Sekolah' },
  { pattern: /\bsawah|petani\s+padi\b/i, query: 'Sawah padi Indonesia', fallbackQuery: 'Rice paddy terrace Indonesia', title: 'Lahan Pertanian Padi' },

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
 * Guarantees image search still succeeds when Vercel serverless IPs hit Wikimedia datacenter rate limits.
 */
async function searchDirectFromBrowserWikimedia(rawQuery: string): Promise<WebImageHit | null> {
  const cleanQuery = String(rawQuery || '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  if (!cleanQuery || typeof fetch !== 'function') return null;

  const tryDirect = async (q: string): Promise<WebImageHit | null> => {
    const commonsUrl =
      `https://commons.wikimedia.org/w/api.php` +
      `?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=8&prop=imageinfo&iiprop=url|mime|thumbmime|size&iiurlwidth=600&format=json&origin=*`;
    const commonsData = await fetchJsonDirectCors(commonsUrl);
    const commonsCandidates = parseCommonsPages(commonsData);
    let ranked = rankAndFilterMediaCandidates(commonsCandidates, q, 3);
    if (ranked.length > 0) {
      return {
        url: ranked[0].url,
        thumbUrl: ranked[0].thumbUrl,
        title: ranked[0].title,
        source: ranked[0].source
      };
    }

    const wikiIdUrl =
      `https://id.wikipedia.org/w/api.php` +
      `?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=4&prop=pageimages&piprop=thumbnail|original&pithumbsize=600&format=json&origin=*`;
    const wikiIdData = await fetchJsonDirectCors(wikiIdUrl);
    const wikiIdCandidates = parseWikipediaPages(wikiIdData, 'id.wikipedia.org');
    ranked = rankAndFilterMediaCandidates([...commonsCandidates, ...wikiIdCandidates], q, 3);
    if (ranked.length > 0) {
      return {
        url: ranked[0].url,
        thumbUrl: ranked[0].thumbUrl,
        title: ranked[0].title,
        source: ranked[0].source
      };
    }

    const wikiEnUrl =
      `https://en.wikipedia.org/w/api.php` +
      `?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=4&prop=pageimages&piprop=thumbnail|original&pithumbsize=600&format=json&origin=*`;
    const wikiEnData = await fetchJsonDirectCors(wikiEnUrl);
    const wikiEnCandidates = parseWikipediaPages(wikiEnData, 'en.wikipedia.org');
    ranked = rankAndFilterMediaCandidates([...commonsCandidates, ...wikiIdCandidates, ...wikiEnCandidates], q, 3);
    if (ranked.length > 0) {
      return {
        url: ranked[0].url,
        thumbUrl: ranked[0].thumbUrl,
        title: ranked[0].title,
        source: ranked[0].source
      };
    }
    return null;
  };

  const directHit = await tryDirect(cleanQuery);
  if (directHit) return directHit;

  const coreTokens = extractMediaCoreTokens(cleanQuery);
  const compactQuery = coreTokens.slice(0, 2).join(' ');
  if (compactQuery && compactQuery.toLowerCase() !== cleanQuery.toLowerCase()) {
    return await tryDirect(compactQuery);
  }
  return null;
}

let backendMediaUnavailable = false;
let backendEmptyStreak = 0;

async function searchSingleQuery(query: string): Promise<WebImageHit | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (searchCache.has(key)) {
    return searchCache.get(key) || null;
  }

  if (typeof fetch !== 'function') return null;

  // 1. Try app backend endpoint (/api/media/search) with short timeout unless already marked unavailable
  if (!backendMediaUnavailable) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`/api/media/search?q=${encodeURIComponent(query)}&limit=3`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          const first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
          if (first && first.thumbUrl) {
            backendEmptyStreak = 0;
            const hit: WebImageHit = {
              url: first.url || first.thumbUrl,
              thumbUrl: first.thumbUrl,
              title: first.title || query,
              source: first.source || 'internet'
            };
            searchCache.set(key, hit);
            return hit;
          }
          backendEmptyStreak++;
          if (backendEmptyStreak >= 2) {
            backendMediaUnavailable = true;
          }
        } else {
          // Non-JSON (e.g. Vercel SPA HTML rewrite) -> skip backend on subsequent queries
          backendMediaUnavailable = true;
        }
      } else {
        backendMediaUnavailable = true;
      }
    } catch {
      // Network/timeout error -> skip backend for rest of session and use direct browser CORS
      backendMediaUnavailable = true;
    }
  }

  // 2. Fallback directly from browser to Wikimedia/Wikipedia CORS (&origin=*)
  // Bypassing Vercel serverless shared IP limits guarantees consistent results in production!
  const browserHit = await searchDirectFromBrowserWikimedia(query);
  searchCache.set(key, browserHit);
  return browserHit;
}

export async function searchInternetImage(query: string, fallbackQuery?: string): Promise<WebImageHit | null> {
  const primary = await searchSingleQuery(query);
  if (primary) return primary;
  if (fallbackQuery && fallbackQuery.trim() && fallbackQuery.trim().toLowerCase() !== query.trim().toLowerCase()) {
    return await searchSingleQuery(fallbackQuery);
  }
  return null;
}

function isPureMathMeasurementQuestion(question: string, stimulus?: string): boolean {
  const txt = `${stimulus || ''} ${question || ''}`.toLowerCase();
  return /\b(\d+\s*(cm|mm|dm|m|km|kg|gram|gr|liter|ml|jam|menit|detik|derajat|°)|pecahan\s+\d+\/\d+|berukuran\s+\d+|keliling\s+(persegi|segitiga|lingkaran)|luas\s+(persegi|segitiga|lingkaran)|volume\s+(kubus|balok))\b/.test(txt);
}

function isSpoilerIdentificationQuestion(question: string): boolean {
  return /\b(naon\s+ngaran|ngaran\s+alat|sebutkeun\s+ngaran|apa\s+nama|disebut\s+dengan|tersebut\s+merupakan\s+lambang|termasuk\s+simbol)\b/i.test(
    question || ''
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
): { query: string; fallbackQuery?: string; title: string } | null {
  const normType = String(visualType || 'none').trim().toLowerCase() as VisualType;

  // Preserve exact labeled/measured bank diagrams instead of swapping them to unmatching web photos
  if (
    normType === 'clock_0900' ||
    normType === 'clock_0200' ||
    normType === 'fraction_circle' ||
    normType === 'fraction_rect' ||
    normType === 'shape_rect' ||
    normType === 'shape_triangle' ||
    normType === 'shape_cube' ||
    normType === 'cube_net' ||
    normType === 'plant_anatomy' ||
    normType === 'chart_bar'
  ) {
    return null;
  }

  const avoidSpoiler = isSpoilerIdentificationQuestion(question);

  if (normType && normType !== 'none' && VISUAL_TYPE_SEARCH_QUERIES[normType]) {
    const mapped = VISUAL_TYPE_SEARCH_QUERIES[normType]!;
    return {
      query: mapped.query,
      fallbackQuery: mapped.fallbackQuery,
      title: avoidSpoiler ? 'Gambar Konteks Soal' : (visualTitle?.trim() || mapped.title)
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
    return {
      query: explicitQuery.trim(),
      title: avoidSpoiler ? 'Gambar Konteks Soal' : (visualTitle?.trim() || explicitQuery.trim())
    };
  }

  if (explicitlyAsksForImage || (allowStrictPgTopicRule && !isPureMathMeasurementQuestion(question, stimulus))) {
    // Only match inside the actual question/stimulus (never subject header alone)
    for (const rule of CONTEXTUAL_VISUAL_RULES) {
      if (rule.pattern.test(combinedText)) {
        return {
          query: rule.query,
          fallbackQuery: rule.fallbackQuery,
          title: avoidSpoiler ? 'Gambar Konteks Soal' : (visualTitle?.trim() || rule.title)
        };
      }
    }
  }

  return null;
}

/**
 * Enriches questions that explicitly need visual observation with verified internet images.
 * Uses backend /api/media/search with seamless browser-CORS Wikimedia fallback so it works identically on localhost and Vercel.
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

  const resolveSequential = async <
    T extends {
      question: string;
      stimulus?: string;
      visualType?: VisualType | string;
      visualTitle?: string;
      visualSvg?: string;
      visualQuery?: string;
      visualImageUrl?: string;
    }
  >(
    items: T[],
    allowStrictTopicFallback: boolean
  ): Promise<T[]> => {
    const out: T[] = [];
    for (const q of items) {
      if (q.visualImageUrl) {
        out.push({ ...q, visualSvg: undefined });
        continue;
      }

      if (fetchedWebCount >= MAX_WEB_IMAGES) {
        out.push(q);
        continue;
      }

      const spec = deriveVisualSearchSpec(
        q.question,
        q.stimulus,
        subject,
        q.visualType,
        q.visualTitle,
        q.visualQuery,
        allowStrictTopicFallback && fetchedWebCount < 3
      );

      if (!spec) {
        out.push(q);
        continue;
      }

      const hit = await searchInternetImage(spec.query, spec.fallbackQuery);
      if (hit && hit.thumbUrl) {
        fetchedWebCount++;
        out.push({
          ...q,
          visualQuery: spec.query,
          visualTitle: spec.title || q.visualTitle?.trim() || '',
          visualImageUrl: hit.thumbUrl,
          visualSvg: undefined
        });
      } else {
        out.push({
          ...q,
          visualQuery: undefined,
          visualImageUrl: undefined
        });
      }
    }
    return out;
  };

  // Pass 1: Explicit visual queries, visualType symbols, and explicit "Perhatikan gambar..." across all sections
  let pgResolved = await resolveSequential(pgQuestions, false);
  const isianResolved = await resolveSequential(isianQuestions, false);
  const uraianResolved = await resolveSequential(uraianQuestions, false);

  // Pass 2 (PG ONLY, never Essay #4!): If fewer than 2 visual questions exist overall (e.g. PJOK, Sunda, Seni, PAI),
  // enrich up to 2 unambiguous concrete PG topics using verified web images.
  const totalVisualsSoFar =
    pgResolved.filter((q) => q.visualImageUrl || q.visualSvg).length +
    isianResolved.filter((q) => q.visualImageUrl || q.visualSvg).length +
    uraianResolved.filter((q) => q.visualImageUrl || q.visualSvg).length;

  if (totalVisualsSoFar < 2) {
    pgResolved = await resolveSequential(pgResolved, true);
  }

  return {
    pgQuestions: pgResolved,
    isianQuestions: isianResolved,
    uraianQuestions: uraianResolved
  };
}
