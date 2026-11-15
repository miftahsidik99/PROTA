import type { QuestionPG, QuestionIsian, QuestionUraian, VisualType } from './NaskahSumatifGenerator';

export interface WebImageHit {
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
}

const searchCache = new Map<string, WebImageHit | null>();

// Only real-world symbols/concepts whose internet photos/diagrams accurately answer the question.
// Exact numeric/labeled bank diagrams (clock_0900, fraction_circle 2/6, shape_rect 12x6, plant_anatomy nomor (2), chart_bar)
// keep their exact labeled visualSvg fallback so measurements & numbered labels remain 100% consistent with the question text.
const VISUAL_TYPE_SEARCH_QUERIES: Partial<Record<VisualType, { query: string; title: string }>> = {
  water_cycle: { query: 'Siklus air', title: 'Diagram Siklus Air (Evaporasi - Kondensasi - Presipitasi)' },
  food_chain: { query: 'Simple food chain diagram rantai makanan', title: 'Diagram Rantai Makanan' },
  garuda_bintang: { query: 'Pancasila Sila 1 Star', title: 'Lambang Sila Ke-1 Pancasila (Bintang)' },
  garuda_rantai: { query: 'Pancasila Sila 2 Chain', title: 'Lambang Sila Ke-2 Pancasila (Rantai)' },
  garuda_beringin: { query: 'Pancasila Sila 3 Banyan', title: 'Lambang Sila Ke-3 Pancasila (Pohon Beringin)' },
  garuda_banteng: { query: 'Pancasila Sila 4 Buffalo', title: 'Lambang Sila Ke-4 Pancasila (Kepala Banteng)' },
  garuda_padi_kapas: { query: 'Pancasila Sila 5 Rice Cotton', title: 'Lambang Sila Ke-5 Pancasila (Padi dan Kapas)' },
  traffic_sign: { query: 'Rambu lalu lintas dilarang parkir', title: 'Rambu Lalu Lintas Dilarang Parkir' }
};

interface ContextualVisualRule {
  pattern: RegExp;
  query: string;
  title: string;
}

const CONTEXTUAL_VISUAL_RULES: ContextualVisualRule[] = [
  { pattern: /\bangklung\b/i, query: 'Angklung alat musik Jawa Barat', title: 'Kasenian Angklung' },
  { pattern: /\bsuling\b/i, query: 'Suling Sunda bambu', title: 'Alat Musik Suling' },
  { pattern: /\bwayang\s+golek\b/i, query: 'Wayang Golek Sunda', title: 'Wayang Golek' },
  { pattern: /\bjaipong\b/i, query: 'Tari Jaipong', title: 'Tari Jaipongan' },
  { pattern: /\bsitu\s+bagendit\b/i, query: 'Situ Bagendit Garut', title: 'Situ Bagendit' },
  { pattern: /\bcongklak\b/i, query: 'Congklak permainan', title: 'Kaulinan Congklak' },
  { pattern: /\begrang|jajangkungan\b/i, query: 'Egrang tradisional', title: 'Kaulinan Jajangkungan / Egrang' },
  { pattern: /\bsurabi|serabi\b/i, query: 'Serabi makanan', title: 'Kadaharan Khas Surabi' },
  { pattern: /\baksara\s+sunda|kaganga\b/i, query: 'Aksara Sunda Kaganga', title: 'Aksara Sunda Kaganga' },
  { pattern: /\bjulang\s+ngapak\b/i, query: 'Rumah adat Julang Ngapak', title: 'Imah Adat Julang Ngapak' },
  { pattern: /\bfotosintesis\b/i, query: 'Fotosintesis tumbuhan', title: 'Proses Fotosintesis' },
  { pattern: /\bmetamorfosis\b/i, query: 'Metamorfosis kupu-kupu', title: 'Metamorfosis' },
  { pattern: /\bsiklus\s+air|daur\s+air\b/i, query: 'Siklus air watercycle', title: 'Siklus Air' },
  { pattern: /\brantai\s+makanan\b/i, query: 'Simple food chain diagram rantai makanan', title: 'Rantai Makanan' },
  { pattern: /\bpencak\s+silat\b/i, query: 'Pencak silat', title: 'Olahraga Pencak Silat' },
  { pattern: /\bbola\s+voli\b/i, query: 'Bola voli volleyball', title: 'Permainan Bola Voli' },
  { pattern: /\bgaruda\s+pancasila\b/i, query: 'Garuda Pancasila lambang negara', title: 'Garuda Pancasila' },
  { pattern: /\bka'?bah|masjidil\s+haram\b/i, query: 'Kabah Mekkah', title: "Ka'bah Masjidil Haram" },
  { pattern: /\bbatik\b/i, query: 'Batik motif Indonesia', title: 'Seni Batik Nusantara' },
  { pattern: /\bcandi\s+borobudur\b/i, query: 'Candi Borobudur', title: 'Candi Borobudur' }
];

export async function searchInternetImage(query: string): Promise<WebImageHit | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (searchCache.has(key)) {
    return searchCache.get(key) || null;
  }

  try {
    if (typeof fetch !== 'function') return null;
    const res = await fetch(`/api/media/search?q=${encodeURIComponent(query)}&limit=3`);
    if (!res.ok) {
      searchCache.set(key, null);
      return null;
    }
    const data = await res.json();
    const first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
    if (first && first.thumbUrl) {
      const hit: WebImageHit = {
        url: first.url || first.thumbUrl,
        thumbUrl: first.thumbUrl,
        title: first.title || query,
        source: first.source || 'internet'
      };
      searchCache.set(key, hit);
      return hit;
    }
    searchCache.set(key, null);
    return null;
  } catch {
    return null;
  }
}

function isPureMathMeasurementQuestion(question: string, stimulus?: string): boolean {
  const txt = `${stimulus || ''} ${question || ''}`.toLowerCase();
  return /\b(\d+\s*(cm|m|km|kg|gram|liter|jam|menit|derajat|°)|pecahan\s+\d+\/\d+|berukuran\s+\d+|keliling|luas\s+persegi|volume\s+kubus)\b/.test(txt);
}

export function deriveVisualSearchSpec(
  question: string,
  stimulus: string | undefined,
  subject: string,
  visualType?: VisualType | string,
  visualTitle?: string,
  explicitQuery?: string
): { query: string; title: string } | null {
  const normType = String(visualType || 'none').trim().toLowerCase() as VisualType;

  // Preserve exact labeled/measured bank diagrams instead of swapping them to mismatched web photos
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

  if (normType && normType !== 'none' && VISUAL_TYPE_SEARCH_QUERIES[normType]) {
    const mapped = VISUAL_TYPE_SEARCH_QUERIES[normType]!;
    return {
      query: mapped.query,
      title: visualTitle?.trim() || mapped.title
    };
  }

  // Only perform contextual web image search when AI explicitly requested visualQuery
  // OR when the question text itself explicitly asks students to observe an image/illustration
  const combinedText = `${stimulus || ''} ${question || ''}`;
  const explicitlyAsksForImage = /\b(perhatikan\s+gambar|amati\s+gambar|titénan\s+gambar|titenan\s+gambar|gambar\s+di\s+handap|gambar\s+berikut|ilustrasi\s+berikut)\b/i.test(
    combinedText
  );

  if (explicitQuery && explicitQuery.trim()) {
    // Reject hallucinated image queries attached to pure numeric calculation problems
    if (isPureMathMeasurementQuestion(question, stimulus) && !explicitlyAsksForImage) {
      return null;
    }
    return {
      query: explicitQuery.trim(),
      title: visualTitle?.trim() || explicitQuery.trim()
    };
  }

  if (explicitlyAsksForImage) {
    const fullContext = `${combinedText} ${subject || ''}`;
    for (const rule of CONTEXTUAL_VISUAL_RULES) {
      if (rule.pattern.test(fullContext)) {
        return { query: rule.query, title: visualTitle?.trim() || rule.title };
      }
    }
  }

  return null;
}

/**
 * Enriches questions that explicitly need visual observation with verified internet images
 * fetched sequentially via /api/media/search (preventing Wikimedia API bursts & off-topic mismatches).
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

  const MAX_WEB_IMAGES = 5;
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
    items: T[]
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
        q.visualQuery
      );

      if (!spec) {
        out.push(q);
        continue;
      }

      const hit = await searchInternetImage(spec.query);
      if (hit && hit.thumbUrl) {
        fetchedWebCount++;
        out.push({
          ...q,
          visualQuery: spec.query,
          visualTitle: q.visualTitle?.trim() || spec.title,
          visualImageUrl: hit.thumbUrl,
          visualSvg: undefined
        });
      } else {
        // If AI wrote "Perhatikan gambar" with a query that found NO verified relevant match,
        // keep clean without attaching an unrelated image.
        out.push({
          ...q,
          visualQuery: undefined,
          visualImageUrl: undefined
        });
      }
    }
    return out;
  };

  const pgResolved = await resolveSequential(pgQuestions);
  const isianResolved = await resolveSequential(isianQuestions);
  const uraianResolved = await resolveSequential(uraianQuestions);

  return {
    pgQuestions: pgResolved,
    isianQuestions: isianResolved,
    uraianQuestions: uraianResolved
  };
}
