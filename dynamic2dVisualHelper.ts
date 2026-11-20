export interface DynamicVisualInput {
  question: string;
  stimulus?: string;
  options?: { key: string; text: string }[];
  visualType?: string;
  visualTitle?: string;
  correctAnswer?: string;
}

export interface Dynamic2dResult {
  svg: string;
  visualType: string;
  title: string;
  signature: string;
}

const esc = (s: string): string =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clipText = (s: string, maxLen: number): string => {
  const clean = String(s || '').replace(/\s+/g, ' ').trim();
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
};

const shortHash = (s: string): string => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 5);
};

export function isSpoilerIdentificationQuestion(question: string): boolean {
  return /\b(naon\s+ngaran|ngaran\s+alat|sebutkeun\s+ngaran|apa\s+nama|nama\s+bangun|menunjukkan\s+pukul|adalah\s+pukul|jenis\s+sudut|termasuk\s+sudut|disebut(?:\s+dengan|\s+juga)?|dinamakan|istilah\s+(?:untuk|yang)|tersebut\s+merupakan\s+lambang|termasuk\s+(?:simbol|gerak|majas|tanda\s+baca|alat\s+musik|bangun|sudut)|lambang\s+sila|arti(?:nya)?\s+(?:dari\s+)?asmaulhusna|which\s+animal|what\s+is\s+this|katelah)\b/i.test(
    question || ''
  );
}

const extractTopicLabel = (text: string, fallback: string, maxLen = 22): string => {
  const clean = String(text || '')
    .replace(/["“”]/g, ' ')
    .replace(/\b(perhatikan|amati|titénan|titenan|gambar|berikut|di\s+bawah\s+ini|di\s+atas|berdasarkan|apa|apakah|bagaimana|mengapa|yang|terdapat|pada|dalam|tentang|sebuah|suatu|untuk|dari|dengan|adalah|yaitu|sebutkan|tuliskan|jelaskan|manakah)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return fallback;
  const words = clean.split(' ').filter((w) => w.length >= 3).slice(0, 3);
  if (words.length === 0) return fallback;
  return clipText(words.join(' ').toUpperCase(), maxLen);
};

const getCorrectOptionText = (q: DynamicVisualInput): string => {
  const ans = String(q.correctAnswer || '').trim().toUpperCase();
  if (!ans || !Array.isArray(q.options)) return ans;
  const found = q.options.find((o) => String(o.key || '').trim().toUpperCase() === ans);
  return found ? String(found.text || '').trim() : ans;
};

// ---------------------------------------------------------------------------
// 1. PARAMETERIZED 2D MATH DIAGRAMS (Reads exact numbers from question text!)
// ---------------------------------------------------------------------------

function buildClockSvg(hourRaw: number, minuteRaw: number, avoidSpoiler = false): { svg: string; sig: string; label: string } {
  const h = ((hourRaw % 12) + 12) % 12;
  const m = Math.max(0, Math.min(59, minuteRaw));
  const minAngleDeg = m * 6;
  const hourAngleDeg = (h + m / 60) * 30;
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const mx = (80 + 44 * Math.cos(toRad(minAngleDeg))).toFixed(1);
  const my = (80 + 44 * Math.sin(toRad(minAngleDeg))).toFixed(1);
  const hx = (80 + 30 * Math.cos(toRad(hourAngleDeg))).toFixed(1);
  const hy = (80 + 30 * Math.sin(toRad(hourAngleDeg))).toFixed(1);

  const hhStr = String(hourRaw === 0 ? 12 : hourRaw).padStart(2, '0');
  const mmStr = String(m).padStart(2, '0');

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const rad = toRad(i * 30);
    const x1 = (80 + 58 * Math.cos(rad)).toFixed(1);
    const y1 = (80 + 58 * Math.sin(rad)).toFixed(1);
    const x2 = (80 + 64 * Math.cos(rad)).toFixed(1);
    const y2 = (80 + 64 * Math.sin(rad)).toFixed(1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#475569" stroke-width="${i % 3 === 0 ? 2.5 : 1.3}"/>`;
  }).join('');

  const bottomText = avoidSpoiler ? 'Amati Posisi Jarum Jam' : `Pukul ${hhStr}.${mmStr}`;

  const svg = `
  <svg viewBox="0 0 160 164" width="136" height="140" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <circle cx="80" cy="80" r="70" fill="#f8fafc" stroke="#1e293b" stroke-width="3.5"/>
    <circle cx="80" cy="80" r="64" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    ${ticks}
    <text x="80" y="29" font-size="11" font-weight="bold" text-anchor="middle" fill="#0f172a">12</text>
    <text x="131" y="84" font-size="11" font-weight="bold" text-anchor="middle" fill="#0f172a">3</text>
    <text x="80" y="139" font-size="11" font-weight="bold" text-anchor="middle" fill="#0f172a">6</text>
    <text x="29" y="84" font-size="11" font-weight="bold" text-anchor="middle" fill="#0f172a">9</text>
    <line x1="80" y1="80" x2="${mx}" y2="${my}" stroke="#0f172a" stroke-width="3.2" stroke-linecap="round"/>
    <line x1="80" y1="80" x2="${hx}" y2="${hy}" stroke="#2563eb" stroke-width="4.8" stroke-linecap="round"/>
    <circle cx="80" cy="80" r="4.5" fill="#ef4444"/>
    <text x="80" y="160" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">${esc(bottomText)}</text>
  </svg>`;

  return { svg, sig: `clock_${hhStr}_${mmStr}`, label: 'Gambar Jam Analog' };
}

function buildFractionCircleSvg(num: number, den: number, avoidSpoiler = false): { svg: string; sig: string; label: string } {
  const safeDen = Math.max(2, Math.min(12, den));
  const safeNum = Math.max(1, Math.min(safeDen - 1, num));
  const r = 64;
  const cx = 80;
  const cy = 78;

  const slices: string[] = [];
  for (let i = 0; i < safeDen; i++) {
    const startDeg = (i * 360) / safeDen - 90;
    const endDeg = ((i + 1) * 360) / safeDen - 90;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = (cx + r * Math.cos(startRad)).toFixed(2);
    const y1 = (cy + r * Math.sin(startRad)).toFixed(2);
    const x2 = (cx + r * Math.cos(endRad)).toFixed(2);
    const y2 = (cy + r * Math.sin(endRad)).toFixed(2);
    const largeArc = 360 / safeDen > 180 ? 1 : 0;
    const fill = i < safeNum ? (i % 2 === 0 ? '#3b82f6' : '#60a5fa') : '#ffffff';
    slices.push(
      `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z" fill="${fill}" stroke="#0f172a" stroke-width="1.8"/>`
    );
  }

  const caption = avoidSpoiler ? 'Amati bagian lingkaran yang diarsir' : `${safeNum} bagian diarsir dari ${safeDen} bagian`;

  const svg = `
  <svg viewBox="0 0 160 162" width="136" height="138" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#0f172a" stroke-width="2.2"/>
    ${slices.join('')}
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0f172a"/>
    <text x="80" y="156" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e293b">${esc(caption)}</text>
  </svg>`;

  return { svg, sig: `frac_circle_${safeNum}_${safeDen}`, label: 'Diagram Pecahan Lingkaran' };
}

function buildFractionBarSvg(num: number, den: number, avoidSpoiler = false): { svg: string; sig: string; label: string } {
  const safeDen = Math.max(2, Math.min(12, den));
  const safeNum = Math.max(1, Math.min(safeDen - 1, num));
  const totalW = 180;
  const cellW = totalW / safeDen;
  const cells = Array.from({ length: safeDen }, (_, i) => {
    const x = (10 + i * cellW).toFixed(2);
    const fill = i < safeNum ? '#3b82f6' : '#ffffff';
    return `<rect x="${x}" y="15" width="${cellW.toFixed(2)}" height="48" fill="${fill}" stroke="#0f172a" stroke-width="1.5"/>`;
  }).join('');

  const caption = avoidSpoiler ? 'Amati bagian pita yang diarsir' : `${safeNum} petak diarsir dari ${safeDen} petak sama besar`;

  const svg = `
  <svg viewBox="0 0 200 88" width="175" height="77" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    ${cells}
    <text x="100" y="79" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e293b">${esc(caption)}</text>
  </svg>`;

  return { svg, sig: `frac_bar_${safeNum}_${safeDen}`, label: 'Diagram Pita Pecahan' };
}

function buildRectangleSvg(
  pLabel: string | null,
  lLabel: string | null,
  unit = 'cm',
  isSquare = false,
  avoidSpoiler = false
): { svg: string; sig: string; label: string } {
  const w = isSquare ? 88 : 132;
  const h = isSquare ? 88 : 66;
  const x = isSquare ? 56 : 30;
  const y = 24;

  const topDim = pLabel ? `${isSquare ? 'Sisi' : 'Panjang'} = ${esc(pLabel)} ${esc(unit)}` : '';
  const sideDim = !isSquare && lLabel ? `Lebar = ${esc(lLabel)} ${esc(unit)}` : '';
  const bottomName = avoidSpoiler ? 'Bangun Datar Segi Empat' : (isSquare ? 'Bangun Datar Persegi' : 'Bangun Datar Persegi Panjang');

  const svg = `
  <svg viewBox="0 0 210 128" width="175" height="107" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" rx="2"/>
    <rect x="${x}" y="${y}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    <rect x="${x + w - 8}" y="${y}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    <rect x="${x}" y="${y + h - 8}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    <rect x="${x + w - 8}" y="${y + h - 8}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    ${topDim ? `<text x="${x + w / 2}" y="17" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#0369a1">${topDim}</text>` : ''}
    ${sideDim ? `<text x="${x + w + 16}" y="${y + h / 2}" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#0369a1" transform="rotate(90, ${x + w + 16}, ${y + h / 2})">${sideDim}</text>` : ''}
    <text x="${x + w / 2}" y="${y + h + 16}" font-size="9.5" font-style="italic" text-anchor="middle" fill="#475569">${esc(bottomName)}</text>
  </svg>`;

  return {
    svg,
    sig: isSquare ? `square_${pLabel || 'raw'}_${unit}` : `rect_${pLabel || 'raw'}_${lLabel || 'raw'}_${unit}`,
    label: avoidSpoiler ? 'Gambar Bangun Datar' : (isSquare ? 'Gambar Bangun Persegi' : 'Gambar Persegi Panjang')
  };
}

function buildTriangleSvg(
  alasLabel: string | null,
  tinggiLabel: string | null,
  miringLabel?: string,
  unit = 'cm',
  avoidSpoiler = false
): { svg: string; sig: string; label: string } {
  const svg = `
  <svg viewBox="0 0 190 142" width="160" height="120" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <polygon points="36,110 152,110 36,24" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
    <rect x="36" y="100" width="10" height="10" fill="none" stroke="#d97706" stroke-width="1.5"/>
    ${alasLabel ? `<text x="94" y="128" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#b45309">Alas = ${esc(alasLabel)} ${esc(unit)}</text>` : ''}
    ${tinggiLabel ? `<text x="20" y="70" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#b45309" transform="rotate(-90, 20, 70)">Tinggi = ${esc(tinggiLabel)} ${esc(unit)}</text>` : ''}
    ${miringLabel ? `<text x="108" y="56" font-size="9.5" font-weight="bold" fill="#78350f">Sisi miring = ${esc(miringLabel)} ${esc(unit)}</text>` : ''}
    ${avoidSpoiler ? `<text x="95" y="132" font-size="9.5" font-style="italic" text-anchor="middle" fill="#475569">Amati Bangun Datar</text>` : ''}
  </svg>`;
  return {
    svg,
    sig: `tri_${alasLabel || 'raw'}_${tinggiLabel || 'raw'}_${miringLabel || 'x'}`,
    label: avoidSpoiler ? 'Gambar Bangun Datar' : 'Gambar Segitiga'
  };
}

function buildCubeOrCuboidSvg(
  isCuboid: boolean,
  p: string | null,
  l?: string | null,
  t?: string | null,
  unit = 'cm',
  avoidSpoiler = false
): { svg: string; sig: string; label: string } {
  if (!isCuboid) {
    const svg = `
    <svg viewBox="0 0 170 144" width="145" height="122" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="32" y="50" width="68" height="68" fill="#e0e7ff" stroke="#4338ca" stroke-width="2.3"/>
      <polygon points="32,50 66,22 134,22 100,50" fill="#c7d2fe" stroke="#4338ca" stroke-width="2.3"/>
      <polygon points="100,50 134,22 134,90 100,118" fill="#a5b4fc" stroke="#4338ca" stroke-width="2.3"/>
      ${p ? `<text x="66" y="88" font-size="11" font-weight="bold" text-anchor="middle" fill="#312e81">s = ${esc(p)} ${esc(unit)}</text>` : ''}
      <text x="84" y="136" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Amati Bangun Ruang' : 'Bangun Ruang Kubus'}</text>
    </svg>`;
    return { svg, sig: `cube_${p || 'raw'}_${unit}`, label: avoidSpoiler ? 'Gambar Bangun Ruang' : 'Bangun Ruang Kubus' };
  }

  const svg = `
  <svg viewBox="0 0 190 144" width="160" height="122" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="24" y="56" width="96" height="54" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2.3"/>
    <polygon points="24,56 58,28 154,28 120,56" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.3"/>
    <polygon points="120,56 154,28 154,82 120,110" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2.3"/>
    ${p ? `<text x="72" y="124" font-size="10" font-weight="bold" text-anchor="middle" fill="#1e3a8a">p = ${esc(p)} ${esc(unit)}</text>` : ''}
    ${l ? `<text x="148" y="102" font-size="9.5" font-weight="bold" fill="#1e3a8a">l = ${esc(l)} ${esc(unit)}</text>` : ''}
    ${t ? `<text x="166" y="58" font-size="9.5" font-weight="bold" fill="#1e3a8a">t = ${esc(t)} ${esc(unit)}</text>` : ''}
    ${avoidSpoiler ? `<text x="95" y="136" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">Amati Bangun Ruang</text>` : ''}
  </svg>`;
  return { svg, sig: `cuboid_${p || 'raw'}_${l || 'x'}_${t || 'x'}`, label: avoidSpoiler ? 'Gambar Bangun Ruang' : 'Bangun Ruang Balok' };
}

function buildCircleRadiusSvg(val: string | null, isDiameter: boolean, unit = 'cm', avoidSpoiler = false): { svg: string; sig: string; label: string } {
  const svg = `
  <svg viewBox="0 0 170 156" width="142" height="130" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <circle cx="85" cy="74" r="56" fill="#f0fdf4" stroke="#15803d" stroke-width="2.5"/>
    <circle cx="85" cy="74" r="3.5" fill="#dc2626"/>
    ${
      isDiameter
        ? `<line x1="29" y1="74" x2="141" y2="74" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4,2"/>
           ${val ? `<text x="85" y="66" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#991b1b">d = ${esc(val)} ${esc(unit)}</text>` : ''}`
        : `<line x1="85" y1="74" x2="141" y2="74" stroke="#dc2626" stroke-width="2.5"/>
           ${val ? `<text x="113" y="66" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#991b1b">r = ${esc(val)} ${esc(unit)}</text>` : ''}`
    }
    <text x="85" y="147" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#166534">${avoidSpoiler ? 'Amati Bangun Datar' : 'Bangun Datar Lingkaran'}</text>
  </svg>`;
  return { svg, sig: `circle_${isDiameter ? 'd' : 'r'}_${val || 'raw'}`, label: avoidSpoiler ? 'Gambar Bangun Datar' : 'Bangun Datar Lingkaran' };
}

function buildAngleSvg(deg: number, showDegreeText: boolean, avoidSpoiler = false): { svg: string; sig: string; label: string } {
  const safeDeg = Math.max(15, Math.min(170, deg));
  const rad = (safeDeg * Math.PI) / 180;
  const len = 82;
  const ox = 45;
  const oy = 110;
  const x2 = (ox + len * Math.cos(rad)).toFixed(1);
  const y2 = (oy - len * Math.sin(rad)).toFixed(1);
  const arcR = 26;
  const ax = (ox + arcR * Math.cos(rad)).toFixed(1);
  const ay = (oy - arcR * Math.sin(rad)).toFixed(1);

  const labelDeg = showDegreeText ? `${safeDeg}°` : '?';
  const bottomCaption = avoidSpoiler ? 'Amati Besar Sudut' : `Ilustrasi Sudut ${showDegreeText ? `${safeDeg}°` : ''}`.trim();

  const svg = `
  <svg viewBox="0 0 180 135" width="150" height="112" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <line x1="${ox}" y1="${oy}" x2="${ox + 95}" y2="${oy}" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
    <line x1="${ox}" y1="${oy}" x2="${x2}" y2="${y2}" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
    ${
      safeDeg === 90
        ? `<rect x="${ox}" y="${oy - 14}" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="2"/>`
        : `<path d="M ${ox + arcR} ${oy} A ${arcR} ${arcR} 0 0 0 ${ax} ${ay}" fill="none" stroke="#ef4444" stroke-width="2.2"/>`
    }
    <circle cx="${ox}" cy="${oy}" r="4" fill="#ef4444"/>
    <text x="${ox + 34}" y="${oy - 18}" font-size="10.5" font-weight="bold" fill="#b91c1c">${esc(labelDeg)}</text>
    <text x="90" y="128" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">${esc(bottomCaption)}</text>
  </svg>`;
  return { svg, sig: `angle_${safeDeg}_${showDegreeText ? 'd' : 'q'}`, label: 'Ilustrasi Sudut' };
}

function buildDynamicBarChartSvg(items: { label: string; value: number }[]): { svg: string; sig: string; label: string } {
  const list = items.slice(0, 5);
  const maxVal = Math.max(10, ...list.map((i) => i.value));
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const step = 150 / Math.max(1, list.length);
  const barW = Math.min(26, step * 0.58);

  const bars = list
    .map((item, idx) => {
      const h = Math.max(8, Math.round((item.value / maxVal) * 76));
      const x = Math.round(36 + idx * step + (step - barW) / 2);
      const y = 104 - h;
      const lbl = clipText(item.label, 8);
      return `
      <rect x="${x}" y="${y}" width="${barW.toFixed(0)}" height="${h}" fill="${colors[idx % colors.length]}" rx="2"/>
      <text x="${(x + barW / 2).toFixed(1)}" y="${y - 4}" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#1e293b">${item.value}</text>
      <text x="${(x + barW / 2).toFixed(1)}" y="118" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">${esc(lbl)}</text>`;
    })
    .join('');

  const svg = `
  <svg viewBox="0 0 205 130" width="175" height="111" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <line x1="28" y1="12" x2="28" y2="104" stroke="#334155" stroke-width="2"/>
    <line x1="28" y1="104" x2="192" y2="104" stroke="#334155" stroke-width="2"/>
    <line x1="28" y1="28" x2="192" y2="28" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="28" y1="66" x2="192" y2="66" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2"/>
    <text x="23" y="31" font-size="8.5" text-anchor="end" fill="#64748b">${maxVal}</text>
    <text x="23" y="69" font-size="8.5" text-anchor="end" fill="#64748b">${Math.round(maxVal / 2)}</text>
    <text x="23" y="107" font-size="8.5" text-anchor="end" fill="#64748b">0</text>
    ${bars}
  </svg>`;

  return {
    svg,
    sig: `bar_${list.map((i) => `${i.label}_${i.value}`).join('_')}`,
    label: 'Diagram Batang Data'
  };
}

function buildNumberLineSvg(maxTick = 10, highlightA?: number, highlightB?: number): { svg: string; sig: string; label: string } {
  const start = 0;
  const span = Math.max(5, Math.min(12, maxTick));
  const ticks = Array.from({ length: span + 1 }, (_, i) => {
    const x = 18 + (i * 184) / span;
    const isHi = i === highlightA || i === highlightB;
    return `
      <line x1="${x.toFixed(1)}" y1="44" x2="${x.toFixed(1)}" y2="56" stroke="${isHi ? '#dc2626' : '#334155'}" stroke-width="${isHi ? 2.5 : 1.5}"/>
      ${isHi ? `<circle cx="${x.toFixed(1)}" cy="50" r="4" fill="#dc2626"/>` : ''}
      <text x="${x.toFixed(1)}" y="71" font-size="9.5" font-weight="${isHi ? 'bold' : 'normal'}" text-anchor="middle" fill="${isHi ? '#dc2626' : '#1e293b'}">${start + i}</text>`;
  }).join('');

  const svg = `
  <svg viewBox="0 0 220 84" width="190" height="72" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <line x1="12" y1="50" x2="208" y2="50" stroke="#1e293b" stroke-width="2.2"/>
    <polygon points="8,50 15,46 15,54" fill="#1e293b"/>
    <polygon points="212,50 205,46 205,54" fill="#1e293b"/>
    ${ticks}
    <text x="110" y="22" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">Garis Bilangan</text>
  </svg>`;
  return { svg, sig: `numline_${span}_${highlightA ?? 'x'}_${highlightB ?? 'y'}`, label: 'Garis Bilangan' };
}

function buildBalanceScaleSvg(leftLabel: string, rightLabel: string): { svg: string; sig: string; label: string } {
  const svg = `
  <svg viewBox="0 0 200 124" width="170" height="105" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <polygon points="85,112 115,112 100,72" fill="#64748b"/>
    <rect x="65" y="110" width="70" height="7" rx="3" fill="#334155"/>
    <line x1="36" y1="42" x2="164" y2="42" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="100" cy="42" r="4.5" fill="#dc2626"/>
    <line x1="36" y1="42" x2="24" y2="74" stroke="#64748b" stroke-width="1.5"/>
    <line x1="36" y1="42" x2="48" y2="74" stroke="#64748b" stroke-width="1.5"/>
    <path d="M18,74 Q36,84 54,74 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
    <rect x="20" y="57" width="32" height="17" rx="3" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text x="36" y="69" font-size="8.2" font-weight="bold" text-anchor="middle" fill="#1e3a8a">${esc(clipText(leftLabel, 9))}</text>
    <line x1="164" y1="42" x2="152" y2="74" stroke="#64748b" stroke-width="1.5"/>
    <line x1="164" y1="42" x2="176" y2="74" stroke="#64748b" stroke-width="1.5"/>
    <path d="M146,74 Q164,84 182,74 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
    <rect x="148" y="57" width="32" height="17" rx="3" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text x="164" y="69" font-size="8.2" font-weight="bold" text-anchor="middle" fill="#14532d">${esc(clipText(rightLabel, 9))}</text>
  </svg>`;
  return { svg, sig: `scale_${leftLabel}_${rightLabel}`, label: 'Ilustrasi Perbandingan Massa' };
}

function buildDigitalWeightAdditionSvg(weights: string[], targetUnit: string): { svg: string; sig: string; label: string } {
  const w1 = clipText(weights[0] || '1 kg', 9);
  const w2 = weights[1] ? clipText(weights[1], 9) : '';
  const hasSecond = Boolean(w2);

  const svg = `
  <svg viewBox="0 0 216 122" width="186" height="105" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    ${
      hasSecond
        ? `<rect x="24" y="16" width="66" height="34" rx="5" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
           <text x="57" y="37" font-size="10" font-weight="bold" text-anchor="middle" fill="#1e3a8a">${esc(w1)}</text>
           <text x="108" y="38" font-size="14" font-weight="bold" text-anchor="middle" fill="#475569">+</text>
           <rect x="126" y="16" width="66" height="34" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
           <text x="159" y="37" font-size="10" font-weight="bold" text-anchor="middle" fill="#92400e">${esc(w2)}</text>`
        : `<rect x="68" y="16" width="80" height="34" rx="5" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
           <text x="108" y="37" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a">${esc(w1)}</text>`
    }
    <rect x="18" y="54" width="180" height="8" rx="3" fill="#64748b"/>
    <path d="M38,62 L178,62 L190,104 L26,104 Z" fill="#f1f5f9" stroke="#334155" stroke-width="2.2"/>
    <rect x="64" y="72" width="88" height="22" rx="4" fill="#0f172a"/>
    <text x="108" y="87" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#34d399">? ${esc(targetUnit)}</text>
    <text x="108" y="117" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Timbangan Digital (${hasSecond ? 'Penjumlahan' : 'Konversi'} Massa)</text>
  </svg>`;

  return {
    svg,
    sig: `dscale_${w1}_${w2 || 'conv'}_${targetUnit}`,
    label: 'Ilustrasi Timbangan Digital'
  };
}

function buildPlaceValueBlocksSvg(tensCount: number, onesCount: number): { svg: string; sig: string; label: string } {
  const t = Math.max(1, Math.min(6, tensCount));
  const o = Math.max(1, Math.min(9, onesCount));
  const tensCols = Array.from({ length: t }, (_, i) => {
    const x = 22 + i * 16;
    return `<rect x="${x}" y="22" width="11" height="58" rx="2" fill="#3b82f6" stroke="#1e40af" stroke-width="1.3"/>`;
  }).join('');
  const onesSquares = Array.from({ length: o }, (_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 132 + col * 17;
    const y = 26 + row * 18;
    return `<rect x="${x}" y="${y}" width="13" height="13" rx="2" fill="#10b981" stroke="#065f46" stroke-width="1.3"/>`;
  }).join('');

  const svg = `
  <svg viewBox="0 0 210 106" width="180" height="90" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="12" y="10" width="106" height="82" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
    <rect x="124" y="10" width="74" height="82" rx="6" fill="#ecfdf5" stroke="#6ee7b7" stroke-width="1.5"/>
    ${tensCols}
    ${onesSquares}
    <text x="65" y="101" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e3a8a">${t} Puluhan</text>
    <text x="161" y="101" font-size="9" font-weight="bold" text-anchor="middle" fill="#065f46">${o} Satuan</text>
  </svg>`;
  return { svg, sig: `placeval_${t}_${o}`, label: 'Ilustrasi Blok Nilai Tempat' };
}

function buildNumberPatternSvg(cards: string[]): { svg: string; sig: string; label: string } {
  const items = cards.slice(0, 6);
  const count = Math.max(3, items.length);
  const totalW = 228;
  const boxW = Math.min(34, Math.floor((totalW - 12) / count) - 6);
  const step = Math.floor((totalW - 12) / count);
  const startX = Math.round((totalW - (count * step - (step - boxW))) / 2);

  const boxes = items
    .map((val, idx) => {
      const x = startX + idx * step;
      const isBlank = val === '?';
      return `
      <rect x="${x}" y="20" width="${boxW}" height="34" rx="5" fill="${isBlank ? '#fef3c7' : '#e0f2fe'}" stroke="${isBlank ? '#d97706' : '#0284c7'}" stroke-width="2" ${isBlank ? 'stroke-dasharray="3,2"' : ''}/>
      <text x="${x + boxW / 2}" y="41" font-size="11" font-weight="bold" text-anchor="middle" fill="${isBlank ? '#b45309' : '#0c4a6e'}">${esc(val)}</text>`;
    })
    .join('');

  const svg = `
  <svg viewBox="0 0 228 76" width="196" height="65" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    ${boxes}
    <text x="114" y="69" font-size="9" font-weight="bold" text-anchor="middle" fill="#475569">Kartu Pola Bilangan</text>
  </svg>`;
  return { svg, sig: `seq_${items.join('_')}`, label: 'Ilustrasi Pola Bilangan' };
}

function buildMathStoryBarSvg(combinedText: string): { svg: string; sig: string; label: string } | null {
  const lower = combinedText.toLowerCase();
  // Money story (Rp ...)
  const moneyMatches = Array.from(combinedText.matchAll(/Rp\s?([\d.]+)/gi)).map((m) => `Rp${m[1]}`);
  if (moneyMatches.length >= 1) {
    const m1 = clipText(moneyMatches[0], 11);
    const m2 = moneyMatches[1] ? clipText(moneyMatches[1], 11) : 'Nilai';
    const svg = `
    <svg viewBox="0 0 220 96" width="190" height="83" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="16" y="16" width="84" height="44" rx="5" fill="#dcfce7" stroke="#15803d" stroke-width="2"/>
      <rect x="22" y="22" width="72" height="32" rx="3" fill="none" stroke="#86efac" stroke-width="1.2"/>
      <text x="58" y="42" font-size="10" font-weight="bold" text-anchor="middle" fill="#14532d">${esc(m1)}</text>
      <circle cx="158" cy="38" r="21" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <text x="158" y="42" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#92400e">${esc(m2)}</text>
      <text x="110" y="82" font-size="9" font-weight="bold" text-anchor="middle" fill="#475569">Ilustrasi Nilai Uang Rupiah</text>
    </svg>`;
    return { svg, sig: `math_money_${m1}_${m2}_${shortHash(lower)}`, label: 'Ilustrasi Soal Nilai Uang' };
  }

  // General arithmetic / story numbers bar diagram
  const rawNums = Array.from(combinedText.matchAll(/\b(\d{1,5})\b/g)).map((m) => m[1]);
  const nums = rawNums.slice(0, 3);
  if (nums.length >= 2) {
    const op = /\b(selisih|sisa|kurang|berkurang|dipakai|diberikan|dimakan)\b/.test(lower)
      ? '−'
      : /\b(kali|setiap\s+\w+\s+berisi|masing-masing|baris)\b/.test(lower)
      ? '×'
      : /\b(bagi|dibagikan|rata|sama\s+banyak)\b/.test(lower)
      ? '÷'
      : '+';
    const a = clipText(nums[0], 7);
    const b = clipText(nums[1], 7);
    const svg = `
    <svg viewBox="0 0 220 90" width="190" height="78" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="14" y="18" width="54" height="36" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
      <text x="41" y="40" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e3a8a">${esc(a)}</text>
      <text x="79" y="41" font-size="13" font-weight="bold" text-anchor="middle" fill="#475569">${op}</text>
      <rect x="90" y="18" width="54" height="36" rx="6" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2"/>
      <text x="117" y="40" font-size="11" font-weight="bold" text-anchor="middle" fill="#312e81">${esc(b)}</text>
      <text x="155" y="41" font-size="13" font-weight="bold" text-anchor="middle" fill="#475569">=</text>
      <rect x="166" y="18" width="40" height="36" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="2" stroke-dasharray="3,2"/>
      <text x="186" y="40" font-size="12" font-weight="bold" text-anchor="middle" fill="#b45309">?</text>
      <text x="110" y="75" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Model Pemecahan Bilangan</text>
    </svg>`;
    return { svg, sig: `math_story_${a}_${op}_${b}_${shortHash(lower)}`, label: 'Model Pemecahan Bilangan' };
  }

  return null;
}

// ---------------------------------------------------------------------------
// 2. BAHASA INDONESIA & LINGUISTIC 2D CARDS
// ---------------------------------------------------------------------------

type BahasaSceneKind = 'poster' | 'notice' | 'procedure' | 'letter' | 'dialogue' | 'nature' | 'book' | 'denah' | 'healthy';
type GrammarKind = 'katatanya' | 'punctuation' | 'paragraph' | 'poetry' | 'document';

function buildGrammar2dSvg(kind: GrammarKind, questionText: string, avoidSpoiler = false): { svg: string; sig: string; label: string } {
  const h = shortHash(questionText);
  if (kind === 'katatanya') {
    const cleanSnippet = clipText(
      questionText.replace(/\b(kata\s+tanya\s+yang\s+tepat|untuk\s+melengkapi|kalimat\s+di\s+atas|berikut\s+ini|adalah)\b/gi, '').trim() || 'Kalimat Rumpang',
      24
    );
    const svg = `
    <svg viewBox="0 0 220 100" width="190" height="86" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="12" y="14" width="196" height="66" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
      <rect x="24" y="28" width="42" height="28" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="2" stroke-dasharray="3,2"/>
      <text x="45" y="47" font-size="13" font-weight="bold" text-anchor="middle" fill="#b45309">?</text>
      <line x1="76" y1="36" x2="194" y2="36" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="76" y1="50" x2="168" y2="50" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
      <text x="110" y="92" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Melengkapi Kalimat Rumpang' : esc(cleanSnippet)}</text>
    </svg>`;
    return { svg, sig: `indo_katatanya_${h}`, label: 'Kartu Kalimat Rumpang' };
  }

  if (kind === 'punctuation') {
    const svg = `
    <svg viewBox="0 0 216 106" width="186" height="91" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="14" y="12" width="188" height="72" rx="8" fill="#064e3b" stroke="#92400e" stroke-width="4"/>
      <text x="58" y="54" font-size="22" font-weight="bold" text-anchor="middle" fill="#fef08a">“ ”</text>
      <text x="108" y="54" font-size="22" font-weight="bold" text-anchor="middle" fill="#ffffff">?</text>
      <text x="156" y="54" font-size="22" font-weight="bold" text-anchor="middle" fill="#86efac">!</text>
      <text x="108" y="98" font-size="9" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Kaidah Ejaan &amp; Tanda Baca' : 'Papan Kaidah Bahasa'}</text>
    </svg>`;
    return { svg, sig: `indo_punct_${h}`, label: 'Papan Kaidah Ejaan & Tanda Baca' };
  }

  if (kind === 'paragraph') {
    const svg = `
    <svg viewBox="0 0 216 108" width="186" height="93" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="14" y="12" width="188" height="78" rx="8" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
      <rect x="26" y="24" width="164" height="14" rx="3" fill="#dbeafe" stroke="#2563eb" stroke-width="1.3"/>
      <text x="34" y="34" font-size="7.5" font-weight="bold" fill="#1e3a8a">Kalimat 1</text>
      <rect x="26" y="45" width="164" height="14" rx="3" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.2"/>
      <text x="34" y="55" font-size="7.5" font-weight="bold" fill="#334155">Kalimat 2</text>
      <rect x="26" y="66" width="164" height="14" rx="3" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.2"/>
      <text x="34" y="76" font-size="7.5" font-weight="bold" fill="#334155">Kalimat 3</text>
      <text x="108" y="102" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Struktur Kalimat dalam Paragraf</text>
    </svg>`;
    return { svg, sig: `indo_paragraf_${h}`, label: 'Diagram Struktur Paragraf' };
  }

  if (kind === 'poetry') {
    const svg = `
    <svg viewBox="0 0 210 112" width="180" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="24" y="12" width="162" height="82" rx="6" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
      <line x1="42" y1="12" x2="42" y2="94" stroke="#fca5a5" stroke-width="1.5"/>
      <line x1="54" y1="30" x2="162" y2="30" stroke="#334155" stroke-width="2"/>
      <line x1="54" y1="45" x2="148" y2="45" stroke="#64748b" stroke-width="2"/>
      <line x1="54" y1="60" x2="158" y2="60" stroke="#334155" stroke-width="2"/>
      <line x1="54" y1="75" x2="140" y2="75" stroke="#64748b" stroke-width="2"/>
      <text x="105" y="106" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Amati Kutipan Karya Sastra' : 'Lembar Karya Sastra &amp; Puisi'}</text>
    </svg>`;
    return { svg, sig: `indo_poetry_${h}`, label: 'Lembar Karya Sastra' };
  }

  // document (formulir / resensi / laporan / fakta-opini)
  const docTag = avoidSpoiler ? 'DOKUMEN LITERASI' : extractTopicLabel(questionText, 'KARTU DOKUMEN', 20);
  const svg = `
  <svg viewBox="0 0 206 114" width="178" height="98" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="22" y="10" width="162" height="88" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
    <rect x="22" y="10" width="162" height="22" rx="4" fill="#0284c7"/>
    <text x="103" y="25" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#ffffff">${esc(docTag)}</text>
    <rect x="34" y="42" width="44" height="10" rx="2" fill="#e2e8f0"/>
    <rect x="86" y="42" width="84" height="10" rx="2" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <rect x="34" y="59" width="44" height="10" rx="2" fill="#e2e8f0"/>
    <rect x="86" y="59" width="84" height="10" rx="2" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <rect x="34" y="76" width="136" height="12" rx="2" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <text x="103" y="109" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#475569">Format Isian / Dokumen</text>
  </svg>`;
  return { svg, sig: `indo_doc_${h}`, label: 'Format Dokumen Literasi' };
}

function buildBahasaSceneSvg(kind: BahasaSceneKind, textHint: string, avoidSpoiler = false): { svg: string; sig: string; label: string } {
  const h = shortHash(textHint);
  if (kind === 'notice') {
    const cleanHint = clipText(textHint || 'PATUHI TATA TERTIB SEKOLAH', 28).toUpperCase();
    const svg = `
    <svg viewBox="0 0 220 120" width="188" height="102" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="106" y="84" width="8" height="30" fill="#78350f"/>
      <rect x="14" y="14" width="192" height="72" rx="10" fill="#eff6ff" stroke="#1d4ed8" stroke-width="3"/>
      <rect x="20" y="20" width="180" height="60" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
      <circle cx="38" cy="50" r="11" fill="#f59e0b"/>
      <text x="38" y="54" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffff">!</text>
      <text x="122" y="47" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e3a8a">${esc(cleanHint.slice(0, 22))}</text>
      <text x="122" y="61" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">${esc(cleanHint.slice(22) || 'AREA SEKOLAH BERSIH')}</text>
    </svg>`;
    return { svg, sig: `scene_notice_${h}`, label: 'Ilustrasi Papan Informasi' };
  }

  if (kind === 'procedure') {
    const topicTag = avoidSpoiler ? 'URUTAN LANGKAH' : extractTopicLabel(textHint, 'LANGKAH KERJA', 24);
    const svg = `
    <svg viewBox="0 0 225 104" width="195" height="90" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <text x="112" y="14" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">${esc(topicTag)}</text>
      <rect x="8" y="24" width="52" height="54" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <circle cx="34" cy="40" r="9" fill="#d97706"/>
      <text x="34" y="44" font-size="10" font-weight="bold" text-anchor="middle" fill="#ffffff">1</text>
      <text x="34" y="63" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#78350f">Siapkan</text>
      <text x="68" y="54" font-size="14" font-weight="bold" fill="#64748b">→</text>
      <rect x="84" y="24" width="52" height="54" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <circle cx="110" cy="40" r="9" fill="#0284c7"/>
      <text x="110" y="44" font-size="10" font-weight="bold" text-anchor="middle" fill="#ffffff">2</text>
      <text x="110" y="63" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#075985">Proses</text>
      <text x="144" y="54" font-size="14" font-weight="bold" fill="#64748b">→</text>
      <rect x="160" y="24" width="52" height="54" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <circle cx="186" cy="40" r="9" fill="#16a34a"/>
      <text x="186" y="44" font-size="10" font-weight="bold" text-anchor="middle" fill="#ffffff">3</text>
      <text x="186" y="63" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#14532d">Hasil</text>
    </svg>`;
    return { svg, sig: `scene_procedure_${h}`, label: 'Alur Langkah Petunjuk' };
  }

  if (kind === 'letter') {
    const svg = `
    <svg viewBox="0 0 200 120" width="170" height="102" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="26" y="14" width="148" height="92" rx="6" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
      <line x1="40" y1="30" x2="96" y2="30" stroke="#b45309" stroke-width="2.5"/>
      <line x1="40" y1="44" x2="158" y2="44" stroke="#94a3b8" stroke-width="2"/>
      <line x1="40" y1="56" x2="152" y2="56" stroke="#94a3b8" stroke-width="2"/>
      <line x1="40" y1="68" x2="138" y2="68" stroke="#94a3b8" stroke-width="2"/>
      <line x1="115" y1="86" x2="158" y2="86" stroke="#475569" stroke-width="2"/>
      <rect x="142" y="22" width="20" height="15" rx="2" fill="#fee2e2" stroke="#dc2626" stroke-width="1.2"/>
    </svg>`;
    return { svg, sig: 'scene_letter', label: 'Ilustrasi Surat / Pengumuman' };
  }

  if (kind === 'dialogue') {
    const svg = `
    <svg viewBox="0 0 210 118" width="180" height="101" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="48" cy="64" r="14" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
      <path d="M28,104 Q48,82 68,104 Z" fill="#3b82f6"/>
      <rect x="20" y="14" width="72" height="28" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.8"/>
      <text x="56" y="32" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#1e40af">...</text>
      <circle cx="162" cy="64" r="14" fill="#fde68a" stroke="#ca8a04" stroke-width="2"/>
      <path d="M142,104 Q162,82 182,104 Z" fill="#10b981"/>
      <rect x="118" y="22" width="72" height="28" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="1.8"/>
      <text x="154" y="40" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#065f46">...</text>
    </svg>`;
    return { svg, sig: 'scene_dialogue', label: 'Ilustrasi Percakapan' };
  }

  if (kind === 'nature') {
    const svg = `
    <svg viewBox="0 0 210 122" width="180" height="104" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="6" y="6" width="198" height="110" rx="10" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="1.5"/>
      <circle cx="172" cy="28" r="13" fill="#facc15"/>
      <path d="M6,92 Q65,78 130,90 T204,88 L204,116 L6,116 Z" fill="#22c55e"/>
      <rect x="44" y="58" width="10" height="36" fill="#78350f"/>
      <circle cx="49" cy="48" r="20" fill="#15803d"/>
      <circle cx="36" cy="54" r="14" fill="#16a34a"/>
      <circle cx="62" cy="54" r="14" fill="#16a34a"/>
      <rect x="118" y="64" width="8" height="26" fill="#78350f"/>
      <circle cx="122" cy="56" r="15" fill="#16a34a"/>
    </svg>`;
    return { svg, sig: 'scene_nature', label: 'Ilustrasi Lingkungan Alam' };
  }

  if (kind === 'book') {
    const svg = `
    <svg viewBox="0 0 200 116" width="172" height="100" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <path d="M26,24 Q64,16 100,26 L100,92 Q64,82 26,90 Z" fill="#fefce8" stroke="#b45309" stroke-width="2.2"/>
      <path d="M174,24 Q136,16 100,26 L100,92 Q136,82 174,90 Z" fill="#fffbeb" stroke="#b45309" stroke-width="2.2"/>
      <line x1="38" y1="38" x2="88" y2="38" stroke="#64748b" stroke-width="2"/>
      <line x1="38" y1="50" x2="88" y2="50" stroke="#94a3b8" stroke-width="2"/>
      <line x1="38" y1="62" x2="82" y2="62" stroke="#94a3b8" stroke-width="2"/>
      <line x1="112" y1="38" x2="162" y2="38" stroke="#64748b" stroke-width="2"/>
      <line x1="112" y1="50" x2="162" y2="50" stroke="#94a3b8" stroke-width="2"/>
      <line x1="112" y1="62" x2="152" y2="62" stroke="#94a3b8" stroke-width="2"/>
      <text x="100" y="108" font-size="9" font-weight="bold" text-anchor="middle" fill="#475569">Ilustrasi Teks Bacaan &amp; Literasi</text>
    </svg>`;
    return { svg, sig: 'scene_book', label: 'Ilustrasi Teks Bacaan' };
  }

  if (kind === 'denah') {
    const svg = `
    <svg viewBox="0 0 210 120" width="180" height="102" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="10" y="10" width="190" height="98" rx="8" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
      <rect x="10" y="48" width="190" height="18" fill="#cbd5e1"/>
      <line x1="15" y1="57" x2="195" y2="57" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,4"/>
      <rect x="26" y="18" width="46" height="24" rx="3" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
      <text x="49" y="33" font-size="8" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Sekolah</text>
      <rect x="116" y="72" width="52" height="26" rx="3" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
      <text x="142" y="88" font-size="8" font-weight="bold" text-anchor="middle" fill="#14532d">Taman</text>
      <circle cx="176" cy="28" r="11" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
      <text x="176" y="25" font-size="7" font-weight="bold" text-anchor="middle" fill="#dc2626">U</text>
      <text x="176" y="36" font-size="6.5" font-weight="bold" text-anchor="middle" fill="#475569">S</text>
    </svg>`;
    return { svg, sig: 'scene_denah', label: 'Ilustrasi Denah & Arah' };
  }

  if (kind === 'healthy') {
    const svg = `
    <svg viewBox="0 0 200 116" width="172" height="100" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="100" cy="54" r="38" fill="#ffffff" stroke="#0284c7" stroke-width="2.5"/>
      <circle cx="100" cy="54" r="30" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.5"/>
      <circle cx="88" cy="48" r="10" fill="#ef4444"/>
      <circle cx="112" cy="48" r="10" fill="#22c55e"/>
      <ellipse cx="100" cy="68" rx="16" ry="7" fill="#f59e0b"/>
      <text x="100" y="106" font-size="9" font-weight="bold" text-anchor="middle" fill="#334155">Kebiasaan Hidup Bersih &amp; Sehat</text>
    </svg>`;
    return { svg, sig: 'scene_healthy', label: 'Ilustrasi Pola Hidup Sehat' };
  }

  const posterTopic = avoidSpoiler ? 'POSTER EDUKASI' : extractTopicLabel(textHint, 'POSTER EDUKASI', 22);
  const svg = `
  <svg viewBox="0 0 200 124" width="170" height="105" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="18" y="10" width="164" height="104" rx="10" fill="#fefce8" stroke="#ca8a04" stroke-width="2.5"/>
    <rect x="26" y="18" width="148" height="24" rx="5" fill="#2563eb"/>
    <text x="100" y="34" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#ffffff">${esc(posterTopic)}</text>
    <circle cx="60" cy="76" r="22" fill="#bbf7d0" stroke="#16a34a" stroke-width="2"/>
    <path d="M52,82 L58,88 L70,68" fill="none" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>
    <line x1="94" y1="62" x2="162" y2="62" stroke="#334155" stroke-width="3" stroke-linecap="round"/>
    <line x1="94" y1="76" x2="154" y2="76" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="94" y1="90" x2="146" y2="90" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
  return { svg, sig: `scene_poster_${h}`, label: 'Ilustrasi Poster Kontekstual' };
}

// ---------------------------------------------------------------------------
// 3. IPAS 2D SCHEMATICS
// ---------------------------------------------------------------------------

function buildScience2dSvg(
  kind: 'circuit' | 'magnet' | 'eclipse' | 'states_of_matter' | 'sound_ear' | 'bio_photo' | 'bio_meta' | 'bio_organ' | 'bio_eco' | 'phys_force' | 'phys_earth' | 'phys_energy' | 'phys_light',
  avoidSpoiler = false
): { svg: string; sig: string; label: string } {
  if (kind === 'circuit') {
    const svg = `
    <svg viewBox="0 0 210 122" width="180" height="104" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="26" y="24" width="158" height="72" fill="none" stroke="#334155" stroke-width="2.5"/>
      <rect x="16" y="46" width="20" height="28" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <text x="26" y="64" font-size="9" font-weight="bold" text-anchor="middle" fill="#92400e">+ -</text>
      <circle cx="80" cy="24" r="12" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <text x="80" y="28" font-size="9" font-weight="bold" text-anchor="middle" fill="#854d0e">L1</text>
      <circle cx="136" cy="24" r="12" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <text x="136" y="28" font-size="9" font-weight="bold" text-anchor="middle" fill="#854d0e">L2</text>
      <circle cx="95" cy="96" r="3" fill="#dc2626"/>
      <circle cx="122" cy="96" r="3" fill="#dc2626"/>
      <line x1="95" y1="96" x2="118" y2="85" stroke="#dc2626" stroke-width="2.5"/>
      <text x="108" y="114" font-size="9" font-weight="bold" text-anchor="middle" fill="#475569">Skema Rangkaian Listrik</text>
    </svg>`;
    return { svg, sig: 'sci_circuit', label: 'Skema Rangkaian Listrik' };
  }
  if (kind === 'magnet') {
    const svg = `
    <svg viewBox="0 0 210 96" width="180" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="20" y="26" width="38" height="28" fill="#ef4444" stroke="#991b1b" stroke-width="1.8"/>
      <rect x="58" y="26" width="38" height="28" fill="#3b82f6" stroke="#1e40af" stroke-width="1.8"/>
      <text x="39" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">U</text>
      <text x="77" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">S</text>
      <rect x="114" y="26" width="38" height="28" fill="#ef4444" stroke="#991b1b" stroke-width="1.8"/>
      <rect x="152" y="26" width="38" height="28" fill="#3b82f6" stroke="#1e40af" stroke-width="1.8"/>
      <text x="133" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">U</text>
      <text x="171" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">S</text>
      <text x="105" y="78" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#334155">Kutub Magnet (Utara - Selatan)</text>
    </svg>`;
    return { svg, sig: 'sci_magnet', label: 'Ilustrasi Kutub Magnet' };
  }
  if (kind === 'eclipse') {
    const svg = `
    <svg viewBox="0 0 220 100" width="188" height="85" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="6" y="8" width="208" height="84" rx="10" fill="#0f172a"/>
      <circle cx="36" cy="50" r="20" fill="#facc15"/>
      <text x="36" y="82" font-size="8" font-weight="bold" text-anchor="middle" fill="#fde047">Matahari</text>
      <circle cx="110" cy="50" r="8" fill="#cbd5e1"/>
      <text x="110" y="82" font-size="8" font-weight="bold" text-anchor="middle" fill="#e2e8f0">Bulan</text>
      <circle cx="176" cy="50" r="14" fill="#3b82f6"/>
      <text x="176" y="82" font-size="8" font-weight="bold" text-anchor="middle" fill="#93c5fd">Bumi</text>
      <line x1="56" y1="36" x2="164" y2="46" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="56" y1="64" x2="164" y2="54" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
    </svg>`;
    return { svg, sig: 'sci_eclipse', label: 'Skema Posisi Matahari-Bulan-Bumi' };
  }
  if (kind === 'sound_ear') {
    const svg = `
    <svg viewBox="0 0 180 106" width="155" height="91" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <path d="M26,42 L44,42 L62,24 L62,76 L44,58 L26,58 Z" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
      <path d="M74,38 Q86,50 74,62" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M88,28 Q106,50 88,72" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M102,20 Q124,50 102,80" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
      <text x="90" y="97" font-size="9" font-weight="bold" text-anchor="middle" fill="#334155">Gelombang Bunyi &amp; Pendengaran</text>
    </svg>`;
    return { svg, sig: 'sci_sound', label: 'Ilustrasi Perambatan Bunyi' };
  }
  if (kind === 'states_of_matter') {
    const svg = `
    <svg viewBox="0 0 220 96" width="188" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="10" y="18" width="54" height="50" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
      <text x="37" y="46" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Padat</text>
      <text x="72" y="47" font-size="13" font-weight="bold" fill="#64748b">⇄</text>
      <rect x="84" y="18" width="54" height="50" rx="6" fill="#cffafe" stroke="#0891b2" stroke-width="2"/>
      <text x="111" y="46" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#155e75">Cair</text>
      <text x="146" y="47" font-size="13" font-weight="bold" fill="#64748b">⇄</text>
      <rect x="158" y="18" width="54" height="50" rx="6" fill="#f1f5f9" stroke="#64748b" stroke-width="2" stroke-dasharray="3,2"/>
      <text x="185" y="46" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#334155">Gas</text>
      <text x="110" y="84" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Perubahan Wujud Zat</text>
    </svg>`;
    return { svg, sig: 'sci_states', label: 'Skema Perubahan Wujud Benda' };
  }
  if (kind === 'bio_photo') {
    const svg = `
    <svg viewBox="0 0 216 116" width="186" height="100" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="38" cy="28" r="14" fill="#facc15"/>
      <line x1="56" y1="34" x2="88" y2="48" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,2"/>
      <line x1="108" y1="24" x2="108" y2="86" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="86" cy="52" rx="18" ry="8" fill="#22c55e" stroke="#166534" stroke-width="1.5" transform="rotate(-20,86,52)"/>
      <ellipse cx="130" cy="46" rx="18" ry="8" fill="#22c55e" stroke="#166534" stroke-width="1.5" transform="rotate(20,130,46)"/>
      <path d="M108,86 L94,102 M108,86 L108,104 M108,86 L122,102" stroke="#78350f" stroke-width="2"/>
      <circle cx="96" cy="48" r="7" fill="#ffffff" stroke="#1e293b" stroke-width="1"/>
      <text x="96" y="51" font-size="7.5" font-weight="bold" text-anchor="middle" fill="#0f172a">1</text>
      <circle cx="114" cy="94" r="7" fill="#ffffff" stroke="#1e293b" stroke-width="1"/>
      <text x="114" y="97" font-size="7.5" font-weight="bold" text-anchor="middle" fill="#0f172a">2</text>
      <text x="166" y="88" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Bagian Tumbuhan' : 'Fotosintesis'}</text>
    </svg>`;
    return { svg, sig: 'sci_bio_photo', label: 'Diagram Struktur Tumbuhan' };
  }
  if (kind === 'bio_meta') {
    const svg = `
    <svg viewBox="0 0 220 96" width="188" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="32" cy="44" r="14" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <text x="32" y="48" font-size="9" font-weight="bold" text-anchor="middle" fill="#92400e">1</text>
      <text x="56" y="48" font-size="12" font-weight="bold" fill="#64748b">→</text>
      <circle cx="82" cy="44" r="14" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="82" y="48" font-size="9" font-weight="bold" text-anchor="middle" fill="#14532d">2</text>
      <text x="106" y="48" font-size="12" font-weight="bold" fill="#64748b">→</text>
      <circle cx="132" cy="44" r="14" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2"/>
      <text x="132" y="48" font-size="9" font-weight="bold" text-anchor="middle" fill="#312e81">3</text>
      <text x="156" y="48" font-size="12" font-weight="bold" fill="#64748b">→</text>
      <circle cx="182" cy="44" r="14" fill="#fce7f3" stroke="#db2777" stroke-width="2"/>
      <text x="182" y="48" font-size="9" font-weight="bold" text-anchor="middle" fill="#831843">4</text>
      <text x="110" y="82" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Tahapan Daur Hidup Hewan' : 'Siklus Metamorfosis'}</text>
    </svg>`;
    return { svg, sig: 'sci_bio_meta', label: 'Siklus Daur Hidup Hewan' };
  }
  if (kind === 'bio_organ') {
    const svg = `
    <svg viewBox="0 0 210 104" width="180" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="20" y="16" width="170" height="66" rx="10" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/>
      <circle cx="62" cy="49" r="18" fill="#ffffff" stroke="#dc2626" stroke-width="2"/>
      <path d="M54,49 L70,49 M62,41 L62,57" stroke="#dc2626" stroke-width="2.5"/>
      <line x1="92" y1="36" x2="172" y2="36" stroke="#991b1b" stroke-width="2.5"/>
      <line x1="92" y1="50" x2="160" y2="50" stroke="#b91c1c" stroke-width="2"/>
      <line x1="92" y1="64" x2="148" y2="64" stroke="#ef4444" stroke-width="2"/>
      <text x="105" y="96" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Sistem Organ Tubuh' : 'Fungsi Organ &amp; Indera Tubuh'}</text>
    </svg>`;
    return { svg, sig: 'sci_bio_organ', label: 'Skema Sistem Organ Tubuh' };
  }
  if (kind === 'bio_eco') {
    const svg = `
    <svg viewBox="0 0 220 96" width="188" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="12" y="24" width="52" height="36" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="38" y="46" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#14532d">Produsen</text>
      <text x="74" y="46" font-size="12" font-weight="bold" fill="#64748b">→</text>
      <rect x="84" y="24" width="52" height="36" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <text x="110" y="46" font-size="8" font-weight="bold" text-anchor="middle" fill="#92400e">Konsumen</text>
      <text x="146" y="46" font-size="12" font-weight="bold" fill="#64748b">→</text>
      <rect x="156" y="24" width="52" height="36" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <text x="182" y="46" font-size="8" font-weight="bold" text-anchor="middle" fill="#075985">Pengurai</text>
      <text x="110" y="80" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Aliran Energi Ekosistem</text>
    </svg>`;
    return { svg, sig: 'sci_bio_eco', label: 'Skema Ekosistem & Rantai Makanan' };
  }
  if (kind === 'phys_force') {
    const svg = `
    <svg viewBox="0 0 216 96" width="186" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <line x1="16" y1="68" x2="200" y2="68" stroke="#475569" stroke-width="3"/>
      <rect x="78" y="34" width="50" height="34" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="2.2"/>
      <line x1="24" y1="50" x2="70" y2="50" stroke="#dc2626" stroke-width="3"/>
      <polygon points="74,50 64,44 64,56" fill="#dc2626"/>
      <line x1="136" y1="50" x2="186" y2="50" stroke="#16a34a" stroke-width="2.5" stroke-dasharray="4,2"/>
      <polygon points="190,50 180,45 180,55" fill="#16a34a"/>
      <text x="108" y="86" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Arah Pengaruh Gaya' : 'Ilustrasi Gaya &amp; Gerak Benda'}</text>
    </svg>`;
    return { svg, sig: 'sci_phys_force', label: 'Ilustrasi Gaya & Gerak' };
  }
  if (kind === 'phys_earth') {
    const svg = `
    <svg viewBox="0 0 210 106" width="180" height="90" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="8" y="8" width="194" height="88" rx="10" fill="#0f172a"/>
      <circle cx="48" cy="52" r="20" fill="#facc15"/>
      <ellipse cx="116" cy="52" rx="56" ry="26" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="3,3"/>
      <circle cx="152" cy="52" r="12" fill="#3b82f6" stroke="#93c5fd" stroke-width="1.5"/>
      <line x1="152" y1="34" x2="152" y2="70" stroke="#f8fafc" stroke-width="1.5" stroke-dasharray="2,2"/>
      <text x="105" y="90" font-size="8.2" font-weight="bold" text-anchor="middle" fill="#cbd5e1">Sistem Bumi &amp; Tata Surya</text>
    </svg>`;
    return { svg, sig: 'sci_phys_earth', label: 'Skema Bumi & Tata Surya' };
  }
  if (kind === 'phys_light') {
    const svg = `
    <svg viewBox="0 0 210 100" width="180" height="85" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <line x1="30" y1="78" x2="180" y2="78" stroke="#0284c7" stroke-width="4"/>
      <line x1="42" y1="22" x2="105" y2="78" stroke="#f59e0b" stroke-width="2.5"/>
      <line x1="105" y1="78" x2="168" y2="22" stroke="#f59e0b" stroke-width="2.5"/>
      <polygon points="168,22 158,24 165,31" fill="#f59e0b"/>
      <text x="105" y="93" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Arah Berkas Cahaya' : 'Sifat Cahaya &amp; Pemantulan'}</text>
    </svg>`;
    return { svg, sig: 'sci_phys_light', label: 'Skema Sifat Cahaya' };
  }
  // phys_energy
  const svg = `
  <svg viewBox="0 0 216 96" width="186" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="20" y="22" width="64" height="42" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text x="52" y="47" font-size="9" font-weight="bold" text-anchor="middle" fill="#92400e">Energi A</text>
    <text x="108" y="48" font-size="14" font-weight="bold" text-anchor="middle" fill="#475569">→</text>
    <rect x="132" y="22" width="64" height="42" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text x="164" y="47" font-size="9" font-weight="bold" text-anchor="middle" fill="#14532d">Energi B</text>
    <text x="108" y="82" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Perubahan &amp; Perpindahan Energi</text>
  </svg>`;
  return { svg, sig: 'sci_phys_energy', label: 'Skema Transformasi Energi' };
}

// ---------------------------------------------------------------------------
// 4. PJOK 2D DIAGRAMS
// ---------------------------------------------------------------------------

function buildPjok2dSvg(
  kind: 'soccer' | 'volleyball' | 'basketball' | 'running' | 'stretch' | 'firstaid' | 'badminton' | 'mat' | 'pool' | 'silat' | 'gerak' | 'swing_leg' | 'locomotor' | 'manipulative',
  avoidSpoiler = false
): { svg: string; sig: string; label: string } {
  if (kind === 'swing_leg') {
    const svg = `
    <svg viewBox="0 0 220 120" width="190" height="104" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="10" y="92" width="200" height="10" rx="4" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>
      <!-- Anak SD berseragam olahraga mengayunkan kaki -->
      <circle cx="96" cy="24" r="9.5" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
      <path d="M87 21 C89 12, 103 12, 105 21 Z" fill="#1e293b"/>
      <circle cx="99" cy="23" r="1.4" fill="#0f172a"/>
      <!-- Kaos olahraga merah-putih -->
      <path d="M87 34 L105 34 L107 60 L85 60 Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.2"/>
      <!-- Lengan direntangkan menjaga keseimbangan -->
      <line x1="86" y1="39" x2="60" y2="46" stroke="#fed7aa" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="106" y1="39" x2="134" y2="44" stroke="#fed7aa" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Kaki tumpu tegak -->
      <line x1="92" y1="60" x2="90" y2="91" stroke="#1e293b" stroke-width="5.5" stroke-linecap="round"/>
      <ellipse cx="94" cy="92" rx="7" ry="3.2" fill="#0f172a"/>
      <!-- Kaki diayunkan ke depan (posisi aktif) -->
      <line x1="101" y1="60" x2="132" y2="75" stroke="#2563eb" stroke-width="5.5" stroke-linecap="round"/>
      <ellipse cx="136" cy="76" rx="7" ry="3.2" fill="#1d4ed8" transform="rotate(20 136 76)"/>
      <!-- Bayangan posisi ayunan ke belakang -->
      <line x1="99" y1="60" x2="72" y2="79" stroke="#93c5fd" stroke-width="4" stroke-dasharray="3,2" stroke-linecap="round"/>
      <!-- Busur arah ayunan kaki -->
      <path d="M72 84 Q104 94 134 81" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-dasharray="4,2"/>
      <polygon points="138,79 129,77 132,85" fill="#ea580c"/>
      <polygon points="68,82 76,78 74,86" fill="#ea580c"/>
      <text x="110" y="114" font-size="8.6" font-weight="bold" text-anchor="middle" fill="#1e293b">${avoidSpoiler ? 'Gerak Nonlokomotor: Ayunan Tungkai' : 'Anak SD Mengayunkan Kaki ke Depan &amp; Belakang'}</text>
    </svg>`;
    return { svg, sig: 'pjok_swing_leg', label: 'Ilustrasi Anak SD Mengayunkan Kaki' };
  }
  if (kind === 'locomotor') {
    const svg = `
    <svg viewBox="0 0 220 118" width="190" height="102" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="10" y="90" width="200" height="10" rx="4" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>
      <!-- Anak SD melompat/berlari melewati cone -->
      <circle cx="88" cy="24" r="9" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
      <path d="M80 21 C82 13, 94 13, 96 21 Z" fill="#1e293b"/>
      <path d="M80 34 L96 34 L98 56 L78 56 Z" fill="#2563eb" stroke="#1e40af" stroke-width="1.2"/>
      <line x1="80" y1="39" x2="64" y2="32" stroke="#fed7aa" stroke-width="4" stroke-linecap="round"/>
      <line x1="96" y1="39" x2="114" y2="30" stroke="#fed7aa" stroke-width="4" stroke-linecap="round"/>
      <line x1="83" y1="56" x2="68" y2="76" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="93" y1="56" x2="112" y2="72" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <!-- Cone rintangan & lintasan gerak berpindah -->
      <polygon points="148,90 158,64 168,90" fill="#f97316" stroke="#c2410c" stroke-width="1.4"/>
      <path d="M116,44 Q152,22 182,56" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-dasharray="4,2"/>
      <polygon points="186,60 177,56 184,50" fill="#16a34a"/>
      <text x="110" y="112" font-size="8.6" font-weight="bold" text-anchor="middle" fill="#1e293b">${avoidSpoiler ? 'Gerak Berpindah Tempat' : 'Anak SD Berlari &amp; Melompat (Lokomotor)'}</text>
    </svg>`;
    return { svg, sig: 'pjok_locomotor', label: 'Ilustrasi Gerak Lokomotor Anak SD' };
  }
  if (kind === 'manipulative') {
    const svg = `
    <svg viewBox="0 0 220 118" width="190" height="102" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="10" y="90" width="200" height="10" rx="4" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>
      <!-- Anak SD menendang/melempar bola -->
      <circle cx="72" cy="24" r="9" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
      <path d="M64 21 C66 13, 78 13, 80 21 Z" fill="#1e293b"/>
      <path d="M64 34 L80 34 L82 58 L62 58 Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.2"/>
      <line x1="64" y1="39" x2="48" y2="50" stroke="#fed7aa" stroke-width="4" stroke-linecap="round"/>
      <line x1="80" y1="39" x2="98" y2="44" stroke="#fed7aa" stroke-width="4" stroke-linecap="round"/>
      <line x1="68" y1="58" x2="64" y2="90" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="77" y1="58" x2="98" y2="82" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>
      <!-- Bola & lintasan -->
      <circle cx="116" cy="78" r="10" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
      <path d="M128,72 Q156,42 184,54" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-dasharray="4,2"/>
      <polygon points="188,56 179,57 183,49" fill="#ea580c"/>
      <text x="110" y="112" font-size="8.6" font-weight="bold" text-anchor="middle" fill="#1e293b">${avoidSpoiler ? 'Gerak Menggunakan Alat Bola' : 'Anak SD Mengontrol &amp; Menendang Bola'}</text>
    </svg>`;
    return { svg, sig: 'pjok_manipulative', label: 'Ilustrasi Gerak Manipulatif Anak SD' };
  }
  if (kind === 'stretch') {
    const svg = `
    <svg viewBox="0 0 200 110" width="172" height="94" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="22" y="82" width="156" height="10" rx="4" fill="#93c5fd"/>
      <circle cx="100" cy="24" r="9" fill="#f59e0b"/>
      <line x1="100" y1="33" x2="100" y2="58" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
      <line x1="100" y1="40" x2="72" y2="26" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="100" y1="40" x2="128" y2="26" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="100" y1="58" x2="82" y2="82" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="100" y1="58" x2="118" y2="82" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
      <text x="100" y="104" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Latihan Peregangan &amp; Kebugaran</text>
    </svg>`;
    return { svg, sig: 'pjok_stretch', label: 'Ilustrasi Peregangan & Kebugaran' };
  }
  if (kind === 'firstaid') {
    const svg = `
    <svg viewBox="0 0 200 108" width="172" height="93" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <path d="M84,22 L116,22 L116,30 L84,30 Z" fill="none" stroke="#475569" stroke-width="2.5"/>
      <rect x="46" y="30" width="108" height="58" rx="8" fill="#ffffff" stroke="#dc2626" stroke-width="2.5"/>
      <rect x="93" y="43" width="14" height="32" rx="2" fill="#dc2626"/>
      <rect x="84" y="52" width="32" height="14" rx="2" fill="#dc2626"/>
      <text x="100" y="102" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Kesehatan &amp; Pertolongan Pertama</text>
    </svg>`;
    return { svg, sig: 'pjok_firstaid', label: 'Ilustrasi Kesehatan & P3K' };
  }
  if (kind === 'badminton') {
    const svg = `
    <svg viewBox="0 0 210 112" width="180" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="16" y="14" width="178" height="78" rx="4" fill="#10b981" stroke="#ffffff" stroke-width="2.2"/>
      <line x1="105" y1="14" x2="105" y2="92" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4,2"/>
      <ellipse cx="64" cy="48" rx="12" ry="16" fill="none" stroke="#fef08a" stroke-width="2"/>
      <line x1="64" y1="64" x2="64" y2="82" stroke="#fef08a" stroke-width="2.5"/>
      <circle cx="144" cy="46" r="5" fill="#ffffff"/>
      <text x="105" y="106" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Lapangan Permainan Net / Bola Kecil</text>
    </svg>`;
    return { svg, sig: 'pjok_badminton', label: 'Lapangan Permainan Net & Raket' };
  }
  if (kind === 'mat') {
    const svg = `
    <svg viewBox="0 0 210 102" width="180" height="87" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <polygon points="24,78 186,78 172,58 38,58" fill="#60a5fa" stroke="#1d4ed8" stroke-width="2"/>
      <path d="M72,52 Q105,22 138,52" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-dasharray="4,3"/>
      <polygon points="140,54 132,48 138,44" fill="#ea580c"/>
      <text x="105" y="95" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Matras &amp; Keseimbangan Senam Lantai</text>
    </svg>`;
    return { svg, sig: 'pjok_mat', label: 'Ilustrasi Senam Lantai & Matras' };
  }
  if (kind === 'pool') {
    const svg = `
    <svg viewBox="0 0 210 106" width="180" height="91" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="16" y="14" width="178" height="74" rx="8" fill="#bae6fd" stroke="#0284c7" stroke-width="2.5"/>
      <line x1="16" y1="38" x2="194" y2="38" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="5,3"/>
      <line x1="16" y1="64" x2="194" y2="64" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="5,3"/>
      <path d="M40,26 Q55,20 70,26 T100,26 T130,26" fill="none" stroke="#0369a1" stroke-width="1.8"/>
      <text x="105" y="101" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Lintasan Kolam Renang</text>
    </svg>`;
    return { svg, sig: 'pjok_pool', label: 'Ilustrasi Kolam Renang' };
  }
  if (kind === 'silat') {
    const svg = `
    <svg viewBox="0 0 200 104" width="172" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="20" y="14" width="160" height="72" rx="8" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
      <circle cx="100" cy="50" r="24" fill="none" stroke="#d97706" stroke-width="1.8" stroke-dasharray="4,2"/>
      <ellipse cx="76" cy="58" rx="9" ry="5" fill="#1e293b"/>
      <ellipse cx="124" cy="44" rx="9" ry="5" fill="#1e293b"/>
      <text x="100" y="98" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Posisi Kuda-Kuda Bela Diri</text>
    </svg>`;
    return { svg, sig: 'pjok_silat', label: 'Posisi Langkah Pencak Silat' };
  }
  if (kind === 'gerak') {
    const svg = `
    <svg viewBox="0 0 210 96" width="180" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="44" cy="44" r="14" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
      <text x="44" y="48" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e3a8a">A</text>
      <path d="M66,44 Q105,20 144,44" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-dasharray="4,2"/>
      <polygon points="148,46 138,45 142,37" fill="#16a34a"/>
      <circle cx="166" cy="44" r="14" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="166" y="48" font-size="9" font-weight="bold" text-anchor="middle" fill="#14532d">B</text>
      <text x="105" y="82" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Pola Arah Gerak Dasar' : 'Lintasan Gerak Dasar PJOK'}</text>
    </svg>`;
    return { svg, sig: 'pjok_gerak', label: 'Diagram Arah Gerak Dasar' };
  }
  if (kind === 'running') {
    const svg = `
    <svg viewBox="0 0 210 100" width="180" height="85" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="12" y="16" width="186" height="62" rx="30" fill="#fed7aa" stroke="#ea580c" stroke-width="2.5"/>
      <rect x="28" y="28" width="154" height="38" rx="18" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.8"/>
      <line x1="65" y1="16" x2="65" y2="28" stroke="#ffffff" stroke-width="2.5"/>
      <text x="105" y="92" font-size="9" font-weight="bold" text-anchor="middle" fill="#334155">Lintasan Lari / Atletik</text>
    </svg>`;
    return { svg, sig: 'pjok_track', label: 'Ilustrasi Lintasan Atletik' };
  }
  const bg = kind === 'soccer' ? '#22c55e' : '#fdba74';
  const stroke = kind === 'soccer' ? '#ffffff' : '#9a3412';
  const label = kind === 'soccer' ? 'Lapangan Sepak Bola' : kind === 'volleyball' ? 'Lapangan Bola Voli' : 'Lapangan Bola Basket';
  const svg = `
  <svg viewBox="0 0 210 112" width="180" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="14" y="12" width="182" height="80" rx="4" fill="${bg}" stroke="${stroke}" stroke-width="2.5"/>
    <line x1="105" y1="12" x2="105" y2="92" stroke="${stroke}" stroke-width="2"/>
    <circle cx="105" cy="52" r="14" fill="none" stroke="${stroke}" stroke-width="2"/>
    <rect x="14" y="34" width="22" height="36" fill="none" stroke="${stroke}" stroke-width="2"/>
    <rect x="174" y="34" width="22" height="36" fill="none" stroke="${stroke}" stroke-width="2"/>
    <text x="105" y="106" font-size="9" font-weight="bold" text-anchor="middle" fill="#334155">${label}</text>
  </svg>`;
  return { svg, sig: `pjok_${kind}`, label };
}

// ---------------------------------------------------------------------------
// 5. SENI RUPA, MUSIK, TARI & TEATER 2D DIAGRAMS
// ---------------------------------------------------------------------------

function buildSeni2dSvg(
  kind: 'color' | 'pattern' | 'elements' | 'collage' | 'music' | 'dance' | 'theater',
  avoidSpoiler = false
): { svg: string; sig: string; label: string } {
  if (kind === 'color') {
    const svg = `
    <svg viewBox="0 0 190 114" width="160" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="72" cy="52" r="28" fill="#ef4444" fill-opacity="0.72"/>
      <circle cx="118" cy="52" r="28" fill="#3b82f6" fill-opacity="0.72"/>
      <circle cx="95" cy="76" r="28" fill="#facc15" fill-opacity="0.72"/>
      <text x="95" y="110" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Lingkaran Pencampuran Warna' : 'Lingkaran Warna Dasar &amp; Sekunder'}</text>
    </svg>`;
    return { svg, sig: 'seni_colors', label: 'Ilustrasi Pencampuran Warna' };
  }
  if (kind === 'elements') {
    const svg = `
    <svg viewBox="0 0 210 102" width="180" height="87" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="14" y="14" width="182" height="68" rx="6" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
      <circle cx="42" cy="48" r="5" fill="#1e293b"/>
      <line x1="66" y1="30" x2="112" y2="66" stroke="#2563eb" stroke-width="2.5"/>
      <path d="M68,66 Q90,46 112,66" fill="none" stroke="#16a34a" stroke-width="2.2"/>
      <polygon points="154,28 178,66 130,66" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
      <text x="105" y="96" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Amati Unsur Visual Karya' : 'Unsur Seni Rupa 2 Dimensi'}</text>
    </svg>`;
    return { svg, sig: 'seni_elements', label: 'Unsur Seni Rupa 2D' };
  }
  if (kind === 'collage') {
    const svg = `
    <svg viewBox="0 0 190 106" width="164" height="91" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="24" y="14" width="142" height="72" rx="4" fill="#fffbeb" stroke="#78350f" stroke-width="2"/>
      <polygon points="34,24 68,24 54,48" fill="#ef4444"/>
      <rect x="74" y="24" width="32" height="24" rx="2" fill="#3b82f6"/>
      <circle cx="132" cy="36" r="13" fill="#22c55e"/>
      <polygon points="40,56 76,54 70,76 34,74" fill="#f59e0b"/>
      <rect x="86" y="54" width="64" height="22" rx="3" fill="#a855f7"/>
      <text x="95" y="100" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Amati Teknik Tempel Karya' : 'Pola Karya Tempel / Mozaik'}</text>
    </svg>`;
    return { svg, sig: 'seni_collage', label: 'Ilustrasi Karya Tempel 2D' };
  }
  if (kind === 'music') {
    const svg = `
    <svg viewBox="0 0 210 102" width="180" height="87" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <line x1="20" y1="26" x2="190" y2="26" stroke="#64748b" stroke-width="1.2"/>
      <line x1="20" y1="36" x2="190" y2="36" stroke="#64748b" stroke-width="1.2"/>
      <line x1="20" y1="46" x2="190" y2="46" stroke="#64748b" stroke-width="1.2"/>
      <line x1="20" y1="56" x2="190" y2="56" stroke="#64748b" stroke-width="1.2"/>
      <line x1="20" y1="66" x2="190" y2="66" stroke="#64748b" stroke-width="1.2"/>
      <ellipse cx="56" cy="56" rx="7" ry="5" fill="#1e293b"/>
      <line x1="62" y1="56" x2="62" y2="24" stroke="#1e293b" stroke-width="2"/>
      <ellipse cx="102" cy="46" rx="7" ry="5" fill="#2563eb"/>
      <line x1="108" y1="46" x2="108" y2="18" stroke="#2563eb" stroke-width="2"/>
      <ellipse cx="144" cy="36" rx="7" ry="5" fill="#2563eb"/>
      <line x1="150" y1="36" x2="150" y2="14" stroke="#2563eb" stroke-width="2"/>
      <line x1="108" y1="18" x2="150" y2="14" stroke="#2563eb" stroke-width="3"/>
      <text x="105" y="92" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Notasi &amp; Irama Musik' : 'Tangga Nada &amp; Irama Musik'}</text>
    </svg>`;
    return { svg, sig: 'seni_music', label: 'Ilustrasi Notasi Musik' };
  }
  if (kind === 'dance') {
    const svg = `
    <svg viewBox="0 0 210 104" width="180" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="20" y="14" width="170" height="70" rx="6" fill="#fdf2f8" stroke="#db2777" stroke-width="2"/>
      <line x1="45" y1="70" x2="105" y2="30" stroke="#9d174d" stroke-width="1.5" stroke-dasharray="3,2"/>
      <line x1="105" y1="30" x2="165" y2="70" stroke="#9d174d" stroke-width="1.5" stroke-dasharray="3,2"/>
      <circle cx="45" cy="70" r="8" fill="#db2777"/>
      <circle cx="75" cy="50" r="8" fill="#db2777"/>
      <circle cx="105" cy="30" r="8" fill="#be185d"/>
      <circle cx="135" cy="50" r="8" fill="#db2777"/>
      <circle cx="165" cy="70" r="8" fill="#db2777"/>
      <text x="105" y="98" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Formasi Penari di Panggung' : 'Formasi Pola Lantai Tari'}</text>
    </svg>`;
    return { svg, sig: 'seni_dance', label: 'Diagram Formasi Tari' };
  }
  if (kind === 'theater') {
    const svg = `
    <svg viewBox="0 0 210 108" width="180" height="92" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="18" y="12" width="174" height="78" rx="6" fill="#1e293b"/>
      <polygon points="105,14 64,84 146,84" fill="#fef08a" fill-opacity="0.28"/>
      <path d="M18,12 L48,12 Q36,52 18,90 Z" fill="#b91c1c"/>
      <path d="M192,12 L162,12 Q174,52 192,90 Z" fill="#b91c1c"/>
      <circle cx="105" cy="58" r="10" fill="#fde68a"/>
      <text x="105" y="102" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Panggung Pementasan Seni Peran</text>
    </svg>`;
    return { svg, sig: 'seni_theater', label: 'Ilustrasi Panggung Teater' };
  }
  const svg = `
  <svg viewBox="0 0 180 108" width="154" height="92" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="18" y="12" width="144" height="76" rx="6" fill="#fff7ed" stroke="#9a3412" stroke-width="2"/>
    <circle cx="54" cy="50" r="18" fill="none" stroke="#c2410c" stroke-width="2"/>
    <circle cx="90" cy="50" r="18" fill="none" stroke="#c2410c" stroke-width="2"/>
    <circle cx="126" cy="50" r="18" fill="none" stroke="#c2410c" stroke-width="2"/>
    <circle cx="54" cy="50" r="6" fill="#ea580c"/>
    <circle cx="90" cy="50" r="6" fill="#ea580c"/>
    <circle cx="126" cy="50" r="6" fill="#ea580c"/>
    <text x="90" y="102" font-size="9" font-weight="bold" text-anchor="middle" fill="#7c2d12">${avoidSpoiler ? 'Pola Ragam Hias' : 'Pola Ragam Hias Geometris'}</text>
  </svg>`;
  return { svg, sig: 'seni_pattern', label: 'Ilustrasi Ragam Hias 2D' };
}

// ---------------------------------------------------------------------------
// 6. PAI 2D DIAGRAMS
// ---------------------------------------------------------------------------

function buildPai2dSvg(kind: 'mosque' | 'quran' | 'wudu' | 'charity' | 'akhlak', avoidSpoiler = false): { svg: string; sig: string; label: string } {
  if (kind === 'wudu') {
    const svg = `
    <svg viewBox="0 0 206 108" width="176" height="92" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <path d="M40,26 L98,26 L98,40" fill="none" stroke="#475569" stroke-width="6" stroke-linecap="round"/>
      <rect x="64" y="16" width="16" height="6" rx="2" fill="#0284c7"/>
      <path d="M98,46 Q92,58 98,66 Q104,58 98,46 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
      <path d="M52,78 Q103,88 154,78" fill="none" stroke="#0284c7" stroke-width="2.5"/>
      <text x="103" y="100" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#0369a1">${avoidSpoiler ? 'Alur Bersuci dengan Air' : 'Tata Cara Bersuci (Wudu)'}</text>
    </svg>`;
    return { svg, sig: 'pai_wudu', label: 'Ilustrasi Bersuci (Wudu)' };
  }
  if (kind === 'charity') {
    const svg = `
    <svg viewBox="0 0 200 108" width="172" height="92" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="60" y="42" width="80" height="46" rx="6" fill="#d1fae5" stroke="#047857" stroke-width="2.2"/>
      <line x1="86" y1="42" x2="114" y2="42" stroke="#064e3b" stroke-width="3.5"/>
      <circle cx="100" cy="24" r="10" fill="#facc15" stroke="#ca8a04" stroke-width="1.8"/>
      <path d="M100,34 L100,40" stroke="#047857" stroke-width="2"/>
      <text x="100" y="101" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#065f46">${avoidSpoiler ? 'Amalan Berbagi Kepada Sesama' : 'Semangat Infak, Zakat &amp; Sedekah'}</text>
    </svg>`;
    return { svg, sig: 'pai_charity', label: 'Ilustrasi Berbagi & Sedekah' };
  }
  if (kind === 'akhlak') {
    const svg = `
    <svg viewBox="0 0 190 112" width="164" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="65" y="22" width="60" height="60" fill="#ecfdf5" stroke="#047857" stroke-width="2"/>
      <rect x="65" y="22" width="60" height="60" fill="none" stroke="#10b981" stroke-width="2" transform="rotate(45,95,52)"/>
      <circle cx="95" cy="52" r="14" fill="#d1fae5" stroke="#047857" stroke-width="1.5"/>
      <text x="95" y="105" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#065f46">${avoidSpoiler ? 'Keteladanan Akhlak Mulia' : 'Nilai Akhlak Terpuji &amp; Iman'}</text>
    </svg>`;
    return { svg, sig: 'pai_akhlak', label: 'Ilustrasi Akhlak Terpuji' };
  }
  if (kind === 'mosque') {
    const svg = `
    <svg viewBox="0 0 200 120" width="170" height="102" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <path d="M58,64 Q100,16 142,64 Z" fill="#10b981" stroke="#065f46" stroke-width="2"/>
      <rect x="44" y="64" width="112" height="42" fill="#ecfdf5" stroke="#065f46" stroke-width="2"/>
      <path d="M88,106 L88,80 Q100,68 112,80 L112,106 Z" fill="#047857"/>
      <rect x="26" y="34" width="14" height="72" fill="#d1fae5" stroke="#065f46" stroke-width="1.8"/>
      <polygon points="24,34 33,18 42,34" fill="#10b981" stroke="#065f46" stroke-width="1.5"/>
      <circle cx="100" cy="22" r="5" fill="#facc15"/>
    </svg>`;
    return { svg, sig: 'pai_mosque', label: 'Ilustrasi Tempat Ibadah Masjid' };
  }
  const svg = `
  <svg viewBox="0 0 200 116" width="170" height="98" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <path d="M26,24 Q64,16 100,26 L100,92 Q64,82 26,90 Z" fill="#ecfdf5" stroke="#047857" stroke-width="2.2"/>
    <path d="M174,24 Q136,16 100,26 L100,92 Q136,82 174,90 Z" fill="#f0fdf4" stroke="#047857" stroke-width="2.2"/>
    <rect x="38" y="34" width="48" height="42" fill="none" stroke="#10b981" stroke-width="1.5" rx="3"/>
    <rect x="114" y="34" width="48" height="42" fill="none" stroke="#10b981" stroke-width="1.5" rx="3"/>
    <text x="100" y="108" font-size="9" font-weight="bold" text-anchor="middle" fill="#065f46">Mushaf Kitab Suci</text>
  </svg>`;
  return { svg, sig: 'pai_quran', label: 'Ilustrasi Kitab Suci' };
}

// ---------------------------------------------------------------------------
// 7. KODING & KECERDASAN ARTIFISIAL 2D DIAGRAMS
// ---------------------------------------------------------------------------

function buildCoding2dSvg(kind: 'flowchart' | 'loop' | 'ifelse' | 'debug' | 'ai' | 'security', avoidSpoiler = false): { svg: string; sig: string; label: string } {
  if (kind === 'flowchart') {
    const svg = `
    <svg viewBox="0 0 220 114" width="190" height="98" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="14" y="36" width="44" height="24" rx="12" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="36" y="51" font-size="8" font-weight="bold" text-anchor="middle" fill="#14532d">Mulai</text>
      <line x1="58" y1="48" x2="74" y2="48" stroke="#475569" stroke-width="2"/>
      <rect x="74" y="36" width="44" height="24" rx="2" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
      <text x="96" y="51" font-size="8" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Proses</text>
      <line x1="118" y1="48" x2="134" y2="48" stroke="#475569" stroke-width="2"/>
      <polygon points="158,24 184,48 158,72 132,48" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <text x="158" y="51" font-size="9" font-weight="bold" text-anchor="middle" fill="#92400e">?</text>
      <text x="110" y="102" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Diagram Alir (Flowchart)' : 'Skema Diagram Alir Algoritma'}</text>
    </svg>`;
    return { svg, sig: 'koding_flowchart', label: 'Diagram Alir (Flowchart)' };
  }
  if (kind === 'loop') {
    const svg = `
    <svg viewBox="0 0 210 104" width="180" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <path d="M52,32 L158,32 L158,72 L52,72 Z" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-dasharray="5,3"/>
      <rect x="70" y="40" width="70" height="24" rx="4" fill="#ede9fe" stroke="#6d28d9" stroke-width="2"/>
      <text x="105" y="55" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#4c1d95">Ulangi [ N ]</text>
      <polygon points="105,26 113,32 105,38" fill="#7c3aed"/>
      <text x="105" y="94" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Struktur Blok Berulang' : 'Pola Perulangan (Looping)'}</text>
    </svg>`;
    return { svg, sig: 'koding_loop', label: 'Diagram Struktur Perulangan' };
  }
  if (kind === 'ifelse') {
    const svg = `
    <svg viewBox="0 0 210 108" width="180" height="92" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="26" y="14" width="158" height="26" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
      <text x="105" y="30" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#92400e">JIKA [ Kondisi ] MAKA</text>
      <rect x="48" y="44" width="124" height="20" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.8"/>
      <text x="110" y="57" font-size="8.2" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Jalankan Aksi A</text>
      <rect x="48" y="68" width="124" height="20" rx="4" fill="#e2e8f0" stroke="#64748b" stroke-width="1.8"/>
      <text x="110" y="81" font-size="8.2" font-weight="bold" text-anchor="middle" fill="#334155">Jika Tidak: Aksi B</text>
      <text x="105" y="102" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#475569">Blok Logika Kondisi</text>
    </svg>`;
    return { svg, sig: 'koding_ifelse', label: 'Blok Logika Percabangan' };
  }
  if (kind === 'debug') {
    const svg = `
    <svg viewBox="0 0 210 104" width="180" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="64" y="14" width="82" height="24" rx="4" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
      <text x="105" y="29" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#991b1b">Masalah Utama</text>
      <line x1="105" y1="38" x2="46" y2="58" stroke="#475569" stroke-width="1.8"/>
      <line x1="105" y1="38" x2="105" y2="58" stroke="#475569" stroke-width="1.8"/>
      <line x1="105" y1="38" x2="164" y2="58" stroke="#475569" stroke-width="1.8"/>
      <rect x="20" y="58" width="50" height="22" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.6"/>
      <text x="45" y="72" font-size="8" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Bagian 1</text>
      <rect x="80" y="58" width="50" height="22" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.6"/>
      <text x="105" y="72" font-size="8" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Bagian 2</text>
      <rect x="140" y="58" width="50" height="22" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.6"/>
      <text x="165" y="72" font-size="8" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Bagian 3</text>
      <text x="105" y="96" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Pemecahan Masalah Terstruktur' : 'Berpikir Komputasional'}</text>
    </svg>`;
    return { svg, sig: 'koding_debug', label: 'Skema Berpikir Komputasional' };
  }
  if (kind === 'ai') {
    const svg = `
    <svg viewBox="0 0 220 100" width="190" height="86" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="14" y="26" width="52" height="36" rx="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <text x="40" y="48" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#075985">Data</text>
      <text x="76" y="48" font-size="12" font-weight="bold" fill="#475569">→</text>
      <rect x="86" y="22" width="50" height="44" rx="8" fill="#ede9fe" stroke="#6d28d9" stroke-width="2"/>
      <text x="111" y="47" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#4c1d95">AI</text>
      <text x="146" y="48" font-size="12" font-weight="bold" fill="#475569">→</text>
      <rect x="156" y="26" width="52" height="36" rx="5" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="182" y="48" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#14532d">Hasil</text>
      <text x="110" y="86" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Alur Kerja Kecerdasan Artifisial</text>
    </svg>`;
    return { svg, sig: 'koding_ai', label: 'Alur Kerja Kecerdasan Artifisial' };
  }
  // security / hardware
  const svg = `
  <svg viewBox="0 0 200 104" width="172" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <path d="M100,16 L142,30 L142,56 Q142,78 100,90 Q58,78 58,56 L58,30 Z" fill="#ecfdf5" stroke="#059669" stroke-width="2.2"/>
    <rect x="86" y="48" width="28" height="22" rx="3" fill="#059669"/>
    <path d="M92,48 L92,40 Q100,32 108,40 L108,48" fill="none" stroke="#059669" stroke-width="2.5"/>
    <text x="100" y="102" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">Perangkat &amp; Keamanan Digital</text>
  </svg>`;
  return { svg, sig: 'koding_security', label: 'Ilustrasi Keamanan & Perangkat Digital' };
}

// ---------------------------------------------------------------------------
// 8. BAHASA SUNDA, BAHASA INGGRIS & PENDIDIKAN PANCASILA 2D DIAGRAMS
// ---------------------------------------------------------------------------

function buildSunda2dSvg(kind: 'food' | 'game' | 'music' | 'aksara' | 'sastra' | 'leuit', avoidSpoiler = false): { svg: string; sig: string; label: string } {
  if (kind === 'food') {
    const svg = `
    <svg viewBox="0 0 200 108" width="172" height="92" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <ellipse cx="100" cy="68" rx="64" ry="18" fill="#fef3c7" stroke="#b45309" stroke-width="2.2"/>
      <ellipse cx="84" cy="56" rx="18" ry="11" fill="#fde68a" stroke="#d97706" stroke-width="1.8"/>
      <ellipse cx="116" cy="56" rx="18" ry="11" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
      <ellipse cx="100" cy="46" rx="18" ry="11" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8"/>
      <text x="100" y="100" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#78350f">${avoidSpoiler ? 'Kadaharan Tradisional Sunda' : 'Kadaharan Khas Daerah'}</text>
    </svg>`;
    return { svg, sig: 'sunda_food', label: 'Ilustrasi Kadaharan Sunda' };
  }
  if (kind === 'game') {
    const svg = `
    <svg viewBox="0 0 216 96" width="186" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="16" y="20" width="184" height="50" rx="25" fill="#fed7aa" stroke="#9a3412" stroke-width="2.2"/>
      <circle cx="48" cy="36" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="78" cy="36" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="108" cy="36" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="138" cy="36" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="168" cy="36" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="48" cy="54" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="78" cy="54" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="108" cy="54" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="138" cy="54" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <circle cx="168" cy="54" r="7" fill="#fef3c7" stroke="#9a3412" stroke-width="1.5"/>
      <text x="108" y="86" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">${avoidSpoiler ? 'Kaulinan Barudak Lembur' : 'Kaulinan Tradisional Sunda'}</text>
    </svg>`;
    return { svg, sig: 'sunda_game', label: 'Ilustrasi Kaulinan Barudak' };
  }
  if (kind === 'music') {
    const svg = `
    <svg viewBox="0 0 200 112" width="172" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="34" y="18" width="132" height="68" fill="none" stroke="#92400e" stroke-width="2.5"/>
      <rect x="52" y="24" width="12" height="58" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.8"/>
      <rect x="76" y="32" width="11" height="50" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.8"/>
      <rect x="100" y="38" width="11" height="44" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.8"/>
      <rect x="124" y="46" width="10" height="36" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.8"/>
      <text x="100" y="102" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#78350f">${avoidSpoiler ? 'Waditra Awi Tradisional' : 'Kasenian Alat Musik Awi'}</text>
    </svg>`;
    return { svg, sig: 'sunda_music', label: 'Ilustrasi Waditra Tradisional' };
  }
  if (kind === 'aksara') {
    const svg = `
    <svg viewBox="0 0 200 104" width="172" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="28" y="14" width="144" height="70" rx="8" fill="#fefce8" stroke="#854d0e" stroke-width="2.2"/>
      <path d="M56,60 L66,34 L76,60 L86,34" fill="none" stroke="#713f12" stroke-width="3" stroke-linecap="round"/>
      <path d="M104,34 L104,60 M104,48 L122,48 L122,60" fill="none" stroke="#713f12" stroke-width="3" stroke-linecap="round"/>
      <path d="M136,34 L136,60 M136,42 Q150,42 150,60" fill="none" stroke="#713f12" stroke-width="3" stroke-linecap="round"/>
      <text x="100" y="98" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Aksara Tradisional Sunda</text>
    </svg>`;
    return { svg, sig: 'sunda_aksara', label: 'Ilustrasi Aksara Sunda' };
  }
  if (kind === 'sastra') {
    const svg = `
    <svg viewBox="0 0 206 106" width="178" height="91" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="24" y="14" width="158" height="72" rx="8" fill="#fffbeb" stroke="#b45309" stroke-width="2"/>
      <line x1="42" y1="32" x2="164" y2="32" stroke="#78350f" stroke-width="2.2"/>
      <line x1="42" y1="46" x2="152" y2="46" stroke="#92400e" stroke-width="2"/>
      <line x1="42" y1="60" x2="160" y2="60" stroke="#78350f" stroke-width="2"/>
      <line x1="42" y1="74" x2="136" y2="74" stroke="#92400e" stroke-width="2"/>
      <text x="103" y="100" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Karya Sastra &amp; Basa Sunda</text>
    </svg>`;
    return { svg, sig: 'sunda_sastra', label: 'Ilustrasi Sastra Sunda' };
  }
  // leuit
  const svg = `
  <svg viewBox="0 0 200 112" width="172" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <polygon points="100,14 48,54 152,54" fill="#92400e" stroke="#451a03" stroke-width="2"/>
    <rect x="64" y="54" width="72" height="36" fill="#fef3c7" stroke="#78350f" stroke-width="2"/>
    <rect x="92" y="64" width="16" height="26" fill="#b45309"/>
    <text x="100" y="104" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Kahuripan &amp; Budaya Lembur</text>
  </svg>`;
  return { svg, sig: 'sunda_leuit', label: 'Ilustrasi Budaya Lembur Sunda' };
}

function buildEnglish2dSvg(kind: 'preposition' | 'weather' | 'food' | 'shopping' | 'animal' | 'time', q: DynamicVisualInput): { svg: string; sig: string; label: string } {
  const combined = `${q.stimulus || ''} ${q.question || ''}`.toLowerCase();
  if (kind === 'preposition') {
    const ansText = getCorrectOptionText(q).toLowerCase();
    const pos = ansText.includes('under')
      ? 'under'
      : ansText.includes('next') || ansText.includes('beside')
      ? 'beside'
      : 'on';
    const ballCx = pos === 'beside' ? 156 : 100;
    const ballCy = pos === 'under' ? 76 : pos === 'beside' ? 74 : 38;
    const svg = `
    <svg viewBox="0 0 200 104" width="172" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="52" y="48" width="96" height="8" rx="2" fill="#92400e"/>
      <line x1="62" y1="56" x2="62" y2="86" stroke="#78350f" stroke-width="5"/>
      <line x1="138" y1="56" x2="138" y2="86" stroke="#78350f" stroke-width="5"/>
      <circle cx="${ballCx}" cy="${ballCy}" r="10" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
      <text x="100" y="99" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">Observe the Position</text>
    </svg>`;
    return { svg, sig: `en_prep_${pos}`, label: 'Preposition Illustration' };
  }
  if (kind === 'weather') {
    const isRain = /\b(rain|rainy|umbrella|wet)\b/.test(combined);
    const svg = `
    <svg viewBox="0 0 200 102" width="172" height="87" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="72" cy="40" r="18" fill="#facc15"/>
      <path d="M84,54 Q84,36 104,36 Q120,28 134,40 Q150,42 148,58 L84,58 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
      ${isRain ? '<line x1="96" y1="64" x2="90" y2="76" stroke="#0284c7" stroke-width="2"/><line x1="114" y1="64" x2="108" y2="76" stroke="#0284c7" stroke-width="2"/><line x1="132" y1="64" x2="126" y2="76" stroke="#0284c7" stroke-width="2"/>' : ''}
      <text x="100" y="94" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Weather &amp; Season Context</text>
    </svg>`;
    return { svg, sig: `en_weather_${isRain ? 'rain' : 'sun'}`, label: 'Weather Illustration' };
  }
  if (kind === 'food') {
    const svg = `
    <svg viewBox="0 0 200 102" width="172" height="87" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="88" cy="48" r="28" fill="#ffffff" stroke="#0284c7" stroke-width="2.5"/>
      <circle cx="80" cy="44" r="9" fill="#ef4444"/>
      <circle cx="96" cy="52" r="8" fill="#22c55e"/>
      <rect x="132" y="28" width="24" height="38" rx="3" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
      <text x="100" y="94" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Food &amp; Drink Vocabulary</text>
    </svg>`;
    return { svg, sig: 'en_food', label: 'Food & Drink Illustration' };
  }
  if (kind === 'shopping') {
    const rp = combined.match(/([\d.]+)\s*(?:rupiah|thousand)/i)?.[1] || 'Price';
    const svg = `
    <svg viewBox="0 0 200 96" width="172" height="82" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <polygon points="36,24 148,24 170,46 148,68 36,68" fill="#fef3c7" stroke="#d97706" stroke-width="2.2"/>
      <circle cx="54" cy="46" r="5" fill="#ffffff" stroke="#d97706" stroke-width="1.5"/>
      <text x="108" y="50" font-size="11" font-weight="bold" text-anchor="middle" fill="#92400e">Rp ${esc(clipText(rp, 10))}</text>
      <text x="100" y="88" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#475569">Price Tag &amp; Shopping</text>
    </svg>`;
    return { svg, sig: `en_shop_${rp}`, label: 'Shopping Price Tag' };
  }
  if (kind === 'animal') {
    const svg = `
    <svg viewBox="0 0 200 100" width="172" height="86" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="20" y="14" width="160" height="66" rx="8" fill="#ecfdf5" stroke="#16a34a" stroke-width="2"/>
      <circle cx="72" cy="46" r="12" fill="#fde68a" stroke="#b45309" stroke-width="1.8"/>
      <ellipse cx="122" cy="52" rx="22" ry="12" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
      <text x="100" y="94" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Animal Kingdom Context</text>
    </svg>`;
    return { svg, sig: 'en_animal', label: 'Animal Context Illustration' };
  }
  return buildClockSvg(7, 0, true);
}

function buildPancasila2dSvg(kind: 'musyawarah' | 'gotong' | 'balance' | 'unity', avoidSpoiler = false): { svg: string; sig: string; label: string } {
  if (kind === 'musyawarah') {
    const svg = `
    <svg viewBox="0 0 200 106" width="172" height="91" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="100" cy="50" r="24" fill="#fef3c7" stroke="#d97706" stroke-width="2.2"/>
      <circle cx="100" cy="18" r="8" fill="#3b82f6"/>
      <circle cx="136" cy="50" r="8" fill="#10b981"/>
      <circle cx="100" cy="82" r="8" fill="#ef4444"/>
      <circle cx="64" cy="50" r="8" fill="#8b5cf6"/>
      <text x="100" y="102" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">${avoidSpoiler ? 'Diskusi Bersama Warga/Kelas' : 'Musyawarah untuk Mufakat'}</text>
    </svg>`;
    return { svg, sig: 'ppkn_musyawarah', label: 'Ilustrasi Musyawarah' };
  }
  if (kind === 'gotong') {
    const svg = `
    <svg viewBox="0 0 200 102" width="172" height="87" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="62" cy="40" r="11" fill="#3b82f6"/>
      <circle cx="100" cy="34" r="11" fill="#ef4444"/>
      <circle cx="138" cy="40" r="11" fill="#10b981"/>
      <path d="M44,72 Q100,46 156,72" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <text x="100" y="94" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Kerja Sama &amp; Gotong Royong</text>
    </svg>`;
    return { svg, sig: 'ppkn_gotong', label: 'Ilustrasi Gotong Royong' };
  }
  if (kind === 'balance') {
    const svg = `
    <svg viewBox="0 0 200 108" width="172" height="92" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <polygon points="88,92 112,92 100,62" fill="#475569"/>
      <line x1="40" y1="36" x2="160" y2="36" stroke="#1e293b" stroke-width="3"/>
      <rect x="24" y="42" width="52" height="22" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.8"/>
      <text x="50" y="56" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Hak</text>
      <rect x="124" y="42" width="56" height="22" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.8"/>
      <text x="152" y="56" font-size="8" font-weight="bold" text-anchor="middle" fill="#14532d">Kewajiban</text>
      <text x="100" y="104" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#475569">Keseimbangan Hak &amp; Kewajiban</text>
    </svg>`;
    return { svg, sig: 'ppkn_balance', label: 'Keseimbangan Hak & Kewajiban' };
  }
  // unity
  const svg = `
  <svg viewBox="0 0 200 104" width="172" height="89" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <path d="M32,68 A68,48 0 0 1 168,68" fill="none" stroke="#dc2626" stroke-width="5"/>
    <path d="M44,68 A56,38 0 0 1 156,68" fill="none" stroke="#f59e0b" stroke-width="4"/>
    <path d="M56,68 A44,28 0 0 1 144,68" fill="none" stroke="#16a34a" stroke-width="4"/>
    <text x="100" y="94" font-size="8.8" font-weight="bold" text-anchor="middle" fill="#334155">Persatuan dalam Keberagaman</text>
  </svg>`;
  return { svg, sig: 'ppkn_unity', label: 'Ilustrasi Keberagaman Nusantara' };
}

// ---------------------------------------------------------------------------
// 9. UNIFIED CONTEXTUAL 2D RESOLVER
// ---------------------------------------------------------------------------

/**
 * Generates an accurate 2D SVG diagram/illustration strictly matching the question context & exact numbers.
 */
export function synthesizeContextual2dVisual(
  q: DynamicVisualInput,
  subject: string,
  options?: { allowGeneralScene?: boolean }
): Dynamic2dResult | null {
  const combined = `${q.stimulus || ''} ${q.question || ''}`;
  const lower = combined.toLowerCase();
  const qLower = String(q.question || '').toLowerCase();
  const normType = String(q.visualType || 'none').trim().toLowerCase();
  const subjLower = String(subject || '').toLowerCase();
  const avoidSpoiler = isSpoilerIdentificationQuestion(q.question);

  const isMath = subjLower.includes('matematika');
  const isIpas = subjLower.includes('ipas') || subjLower.includes('ipa');
  const isIndo = subjLower.includes('indonesia');
  const isPjok = subjLower.includes('pjok') || subjLower.includes('jasmani');
  const isSeni = subjLower.includes('seni');
  const isPai = subjLower.includes('agama') || subjLower.includes('pai');
  const isKoding = subjLower.includes('koding') || subjLower.includes('kecerdasan');
  const isSunda = subjLower.includes('sunda') || subjLower.includes('muatan lokal');
  const isEnglish = subjLower.includes('inggris');
  const isPancasila = subjLower.includes('pancasila') || subjLower.includes('ppkn');

  // --- A. MATH & NUMERIC DIAGRAMS (Highest Precision) ---
  const clockMatch = lower.match(/\bpukul\s+(\d{1,2})[.:](\d{2})\b/);
  const handsMatch = lower.match(/jarum\s+pendek[^0-9]{0,20}(\d{1,2})[^0-9]{0,25}jarum\s+panjang[^0-9]{0,20}(\d{1,2})/);
  if (
    normType === 'clock_0900' ||
    normType === 'clock_0200' ||
    normType === 'dynamic_clock' ||
    normType.includes('clock') ||
    (isMath && (clockMatch || handsMatch))
  ) {
    let h = normType === 'clock_0200' ? 2 : 9;
    let m = 0;
    if (clockMatch) {
      h = parseInt(clockMatch[1], 10);
      m = parseInt(clockMatch[2], 10);
    } else if (handsMatch) {
      h = parseInt(handsMatch[1], 10);
      const minHand = parseInt(handsMatch[2], 10);
      m = minHand === 12 ? 0 : (minHand % 12) * 5;
    }
    const res = buildClockSvg(h, m, avoidSpoiler);
    return {
      svg: res.svg,
      visualType: 'dynamic_clock',
      title: avoidSpoiler ? 'Gambar Jam Analog' : (q.visualTitle?.trim() || res.label),
      signature: res.sig
    };
  }

  const fracMatch = lower.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/);
  if (
    normType === 'fraction_circle' ||
    normType === 'fraction_rect' ||
    normType.includes('fraction') ||
    (isMath && fracMatch && /\b(pecahan|bagian|arsir|lingkaran|pita|pizza|kue|roti|semangka)\b/.test(lower))
  ) {
    const num = fracMatch ? parseInt(fracMatch[1], 10) : normType === 'fraction_rect' ? 3 : 2;
    const den = fracMatch ? parseInt(fracMatch[2], 10) : normType === 'fraction_rect' ? 8 : 6;
    if (den >= 2 && den <= 12 && num >= 1 && num < den) {
      const useBar = normType === 'fraction_rect' || /\b(persegi\s+panjang|pita|petak|batang)\b/.test(lower);
      const res = useBar ? buildFractionBarSvg(num, den, avoidSpoiler) : buildFractionCircleSvg(num, den, avoidSpoiler);
      return {
        svg: res.svg,
        visualType: useBar ? 'fraction_rect' : 'fraction_circle',
        title: avoidSpoiler ? 'Diagram Pecahan' : (q.visualTitle?.trim() || res.label),
        signature: res.sig
      };
    }
  }

  // Angles (Sudut X derajat)
  const angleMatch = lower.match(/\bsudut[^.?!]{0,24}?(\d{2,3})\s*(?:derajat|°)/);
  if (
    normType === 'dynamic_angle' ||
    normType === 'angle' ||
    (isMath &&
      normType !== 'shape_triangle' &&
      (angleMatch || /\b(sudut\s+siku-siku|sudut\s+lancip|sudut\s+tumpul)\b/.test(lower)))
  ) {
    const deg = angleMatch
      ? parseInt(angleMatch[1], 10)
      : lower.includes('lancip')
      ? 55
      : lower.includes('tumpul')
      ? 125
      : 90;
    const showDeg = Boolean(angleMatch);
    const res = buildAngleSvg(deg, showDeg, avoidSpoiler);
    return {
      svg: res.svg,
      visualType: 'dynamic_angle',
      title: avoidSpoiler ? 'Gambar Sudut' : (q.visualTitle?.trim() || res.label),
      signature: res.sig
    };
  }

  // Cube / Cuboid (Kubus & Balok)
  if (
    normType === 'shape_cube' ||
    normType === 'shape_cuboid' ||
    (isMath && /\b(kubus|balok)\b/.test(lower) && !/\bjaring-jaring\b/.test(lower))
  ) {
    const unit = (lower.match(/\b(cm|m|dm|mm)\b/)?.[1]) || 'cm';
    const isBalok = normType === 'shape_cuboid' || /\bbalok\b/.test(lower);
    const nums = Array.from(lower.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:cm|m|dm|mm)\b/g)).map((m) => m[1]);
    const hasMeasureIntent = nums.length > 0 || /\b(volume|luas|keliling|rusuk|panjang|lebar|tinggi)\b/.test(lower);
    const res = isBalok
      ? buildCubeOrCuboidSvg(
          true,
          nums[0] || (hasMeasureIntent && !avoidSpoiler ? '10' : null),
          nums[1] || (hasMeasureIntent && !avoidSpoiler ? '6' : null),
          nums[2] || (hasMeasureIntent && !avoidSpoiler ? '5' : null),
          unit,
          avoidSpoiler
        )
      : buildCubeOrCuboidSvg(false, nums[0] || (hasMeasureIntent && !avoidSpoiler ? '5' : null), null, null, unit, avoidSpoiler);
    return {
      svg: res.svg,
      visualType: isBalok ? 'shape_cuboid' : 'shape_cube',
      title: avoidSpoiler ? 'Gambar Bangun Ruang' : (q.visualTitle?.trim() || res.label),
      signature: res.sig
    };
  }

  // Triangle
  if (normType === 'shape_triangle' || (isMath && /\bsegitiga\b/.test(lower))) {
    const unit = (lower.match(/\b(cm|m|dm|mm)\b/)?.[1]) || 'cm';
    const alas = lower.match(/alas[^0-9]{0,14}(\d+(?:[.,]\d+)?)/)?.[1];
    const tinggi = lower.match(/tinggi[^0-9]{0,14}(\d+(?:[.,]\d+)?)/)?.[1];
    const miring = lower.match(/miring[^0-9]{0,14}(\d+(?:[.,]\d+)?)/)?.[1];
    const nums = Array.from(lower.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:cm|m|dm|mm)\b/g)).map((m) => m[1]);
    const hasNums = Boolean(alas || tinggi || nums.length > 0);
    const res = buildTriangleSvg(
      alas || nums[0] || (hasNums ? '8' : null),
      tinggi || nums[1] || (hasNums ? '6' : null),
      miring || nums[2],
      unit,
      avoidSpoiler
    );
    return {
      svg: res.svg,
      visualType: 'shape_triangle',
      title: avoidSpoiler ? 'Gambar Bangun Datar' : (q.visualTitle?.trim() || res.label),
      signature: res.sig
    };
  }

  // Circle
  if (normType === 'dynamic_circle' || (isMath && /\blingkaran\b/.test(lower) && /\b(jari-jari|diameter|keliling|luas)\b/.test(lower))) {
    const unit = (lower.match(/\b(cm|m|dm|mm)\b/)?.[1]) || 'cm';
    const num = lower.match(/\b(\d+(?:[.,]\d+)?)\s*(?:cm|m|dm|mm)\b/)?.[1] || null;
    const isDia = /\bdiameter\b/.test(lower);
    const res = buildCircleRadiusSvg(num, isDia, unit, avoidSpoiler);
    return {
      svg: res.svg,
      visualType: 'dynamic_circle',
      title: avoidSpoiler ? 'Gambar Bangun Datar' : (q.visualTitle?.trim() || res.label),
      signature: res.sig
    };
  }

  // Rectangle / Square
  if (
    normType === 'shape_rect' ||
    (isMath && /\b(persegi\s+panjang|persegi|lapangan\s+berbentuk|kebun\s+berbentuk|karton\s+berbentuk)\b/.test(lower))
  ) {
    const unit = (lower.match(/\b(cm|m|dm|mm)\b/)?.[1]) || 'cm';
    const isSquare = !/\bpersegi\s+panjang\b/.test(lower) && /\b(persegi|sisi)\b/.test(lower);
    const pMatch = lower.match(/panjang(?:nya)?[^0-9]{0,12}(\d+(?:[.,]\d+)?)/)?.[1];
    const lMatch = lower.match(/lebar(?:nya)?[^0-9]{0,12}(\d+(?:[.,]\d+)?)/)?.[1];
    const sMatch = lower.match(/sisi(?:nya)?[^0-9]{0,12}(\d+(?:[.,]\d+)?)/)?.[1];
    const nums = Array.from(lower.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:cm|m|dm|mm)\b/g)).map((m) => m[1]);
    const pVal = isSquare ? (sMatch || nums[0] || null) : (pMatch || nums[0] || null);
    const lVal = isSquare ? pVal : (lMatch || nums[1] || null);
    const res = buildRectangleSvg(pVal, lVal, unit, isSquare, avoidSpoiler);
    return {
      svg: res.svg,
      visualType: 'shape_rect',
      title: avoidSpoiler ? 'Gambar Bangun Datar' : (q.visualTitle?.trim() || res.label),
      signature: res.sig
    };
  }

  // Bar Chart
  if (normType === 'chart_bar' || (isMath && /\b(diagram\s+batang|tabel\s+data|data\s+penjualan|data\s+siswa|data\s+panen|data\s+nilai)\b/.test(lower))) {
    const pairs = Array.from(combined.matchAll(/([A-Za-zÀ-ÿ]{3,12})\s*(?:=|:|-|sebanyak)\s*(\d{1,3})/g))
      .map((m) => ({ label: m[1], value: parseInt(m[2], 10) }))
      .filter((x) => x.value > 0);
    const data = pairs.length >= 2
      ? pairs
      : [
          { label: 'Senin', value: 15 },
          { label: 'Selasa', value: 25 },
          { label: 'Rabu', value: 10 },
          { label: 'Kamis', value: 20 }
        ];
    const res = buildDynamicBarChartSvg(data);
    return { svg: res.svg, visualType: 'chart_bar', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  // Number Pattern / Sequence BEFORE Number Line!
  if (normType === 'dynamic_sequence' || (isMath && /\b(pola\s+bilangan|barisan\s+angka|kelipatan|bilangan\s+loncat)\b/.test(lower))) {
    const seqBlockMatch = combined.match(/(?:\d{1,3}|\[?\.\.\.\]?|\?)(?:\s*,\s*(?:\d{1,3}|\[?\.\.\.\]?|\?)){2,6}/);
    let cards: string[] = [];
    if (seqBlockMatch) {
      cards = seqBlockMatch[0]
        .split(',')
        .map((t) => {
          const clean = t.trim();
          return /(?:\.\.\.|\?)/.test(clean) ? '?' : clean;
        })
        .slice(0, 6);
    } else {
      const seqNums = Array.from(lower.matchAll(/\b(\d{1,3})\b/g)).map((m) => m[1]).slice(0, 4);
      cards = seqNums.length >= 3 ? [...seqNums.slice(0, 3), '?', seqNums[3] || '...'].slice(0, 5) : ['4', '8', '12', '?', '20'];
    }
    const res = buildNumberPatternSvg(cards);
    return { svg: res.svg, visualType: 'dynamic_sequence', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  // Number Line (guarded against pattern/sequence)
  if (
    normType === 'dynamic_numline' ||
    (isMath &&
      /\b(garis\s+bilangan|urutan\s+bilangan|bilangan\s+antara)\b/.test(lower) &&
      !/\b(pola\s+bilangan|barisan\s+angka|kelipatan)\b/.test(lower))
  ) {
    const nums = Array.from(lower.matchAll(/\b(\d{1,2})\b/g)).map((m) => parseInt(m[1], 10)).filter((n) => n <= 12);
    const res = buildNumberLineSvg(10, nums[0], nums[1]);
    return { svg: res.svg, visualType: 'dynamic_numline', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  // Weight / Mass Scale (Comparison vs Addition/Conversion!)
  if (normType === 'dynamic_scale' || (isMath && /\b(timbangan|lebih\s+berat|lebih\s+ringan|kilogram|kg|gram|ons)\b/.test(lower))) {
    const kgNums = Array.from(lower.matchAll(/\b(\d+(?:[.,]\d+)?\s*(?:kg|gram|ons))\b/gi)).map((m) => m[1]);
    const isComparison = /\b(lebih\s+berat|lebih\s+ringan|seimbang|sama\s+berat|dibandingkan)\b/.test(lower);
    const targetUnit = lower.match(/\b(?:dalam|satuan|menjadi)\s+(gram|kg|ons)\b/)?.[1] || (lower.includes('gram') ? 'gram' : 'kg');
    const res = isComparison
      ? buildBalanceScaleSvg(kgNums[0] || 'Benda A', kgNums[1] || 'Benda B')
      : buildDigitalWeightAdditionSvg(kgNums.length > 0 ? kgNums : ['1 kg'], targetUnit);
    return { svg: res.svg, visualType: 'dynamic_scale', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  if (normType === 'dynamic_placevalue' || (isMath && /\bpuluhan\b/.test(lower) && /\bsatuan\b/.test(lower))) {
    const t = parseInt(lower.match(/(\d)\s*puluhan/)?.[1] || '3', 10);
    const o = parseInt(lower.match(/(\d)\s*satuan/)?.[1] || '5', 10);
    const res = buildPlaceValueBlocksSvg(t, o);
    return { svg: res.svg, visualType: 'dynamic_placevalue', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  // --- B. SCIENCE 2D SCHEMATICS (IPAS) ---
  if (
    isIpas ||
    normType === 'electric_circuit' ||
    normType === 'dynamic_circuit' ||
    normType === 'magnet' ||
    normType === 'dynamic_magnet' ||
    normType === 'eclipse' ||
    normType === 'dynamic_eclipse' ||
    normType === 'dynamic_sound' ||
    normType === 'dynamic_states' ||
    normType === 'dynamic_bio' ||
    normType === 'dynamic_physics'
  ) {
    if (normType === 'dynamic_circuit' || normType === 'electric_circuit' || /\brangkaian\s+listrik|lampu\s+seri|lampu\s+paralel|sakelar\b/.test(lower)) {
      const res = buildScience2dSvg('circuit', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_circuit', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_magnet' || normType === 'magnet' || /\bmagnet\b/.test(lower)) {
      const res = buildScience2dSvg('magnet', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_magnet', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_eclipse' || normType === 'eclipse' || /\bgerhana\b/.test(lower)) {
      const res = buildScience2dSvg('eclipse', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_eclipse', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_sound' || /\bbunyi|telinga|pendengaran|suara\b/.test(lower)) {
      const res = buildScience2dSvg('sound_ear', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_sound', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_states' || /\b(perubahan\s+wujud|mencair|membeku|menguap|menyublim|mengembun)\b/.test(lower)) {
      const res = buildScience2dSvg('states_of_matter', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_states', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_bio' || isIpas) {
      if (/\b(metamorfosis|daur\s+hidup|larva|pupa|berudu)\b/.test(lower)) {
        const res = buildScience2dSvg('bio_meta', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_bio', title: res.label, signature: res.sig };
      }
      if (/\b(fotosintesis|tumbuhan|akar|batang|daun|klorofil|bunga)\b/.test(lower)) {
        const res = buildScience2dSvg('bio_photo', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_bio', title: res.label, signature: res.sig };
      }
      if (/\b(pencernaan|pernapasan|peredaran\s+darah|jantung|paru-paru|lambung|indera|mata|kulit)\b/.test(lower)) {
        const res = buildScience2dSvg('bio_organ', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_bio', title: res.label, signature: res.sig };
      }
      if (/\b(rantai\s+makanan|ekosistem|simbiosis|produsen|konsumen|adaptasi|hewan)\b/.test(lower)) {
        const res = buildScience2dSvg('bio_eco', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_bio', title: res.label, signature: res.sig };
      }
    }
    if (normType === 'dynamic_physics' || isIpas) {
      if (/\b(rotasi|revolusi|tata\s+surya|planet|matahari|bumi|bulan)\b/.test(lower)) {
        const res = buildScience2dSvg('phys_earth', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_physics', title: res.label, signature: res.sig };
      }
      if (/\b(cahaya|cermin|lensa|pelangi|bayangan|pembiasan)\b/.test(lower)) {
        const res = buildScience2dSvg('phys_light', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_physics', title: res.label, signature: res.sig };
      }
      if (/\b(gaya\s+(?:gesek|gravitasi|otot|pegas)|mendorong|menarik|gerak\s+benda)\b/.test(lower)) {
        const res = buildScience2dSvg('phys_force', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_physics', title: res.label, signature: res.sig };
      }
      if (/\b(energi|kalor|panas|konduktor|isolator|sumber\s+daya\s+alam|daur\s+air)\b/.test(lower)) {
        const res = buildScience2dSvg('phys_energy', avoidSpoiler);
        return { svg: res.svg, visualType: 'dynamic_physics', title: res.label, signature: res.sig };
      }
    }
  }

  // Allow explicit dynamic_* rehydration even if allowGeneralScene was not specified
  const isExplicitDynamicScene = normType.startsWith('dynamic_');
  if (!options?.allowGeneralScene && !isExplicitDynamicScene) {
    return null;
  }

  // Math Word-Problem fallback (when general scenes are enabled)
  if (isMath && options?.allowGeneralScene) {
    const storyRes = buildMathStoryBarSvg(combined);
    if (storyRes) {
      return {
        svg: storyRes.svg,
        visualType: 'dynamic_sequence',
        title: q.visualTitle?.trim() || storyRes.label,
        signature: storyRes.sig
      };
    }
  }

  // --- C. BAHASA SUNDA (Check cultural contexts BEFORE generic nature!) ---
  if (isSunda || normType === 'dynamic_sunda') {
    if (/\b(peuyeum|surabi|serabi|colénak|colenak|lotek|kadaharan|khas\s+sunda|jajanan|kuliner)\b/.test(lower)) {
      const res = buildSunda2dSvg('food', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_sunda', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (/\b(bébénténgan|bebentengan|oray-orayan|congklak|egrang|jajangkungan|galah\s+asin|kaulinan)\b/.test(lower)) {
      const res = buildSunda2dSvg('game', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_sunda', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (/\b(angklung|calung|suling|karinding|waditra|kacapi)\b/.test(lower)) {
      const res = buildSunda2dSvg('music', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_sunda', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (/\b(aksara\s+sunda|kaganga|ngalagena|rarangkén|rarangken)\b/.test(lower)) {
      const res = buildSunda2dSvg('aksara', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_sunda', title: res.label, signature: res.sig };
    }
    if (/\b(pupuh|guru\s+wilangan|guru\s+lagu|sisindiran|wawangsalan|biantara|dongéng|dongeng|sasakala)\b/.test(lower)) {
      const res = buildSunda2dSvg('sastra', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_sunda', title: res.label, signature: res.sig };
    }
    if (/\b(sabilulungan|leuit|imah\s+adat|julang\s+ngapak|lembur|padesaan|ngamumulé)\b/.test(lower)) {
      const res = buildSunda2dSvg('leuit', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_sunda', title: res.label, signature: res.sig };
    }
  }

  // --- D. BAHASA INGGRIS ---
  if (isEnglish || normType === 'dynamic_english') {
    if (/\b(preposition|on\s+the|under\s+the|in\s+the|behind|next\s+to|between|in\s+front\s+of|beside)\b/.test(lower)) {
      const res = buildEnglish2dSvg('preposition', q);
      return { svg: res.svg, visualType: 'dynamic_english', title: res.label, signature: res.sig };
    }
    if (/\b(sunny|rainy|cloudy|windy|weather|season|umbrella)\b/.test(lower)) {
      const res = buildEnglish2dSvg('weather', q);
      return { svg: res.svg, visualType: 'dynamic_english', title: res.label, signature: res.sig };
    }
    if (/\b(price|rupiah|thousand|how\s+much|buy|shop|canteen|market|money)\b/.test(lower)) {
      const res = buildEnglish2dSvg('shopping', q);
      return { svg: res.svg, visualType: 'dynamic_english', title: res.label, signature: res.sig };
    }
    if (/\b(food|drink|hungry|thirsty|breakfast|lunch|apple|banana|milk|fried\s+rice|bread|noodles)\b/.test(lower)) {
      const res = buildEnglish2dSvg('food', q);
      return { svg: res.svg, visualType: 'dynamic_english', title: res.label, signature: res.sig };
    }
    if (/\b(o'?clock|half\s+past|quarter|morning|afternoon|evening|daily\s+activity|wake\s+up)\b/.test(lower)) {
      const res = buildEnglish2dSvg('time', q);
      return { svg: res.svg, visualType: 'dynamic_english', title: res.label, signature: res.sig };
    }
    if (/\b(animal|zoo|giraffe|elephant|tiger|cat|bird|fish|pet)\b/.test(lower)) {
      const res = buildEnglish2dSvg('animal', q);
      return { svg: res.svg, visualType: 'dynamic_english', title: res.label, signature: res.sig };
    }
  }

  // --- E. BAHASA INDONESIA & LITERASI (Linguistic intent FIRST before background nouns!) ---
  if (isIndo || isSunda || isEnglish || normType === 'dynamic_grammar' || isExplicitDynamicScene) {
    if (
      normType === 'dynamic_grammar' ||
      /\bkata\s+tanya\b/.test(qLower) ||
      (/\[\.\.\.\]|\.\.\./.test(qLower) && /\b(kapan|siapa|mengapa|di\s+mana|bagaimana|apa|kata\s+hubung|imbuhan|awalan|kata\s+depan)\b/.test(lower))
    ) {
      const res = buildGrammar2dSvg('katatanya', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_grammar', title: res.label, signature: res.sig };
    }
    if (/\b(tanda\s+(?:petik|tanya|seru|titik|koma)|huruf\s+kapital|kalimat\s+(?:langsung|perintah|tanya|efektif))\b/.test(lower)) {
      const res = buildGrammar2dSvg('punctuation', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_grammar', title: res.label, signature: res.sig };
    }
    if (/\b(ide\s+pokok|gagasan\s+utama|kalimat\s+utama|ringkasan|kesimpulan\s+paragraf|paragraf)\b/.test(qLower)) {
      const res = buildGrammar2dSvg('paragraph', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_grammar', title: res.label, signature: res.sig };
    }
    if (/\b(majas|personifikasi|hiperbola|metafora|puisi|pantun|sajak|bait|rima|ungkapan|peribahasa)\b/.test(lower)) {
      const res = buildGrammar2dSvg('poetry', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_grammar', title: res.label, signature: res.sig };
    }
    if (/\b(formulir|daftar\s+riwayat|resensi|notula|fakta\s+dan\s+opini|kalimat\s+fakta|opini|wawancara|laporan\s+pengamatan)\b/.test(lower)) {
      const res = buildGrammar2dSvg('document', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_grammar', title: res.label, signature: res.sig };
    }

    if (normType === 'dynamic_poster' || /\b(poster|iklan|pengumuman|slogan|imbauan)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('poster', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_poster', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_notice' || /\b(rambu|papan|larangan|peringatan|notice)\b/.test(lower)) {
      const quoted = combined.match(/["“]([^"”]{4,40})["”]/)?.[1] || 'PATUHI ATURAN SEKOLAH';
      const res = buildBahasaSceneSvg('notice', quoted, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_notice', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_procedure' || /\b(petunjuk|urutan\s+langkah|cara\s+membuat|teks\s+prosedur|langkah-langkah)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('procedure', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_procedure', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_letter' || /\b(surat|undangan|kartu\s+ucapan)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('letter', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_letter', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_dialogue' || /\b(percakapan|dialog|paguneman|ungkapan\s+sopan|tolong|terima\s+kasih|maaf)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('dialogue', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_dialogue', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_denah' || /\b(denah|peta|arah\s+mata\s+angin|lalu\s+lintas|menyeberang|zebra\s+cross|jalan\s+raya)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('denah', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_denah', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_nature' || /\b(pohon|tanaman|lingkungan|kebun|hutan|sawah|desa|lembur|pantai|banjir|sampah|taman)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('nature', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_nature', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_healthy' || /\b(kebersihan|cuci\s+tangan|sehat|gizi|makanan|piket|gotong\s+royong|keluarga)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('healthy', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_healthy', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_book' || /\b(membaca|buku|cerita|fabel|dongeng|kancil|perpustakaan|bacaan|kamus|teks)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('book', q.question, avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_book', title: res.label, signature: res.sig };
    }
  }

  // --- F. PJOK (Match qLower intent first!) ---
  if (
    isPjok ||
    normType.startsWith('dynamic_pjok_') ||
    normType === 'dynamic_court'
  ) {
    if (
      normType === 'dynamic_pjok_stretch' ||
      /\b(pemanasan|pendinginan|peregangan|stretching|kelenturan|kebugaran\s+jasmani|push-?up|sit-?up)\b/.test(qLower) ||
      /\b(pemanasan|pendinginan|peregangan|stretching)\b/.test(lower)
    ) {
      const res = buildPjok2dSvg('stretch', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_stretch', title: res.label, signature: res.sig };
    }
    if (
      normType === 'dynamic_pjok_firstaid' ||
      /\b(p3k|luka\s+lecet|pertolongan\s+pertama|cuci\s+tangan|kebersihan|kuku|gigi|tidur|istirahat|gizi|cedera|memar|mimisan|narkoba|rokok)\b/.test(lower)
    ) {
      const res = buildPjok2dSvg('firstaid', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_firstaid', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pjok_badminton' || /\b(bulu\s+tangkis|badminton|shuttlecock|kok|raket|kasti|tenis\s+meja|rounders)\b/.test(lower)) {
      const res = buildPjok2dSvg('badminton', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_badminton', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pjok_mat' || /\b(senam\s+lantai|matras|sikap\s+lilin|guling\s+depan|guling\s+belakang|roll\s+depan|keseimbangan|berdiri\s+satu\s+kaki)\b/.test(lower)) {
      const res = buildPjok2dSvg('mat', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_mat', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pjok_pool' || /\b(renang|kolam|gaya\s+(?:bebas|dada|punggung)|pelampung)\b/.test(lower)) {
      const res = buildPjok2dSvg('pool', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_pool', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pjok_silat' || /\b(pencak\s+silat|kuda-kuda|elakan|tangkisan|bela\s+diri)\b/.test(lower)) {
      const res = buildPjok2dSvg('silat', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_silat', title: res.label, signature: res.sig };
    }
    if (/\bsepak\s+bola\b/.test(lower)) {
      const res = buildPjok2dSvg('soccer', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_court', title: res.label, signature: res.sig };
    }
    if (/\bbola\s+voli\b/.test(lower)) {
      const res = buildPjok2dSvg('volleyball', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_court', title: res.label, signature: res.sig };
    }
    if (/\bbola\s+basket\b/.test(lower)) {
      const res = buildPjok2dSvg('basketball', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_court', title: res.label, signature: res.sig };
    }
    if (
      normType === 'dynamic_pjok_swing' ||
      /\b(mengayun(?:kan)?\s+(?:kaki|lengan|tangan)|ayunan\s+(?:kaki|tungkai|lengan)|non-?lokomotor|menekuk|meliuk|memutar\s+badan|keseimbangan\s+statis)\b/.test(lower)
    ) {
      const res = buildPjok2dSvg('swing_leg', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_gerak', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (/\b(manipulatif|menendang\s+bola|melempar\s+bola|menangkap\s+bola|memantulkan|menggiring)\b/.test(lower)) {
      const res = buildPjok2dSvg('manipulative', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_gerak', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (/\b(lokomotor|berjalan|berlari|melompat|meloncat|berjingkat)\b/.test(lower)) {
      const res = buildPjok2dSvg('locomotor', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_gerak', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pjok_gerak' || /\b(gerak\s+dasar|aktivitas\s+gerak)\b/.test(lower)) {
      const res = buildPjok2dSvg('swing_leg', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pjok_gerak', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (/\b(lari|atletik|estafet|lompat\s+jauh|start)\b/.test(lower)) {
      const res = buildPjok2dSvg('running', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_court', title: res.label, signature: res.sig };
    }
  }

  // --- G. SENI RUPA, MUSIK, TARI & TEATER ---
  if (
    isSeni ||
    normType === 'dynamic_color' ||
    normType === 'dynamic_pattern' ||
    normType === 'dynamic_seni_elements' ||
    normType === 'dynamic_seni_collage' ||
    normType === 'dynamic_music' ||
    normType === 'dynamic_dance' ||
    normType === 'dynamic_theater'
  ) {
    if (normType === 'dynamic_music' || /\b(musik|melodi|ritmis|tempo|birama|tangga\s+nada|pentatonis|diatonis|not\s+angka|angklung|pianika|rebana|gamelan|lagu|rekorder)\b/.test(lower)) {
      const res = buildSeni2dSvg('music', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_music', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (normType === 'dynamic_dance' || /\b(tari|pola\s+lantai|wiraga|wirama|wirasa|gerak\s+tari|penari|properti\s+tari)\b/.test(lower)) {
      const res = buildSeni2dSvg('dance', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_dance', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (normType === 'dynamic_theater' || /\b(teater|pantomim|tata\s+cahaya|tata\s+rias|artikulasi|monolog|drama|pementasan|panggung)\b/.test(lower)) {
      const res = buildSeni2dSvg('theater', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_theater', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_color' || /\bwarna\s+(primer|sekunder|tersier|dasar)|campuran\s+warna|gelap\s+terang\b/.test(lower)) {
      const res = buildSeni2dSvg('color', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_color', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_seni_collage' || /\b(kolase|mozaik|montase|tempel|anyaman|gerabah|topeng|patung|diorama)\b/.test(lower)) {
      const res = buildSeni2dSvg('collage', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_seni_collage', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pattern' || /\b(motif|pola|ragam\s+hias|ornamen|dekoratif|batik|canting|flora|fauna)\b/.test(lower)) {
      const res = buildSeni2dSvg('pattern', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pattern', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (normType === 'dynamic_seni_elements' || /\b(titik|garis|bidang|bentuk|tekstur|sketsa|arsir|perspektif|komposisi|unsur\s+seni\s+rupa)\b/.test(lower)) {
      const res = buildSeni2dSvg('elements', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_seni_elements', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
  }

  // --- H. PAI (Check wudu/charity/akhlak BEFORE mosque!) ---
  if (
    isPai ||
    normType === 'dynamic_pai_wudu' ||
    normType === 'dynamic_pai_charity' ||
    normType === 'dynamic_pai_akhlak' ||
    normType === 'dynamic_mosque' ||
    normType === 'dynamic_quran'
  ) {
    if (normType === 'dynamic_pai_wudu' || /(berwud[hu]?u|\bwud[hu]?u|\bbersuci|\btayamum|\bthaharah|\bhadas|\bnajis)/.test(lower)) {
      const res = buildPai2dSvg('wudu', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pai_wudu', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pai_charity' || /\b(zakat|infak|sedekah|yatim|fakir|miskin|al-ma'?un|berbagi|dermawan)\b/.test(lower)) {
      const res = buildPai2dSvg('charity', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pai_charity', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_mosque' || /\b(masjid|salat|shalat|azan|jamaah|jumat|tarawih|idulfitri)\b/.test(lower)) {
      const res = buildPai2dSvg('mosque', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_mosque', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_quran' || /\b(al-?qur'?an|surah|ayat|mushaf|kitab|tajwid|iqra)\b/.test(lower)) {
      const res = buildPai2dSvg('quran', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_quran', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pai_akhlak' || /\b(jujur|amanah|berbakti|orang\s+tua|toleransi|ukhuwah|al-hujurat|asmaulhusna|akhlak|terpuji|nabi|rasul|malaikat|rukun\s+iman)\b/.test(lower)) {
      const res = buildPai2dSvg('akhlak', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pai_akhlak', title: avoidSpoiler ? 'Gambar Konteks Soal' : res.label, signature: res.sig };
    }
  }

  // --- I. KODING & KECERDASAN ARTIFISIAL ---
  if (isKoding || normType === 'dynamic_coding') {
    if (/\b(flowchart|diagram\s+alir|belah\s+ketupat|algoritma|langkah\s+logis|pseudocode)\b/.test(lower)) {
      const res = buildCoding2dSvg('flowchart', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_coding', title: res.label, signature: res.sig };
    }
    if (/\b(perulangan|loop(?:ing)?|repeat|ulang(?:i)?|pola\s+berulang)\b/.test(lower)) {
      const res = buildCoding2dSvg('loop', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_coding', title: res.label, signature: res.sig };
    }
    if (/\b(percabangan|if[\s-]*else|jika\s+.*\s+maka|event|variabel|skor|blok\s+kode|scratch|blockly)\b/.test(lower)) {
      const res = buildCoding2dSvg('ifelse', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_coding', title: res.label, signature: res.sig };
    }
    if (/\b(kecerdasan\s+artifisial|\bai\b|dataset|data\s+latih|prompt|sensor|pembelajaran\s+mesin|machine\s+learning|chatbot|biner|0\s+dan\s+1)\b/.test(lower)) {
      const res = buildCoding2dSvg('ai', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_coding', title: res.label, signature: res.sig };
    }
    if (/\b(sandi|password|otp|phishing|hoaks|keamanan\s+digital|privasi|jejak\s+digital|mouse|keyboard|printer|monitor|speaker|perangkat\s+(?:keras|lunak))\b/.test(lower)) {
      const res = buildCoding2dSvg('security', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_coding', title: res.label, signature: res.sig };
    }
    if (/\b(dekomposisi|abstraksi|pengenalan\s+pola|bug|debugging|kesalahan\s+program|berpikir\s+komputasional|koding|program)\b/.test(lower)) {
      const res = buildCoding2dSvg('debug', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_coding', title: res.label, signature: res.sig };
    }
  }

  // --- J. PENDIDIKAN PANCASILA ---
  if (isPancasila || normType === 'dynamic_pancasila') {
    if (/\b(musyawarah|voting|mufakat|pendapat|ketua\s+kelas|rapat|diskusi)\b/.test(lower)) {
      const res = buildPancasila2dSvg('musyawarah', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pancasila', title: res.label, signature: res.sig };
    }
    if (/\b(gotong\s+royong|kerja\s+bakti|piket|tolong\s+menolong|bersama-sama)\b/.test(lower)) {
      const res = buildPancasila2dSvg('gotong', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pancasila', title: res.label, signature: res.sig };
    }
    if (/\b(hak\s+dan\s+kewajiban|kewajiban|hak\s+anak|tata\s+tertib|aturan\s+di)\b/.test(lower)) {
      const res = buildPancasila2dSvg('balance', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pancasila', title: res.label, signature: res.sig };
    }
    if (/\b(bhinneka|keberagaman|suku|budaya|adat|bahasa\s+daerah|toleransi|persatuan)\b/.test(lower)) {
      const res = buildPancasila2dSvg('unity', avoidSpoiler);
      return { svg: res.svg, visualType: 'dynamic_pancasila', title: res.label, signature: res.sig };
    }
  }

  return null;
}
