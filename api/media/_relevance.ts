export interface MediaSearchCandidate {
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
  score?: number;
}

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
  /coat_of_arms/i,
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
  'lambang', 'simbol', 'ikon', 'gerakan', 'teknik', 'cara', 'proses', 'bagian',
  'contoh', 'jenis', 'macam', 'bentuk', 'suasana', 'kegiatan', 'tempat', 'olahraga',
  'peristiwa', 'kesenian', 'kasenian', 'kadaharan', 'kaulinan', 'pupuh', 'aksara',
  'sila', 'pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'kesatu', 'kepala', 'pohon', 'daur', 'hidup',
  'the', 'of', 'in', 'on', 'at', 'for', 'and', 'with', 'showing', 'simple', 'motif'
]);

const TOKEN_SYNONYMS: Record<string, string[]> = {
  bintang: ['star'],
  star: ['bintang'],
  rantai: ['chain'],
  chain: ['rantai'],
  beringin: ['banyan'],
  banyan: ['beringin'],
  banteng: ['buffalo', 'bull'],
  buffalo: ['banteng'],
  padi: ['rice', 'oryza', 'paddy'],
  rice: ['padi'],
  kapas: ['cotton'],
  cotton: ['kapas'],
  parkir: ['parking'],
  parking: ['parkir'],
  dilarang: ['no', 'prohibited'],
  rambu: ['sign', 'traffic', 'road'],
  siklus: ['cycle', 'watercycle'],
  hidrologi: ['hydrologic', 'watercycle'],
  air: ['water', 'watercycle'],
  makanan: ['food'],
  food: ['makanan'],
  tumbuhan: ['plant', 'botany', 'flora'],
  tanaman: ['plant', 'crop'],
  anatomi: ['anatomy'],
  akar: ['root', 'roots'],
  batang: ['stem'],
  daun: ['leaf', 'leaves'],
  bunga: ['flower'],
  kupu: ['butterfly'],
  bunglon: ['chameleon', 'calotes'],
  katak: ['frog'],
  fotosintesis: ['photosynthesis'],
  metamorfosis: ['metamorphosis'],
  gerhana: ['eclipse'],
  eclipse: ['gerhana'],
  gunung: ['volcano', 'mountain'],
  berapi: ['volcano'],
  listrik: ['circuit', 'electric', 'electricity'],
  rangkaian: ['circuit'],
  magnet: ['magnet', 'magnetic'],
  sepak: ['football', 'soccer'],
  bola: ['ball', 'football', 'volleyball', 'basketball'],
  voli: ['volleyball'],
  volleyball: ['voli'],
  basket: ['basketball'],
  basketball: ['basket'],
  renang: ['swimming'],
  lompat: ['jump', 'jumping'],
  jauh: ['long'],
  lari: ['run', 'running', 'sprint'],
  bulu: ['badminton'],
  tangkis: ['badminton'],
  badminton: ['bulutangkis', 'tangkis'],
  silat: ['silat', 'pencak'],
  senam: ['gymnastics'],
  jam: ['clock', 'watch'],
  dinding: ['wall', 'clock'],
  kabah: ['kaaba', 'kaba', 'kabah', 'mecca'],
  kaabah: ['kaaba', 'kaba', 'kabah', 'mecca'],
  mekkah: ['mecca', 'makkah'],
  makkah: ['mecca', 'mekkah'],
  wudu: ['wudu', 'wudhu', 'ablution'],
  wudhu: ['wudu', 'wudhu', 'ablution'],
  masjid: ['mosque', 'masjid'],
  salat: ['prayer', 'salat', 'shalat'],
  wayang: ['wayang', 'puppet'],
  anyaman: ['weaving', 'woven', 'bamboo'],
  gerabah: ['pottery', 'earthenware'],
  topeng: ['mask', 'topeng'],
  kubus: ['cube', 'hexahedron'],
  balok: ['cuboid', 'rectangular'],
  segitiga: ['triangle'],
  lingkaran: ['circle'],
  tari: ['dance', 'tari'],
  umah: ['house', 'rumah'],
  imah: ['house', 'rumah'],
  rumah: ['house', 'rumah'],
  serabi: ['serabi', 'surabi', 'srabi'],
  surabi: ['serabi', 'surabi', 'srabi'],
  komodo: ['komodo', 'varanus'],
  orangutan: ['orangutan', 'pongo'],
  cendrawasih: ['bird-of-paradise', 'paradise'],
  bakau: ['mangrove', 'rhizophora'],
  kaktus: ['cactus'],
  teratai: ['lotus', 'nelumbo', 'water_lily'],
  monas: ['national_monument', 'monas'],
  borobudur: ['borobudur'],
  prambanan: ['prambanan'],
  rapat: ['meeting', 'conference', 'briefing', 'discussion'],
  meeting: ['rapat', 'musyawarah', 'pertemuan'],
  guru: ['teacher', 'teachers', 'educator'],
  teacher: ['guru', 'pengajar'],
  teachers: ['guru'],
  sekolah: ['school', 'elementary', 'classroom', 'sd'],
  school: ['sekolah', 'sd'],
  siswa: ['student', 'students', 'pupil', 'pupils', 'children'],
  murid: ['student', 'students', 'pupil', 'children'],
  student: ['siswa', 'murid', 'pelajar'],
  students: ['siswa', 'murid'],
  kelas: ['classroom', 'class'],
  classroom: ['kelas'],
  perpustakaan: ['library'],
  library: ['perpustakaan'],
  belajar: ['learning', 'study', 'studying'],
  diskusi: ['discussion', 'meeting'],
  musyawarah: ['discussion', 'meeting', 'deliberation'],
  upacara: ['ceremony', 'assembly'],
  bendera: ['flag'],
  kebersihan: ['cleaning', 'hygiene', 'clean'],
  gotong: ['cooperation', 'community', 'cleanup'],
  royong: ['cooperation', 'cleanup'],
  kerja: ['work'],
  bakti: ['cleanup', 'community'],
  keluarga: ['family'],
  desa: ['village', 'rural'],
  lembur: ['village'],
  sawah: ['paddy', 'rice', 'terrace'],
  petani: ['farmer', 'farming'],
  pasar: ['market', 'bazaar'],
  pantai: ['beach', 'coast', 'shore'],
  hutan: ['forest', 'woods'],
  sungai: ['river'],
  banjir: ['flood', 'flooding'],
  sampah: ['trash', 'waste', 'garbage'],
  cuci: ['washing', 'wash'],
  tangan: ['hand', 'hands'],
  sabun: ['soap'],
  kantin: ['canteen', 'cafeteria'],
  olahraga: ['sport', 'sports', 'exercise'],
  buku: ['book', 'books'],
  membaca: ['reading', 'read'],
  menulis: ['writing'],
  sepeda: ['bicycle', 'bike'],
  kantor: ['office'],
  kepala: ['principal', 'headmaster', 'head'],
  ruang: ['room'],
  kebun: ['garden'],
  kucing: ['cat'],
  burung: ['bird'],
  ikan: ['fish'],
  sapi: ['cow', 'cattle'],
  ayam: ['chicken', 'rooster'],
  gajah: ['elephant'],
  harimau: ['tiger'],
  jerapah: ['giraffe'],
  matahari: ['sun', 'solar'],
  bulan: ['moon', 'lunar'],
  hujan: ['rain', 'rainy'],
  pelangi: ['rainbow'],
  peta: ['map'],
  mikroskop: ['microscope'],
  batik: ['batik'],
  angklung: ['angklung'],
  gamelan: ['gamelan']
};

const ID_TO_EN_TRANSLATION: Record<string, string> = {
  rapat: 'meeting',
  pertemuan: 'meeting',
  musyawarah: 'discussion',
  diskusi: 'discussion',
  guru: 'teachers',
  pengajar: 'teacher',
  sekolah: 'school',
  sd: 'elementary school',
  dasar: 'elementary',
  siswa: 'students',
  murid: 'students',
  anak: 'children',
  kelas: 'classroom',
  ruang: 'room',
  perpustakaan: 'library',
  belajar: 'studying',
  membaca: 'reading',
  menulis: 'writing',
  upacara: 'flag ceremony',
  bendera: 'flag',
  kebersihan: 'cleaning',
  gotong: 'community',
  royong: 'cooperation',
  kerja: 'work',
  bakti: 'cleanup',
  lingkungan: 'environment',
  keluarga: 'family',
  desa: 'village',
  sawah: 'rice paddy',
  petani: 'farmer',
  pasar: 'traditional market',
  pantai: 'beach',
  hutan: 'forest',
  sungai: 'river',
  gunung: 'mountain',
  banjir: 'flood',
  sampah: 'waste trash',
  cuci: 'washing',
  tangan: 'hands',
  sabun: 'soap',
  olahraga: 'sports',
  buku: 'books',
  sepeda: 'bicycle',
  kantor: 'office',
  kebun: 'garden',
  kucing: 'cat',
  burung: 'bird',
  ikan: 'fish',
  sapi: 'cow',
  ayam: 'chicken',
  gajah: 'elephant',
  harimau: 'tiger',
  jerapah: 'giraffe',
  matahari: 'sun',
  bulan: 'moon',
  hujan: 'rain',
  pelangi: 'rainbow',
  tumbuhan: 'plant',
  tanaman: 'plant',
  bunga: 'flower',
  pohon: 'tree',
  makanan: 'food',
  buah: 'fruit',
  sayur: 'vegetable',
  masjid: 'mosque',
  wudu: 'ablution',
  peta: 'map',
  mikroskop: 'microscope'
};

export function buildTranslatedEnglishQuery(rawQuery: string): string {
  const tokens = extractMediaCoreTokens(rawQuery);
  if (tokens.length === 0) return '';
  let changed = false;
  const translated = tokens.map((tok) => {
    const mapped = ID_TO_EN_TRANSLATION[tok];
    if (mapped) {
      changed = true;
      return mapped;
    }
    return tok;
  });
  return changed ? Array.from(new Set(translated.join(' ').split(/\s+/))).slice(0, 5).join(' ') : '';
}

export function isAcceptableMediaUrl(url: string, title = ''): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  const pathOnly = url.split('?')[0].toLowerCase();
  if (pathOnly.endsWith('.svg')) return false;
  const combined = `${url} ${title}`;
  return !BLOCKED_FILENAME_PATTERNS.some((re) => re.test(combined));
}

export function extractMediaCoreTokens(query: string): string[] {
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

export function scoreMediaCandidate(
  candidate: MediaSearchCandidate,
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

  let matchedCount = 0;
  for (const tok of coreTokens) {
    if (doesTokenMatch(tok)) matchedCount++;
  }

  const primaryMatched = doesTokenMatch(coreTokens[0]);
  const requiredMatches =
    coreTokens.length === 1
      ? 1
      : coreTokens.length === 2
      ? 2
      : Math.min(2, coreTokens.length);

  if (matchedCount < requiredMatches) {
    return -20;
  }

  // Must match at least one of the top-2 core nouns so tangential matches don't sneak through
  const topAnchorMatched = primaryMatched || (coreTokens[1] ? doesTokenMatch(coreTokens[1]) : false);
  if (!topAnchorMatched) {
    return -40;
  }

  let score = matchedCount * 22 + (primaryMatched ? 12 : 0);
  const titleLower = candidate.title.toLowerCase().replace(/['’`]/g, '');
  const normQuery = rawQuery.toLowerCase().replace(/['’`]/g, '').trim();
  if (titleLower === normQuery || haystack.includes(normQuery)) {
    score += 35;
  } else if (titleLower.includes(coreTokens[0])) {
    score += 15;
  }

  if (candidate.source === 'commons.wikimedia.org') {
    score += 8;
  }

  if (/\b(poster|logo|kota|kabupaten|provinsi|daftar)\b/i.test(titleLower) && !/\b(poster|logo)\b/i.test(normQuery)) {
    score -= 12;
  }

  if (
    /\b(sign[- ]?in sheet|attendance sheet|daftar hadir|formulir|surat)\b/i.test(titleLower) &&
    !/\b(formulir|surat|daftar|sheet)\b/i.test(normQuery)
  ) {
    score -= 22;
  }

  return score;
}

export function parseCommonsPages(data: any): MediaSearchCandidate[] {
  const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];
  const results: MediaSearchCandidate[] = [];
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
    if (!thumbUrl || !isAcceptableMediaUrl(thumbUrl, title)) continue;
    const safeUrl = isAcceptableMediaUrl(fullUrl, title) ? fullUrl : thumbUrl;
    const w = Number(info.thumbwidth || info.width || 0);
    const h = Number(info.thumbheight || info.height || 0);
    if (w > 0 && w < 120) continue;
    if (w > 0 && h > 0 && (w / h > 3.5 || h / w > 3.5)) continue;
    results.push({
      url: safeUrl,
      thumbUrl,
      title,
      source: 'commons.wikimedia.org',
      width: w || undefined,
      height: h || undefined
    });
  }
  return results;
}

export function parseWikipediaPages(data: any, sourceHost: string): MediaSearchCandidate[] {
  const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];
  const results: MediaSearchCandidate[] = [];
  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));

  for (const page of pages) {
    const thumb = page?.thumbnail;
    const orig = page?.original;
    const chosenUrl = thumb?.source || orig?.source;
    if (!chosenUrl || !isAcceptableMediaUrl(chosenUrl, page?.title)) continue;
    const w = Number(thumb?.width || orig?.width || 0);
    const h = Number(thumb?.height || orig?.height || 0);
    if (w > 0 && w < 100) continue;
    if (w > 0 && h > 0 && (w / h > 3.5 || h / w > 3.5)) continue;
    results.push({
      url: orig?.source || chosenUrl,
      thumbUrl: chosenUrl,
      title: String(page?.title || ''),
      source: sourceHost,
      width: w || undefined,
      height: h || undefined
    });
  }
  return results;
}

export function rankAndFilterMediaCandidates(
  candidates: MediaSearchCandidate[],
  cleanQuery: string,
  limit = 4
): MediaSearchCandidate[] {
  const coreTokens = extractMediaCoreTokens(cleanQuery);
  const scored = candidates
    .map((item) => ({
      ...item,
      score: scoreMediaCandidate(item, coreTokens, cleanQuery)
    }))
    .filter((item) => (item.score ?? -1) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const merged: MediaSearchCandidate[] = [];
  const seen = new Set<string>();
  for (const item of scored) {
    const key = item.thumbUrl.split('?')[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}
