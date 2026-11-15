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

const extractTopicLabel = (text: string, fallback: string, maxLen = 22): string => {
  const clean = String(text || '')
    .replace(/["“”]/g, ' ')
    .replace(/\b(perhatikan|amati|titénan|titenan|gambar|berikut|di\s+bawah\s+ini|di\s+atas|berdasarkan|apa|apakah|bagaimana|mengapa|yang|terdapat|pada|dalam|tentang|sebuah|suatu|untuk|dari|dengan|adalah|yaitu)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return fallback;
  const words = clean.split(' ').filter((w) => w.length >= 3).slice(0, 3);
  if (words.length === 0) return fallback;
  return clipText(words.join(' ').toUpperCase(), maxLen);
};

// ---------------------------------------------------------------------------
// 1. PARAMETERIZED 2D MATH DIAGRAMS (Reads exact numbers from question text!)
// ---------------------------------------------------------------------------

function buildClockSvg(hourRaw: number, minuteRaw: number): { svg: string; sig: string; label: string } {
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

  let diff = Math.abs(hourAngleDeg - minAngleDeg);
  if (diff > 180) diff = 360 - diff;

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const rad = toRad(i * 30);
    const x1 = (80 + 58 * Math.cos(rad)).toFixed(1);
    const y1 = (80 + 58 * Math.sin(rad)).toFixed(1);
    const x2 = (80 + 64 * Math.cos(rad)).toFixed(1);
    const y2 = (80 + 64 * Math.sin(rad)).toFixed(1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#475569" stroke-width="${i % 3 === 0 ? 2.5 : 1.3}"/>`;
  }).join('');

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
    <text x="80" y="160" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">Pukul ${hhStr}.${mmStr} (${Math.round(diff)}°)</text>
  </svg>`;

  return { svg, sig: `clock_${hhStr}_${mmStr}`, label: `Gambar Jam Analog (${Math.round(diff)}°)` };
}

function buildFractionCircleSvg(num: number, den: number): { svg: string; sig: string; label: string } {
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

  const svg = `
  <svg viewBox="0 0 160 162" width="136" height="138" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#0f172a" stroke-width="2.2"/>
    ${slices.join('')}
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0f172a"/>
    <text x="80" y="156" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#1e293b">${safeNum} bagian diarsir dari ${safeDen} bagian</text>
  </svg>`;

  return { svg, sig: `frac_circle_${safeNum}_${safeDen}`, label: `Diagram Pecahan Lingkaran` };
}

function buildFractionBarSvg(num: number, den: number): { svg: string; sig: string; label: string } {
  const safeDen = Math.max(2, Math.min(12, den));
  const safeNum = Math.max(1, Math.min(safeDen - 1, num));
  const totalW = 180;
  const cellW = totalW / safeDen;
  const cells = Array.from({ length: safeDen }, (_, i) => {
    const x = (10 + i * cellW).toFixed(2);
    const fill = i < safeNum ? '#3b82f6' : '#ffffff';
    return `<rect x="${x}" y="15" width="${cellW.toFixed(2)}" height="48" fill="${fill}" stroke="#0f172a" stroke-width="1.5"/>`;
  }).join('');

  const svg = `
  <svg viewBox="0 0 200 88" width="175" height="77" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    ${cells}
    <text x="100" y="79" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#1e293b">${safeNum} petak diarsir dari ${safeDen} petak sama besar</text>
  </svg>`;

  return { svg, sig: `frac_bar_${safeNum}_${safeDen}`, label: `Diagram Pita Pecahan` };
}

function buildRectangleSvg(pLabel: string, lLabel: string, unit = 'cm', isSquare = false): { svg: string; sig: string; label: string } {
  const w = isSquare ? 88 : 132;
  const h = isSquare ? 88 : 66;
  const x = isSquare ? 56 : 30;
  const y = 24;

  const svg = `
  <svg viewBox="0 0 210 128" width="175" height="107" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" rx="2"/>
    <rect x="${x}" y="${y}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    <rect x="${x + w - 8}" y="${y}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    <rect x="${x}" y="${y + h - 8}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    <rect x="${x + w - 8}" y="${y + h - 8}" width="8" height="8" fill="none" stroke="#0369a1" stroke-width="1.3"/>
    <text x="${x + w / 2}" y="17" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#0369a1">${isSquare ? 'Sisi' : 'Panjang'} = ${esc(pLabel)} ${esc(unit)}</text>
    ${!isSquare ? `<text x="${x + w + 16}" y="${y + h / 2}" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#0369a1" transform="rotate(90, ${x + w + 16}, ${y + h / 2})">Lebar = ${esc(lLabel)} ${esc(unit)}</text>` : ''}
    <text x="${x + w / 2}" y="${y + h + 16}" font-size="9.5" font-style="italic" text-anchor="middle" fill="#475569">${isSquare ? 'Bangun Datar Persegi' : 'Bangun Datar Persegi Panjang'}</text>
  </svg>`;

  return {
    svg,
    sig: isSquare ? `square_${pLabel}_${unit}` : `rect_${pLabel}_${lLabel}_${unit}`,
    label: isSquare ? 'Gambar Bangun Persegi' : 'Gambar Persegi Panjang'
  };
}

function buildTriangleSvg(alasLabel: string, tinggiLabel: string, miringLabel?: string, unit = 'cm'): { svg: string; sig: string; label: string } {
  const svg = `
  <svg viewBox="0 0 190 142" width="160" height="120" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <polygon points="36,110 152,110 36,24" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
    <rect x="36" y="100" width="10" height="10" fill="none" stroke="#d97706" stroke-width="1.5"/>
    <text x="94" y="128" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#b45309">Alas = ${esc(alasLabel)} ${esc(unit)}</text>
    <text x="20" y="70" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#b45309" transform="rotate(-90, 20, 70)">Tinggi = ${esc(tinggiLabel)} ${esc(unit)}</text>
    ${miringLabel ? `<text x="108" y="56" font-size="9.5" font-weight="bold" fill="#78350f">Sisi miring = ${esc(miringLabel)} ${esc(unit)}</text>` : ''}
  </svg>`;
  return { svg, sig: `tri_${alasLabel}_${tinggiLabel}_${miringLabel || 'x'}`, label: 'Gambar Segitiga Siku-Siku' };
}

function buildCubeOrCuboidSvg(isCuboid: boolean, p: string, l?: string, t?: string, unit = 'cm'): { svg: string; sig: string; label: string } {
  if (!isCuboid) {
    const svg = `
    <svg viewBox="0 0 170 144" width="145" height="122" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="32" y="50" width="68" height="68" fill="#e0e7ff" stroke="#4338ca" stroke-width="2.3"/>
      <polygon points="32,50 66,22 134,22 100,50" fill="#c7d2fe" stroke="#4338ca" stroke-width="2.3"/>
      <polygon points="100,50 134,22 134,90 100,118" fill="#a5b4fc" stroke="#4338ca" stroke-width="2.3"/>
      <text x="66" y="88" font-size="11" font-weight="bold" text-anchor="middle" fill="#312e81">s = ${esc(p)} ${esc(unit)}</text>
      <text x="84" y="136" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">Bangun Ruang Kubus</text>
    </svg>`;
    return { svg, sig: `cube_${p}_${unit}`, label: 'Bangun Ruang Kubus' };
  }

  const svg = `
  <svg viewBox="0 0 190 144" width="160" height="122" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="24" y="56" width="96" height="54" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2.3"/>
    <polygon points="24,56 58,28 154,28 120,56" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.3"/>
    <polygon points="120,56 154,28 154,82 120,110" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2.3"/>
    <text x="72" y="124" font-size="10" font-weight="bold" text-anchor="middle" fill="#1e3a8a">p = ${esc(p)} ${esc(unit)}</text>
    <text x="148" y="102" font-size="9.5" font-weight="bold" fill="#1e3a8a">l = ${esc(l || '6')} ${esc(unit)}</text>
    <text x="166" y="58" font-size="9.5" font-weight="bold" fill="#1e3a8a">t = ${esc(t || '5')} ${esc(unit)}</text>
  </svg>`;
  return { svg, sig: `cuboid_${p}_${l}_${t}`, label: 'Bangun Ruang Balok' };
}

function buildCircleRadiusSvg(val: string, isDiameter: boolean, unit = 'cm'): { svg: string; sig: string; label: string } {
  const svg = `
  <svg viewBox="0 0 170 156" width="142" height="130" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <circle cx="85" cy="74" r="56" fill="#f0fdf4" stroke="#15803d" stroke-width="2.5"/>
    <circle cx="85" cy="74" r="3.5" fill="#dc2626"/>
    ${
      isDiameter
        ? `<line x1="29" y1="74" x2="141" y2="74" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4,2"/>
           <text x="85" y="66" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#991b1b">d = ${esc(val)} ${esc(unit)}</text>`
        : `<line x1="85" y1="74" x2="141" y2="74" stroke="#dc2626" stroke-width="2.5"/>
           <text x="113" y="66" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#991b1b">r = ${esc(val)} ${esc(unit)}</text>`
    }
    <text x="85" y="147" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#166534">Bangun Datar Lingkaran</text>
  </svg>`;
  return { svg, sig: `circle_${isDiameter ? 'd' : 'r'}_${val}`, label: 'Bangun Datar Lingkaran' };
}

function buildAngleSvg(deg: number): { svg: string; sig: string; label: string } {
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
    <text x="${ox + 34}" y="${oy - 18}" font-size="10.5" font-weight="bold" fill="#b91c1c">${safeDeg}°</text>
    <text x="90" y="128" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#475569">Ilustrasi Sudut ${safeDeg}°</text>
  </svg>`;
  return { svg, sig: `angle_${safeDeg}`, label: `Ilustrasi Sudut` };
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
    <rect x="22" y="58" width="28" height="16" rx="3" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text x="36" y="69" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a">${esc(clipText(leftLabel, 8))}</text>
    <line x1="164" y1="42" x2="152" y2="74" stroke="#64748b" stroke-width="1.5"/>
    <line x1="164" y1="42" x2="176" y2="74" stroke="#64748b" stroke-width="1.5"/>
    <path d="M146,74 Q164,84 182,74 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
    <rect x="150" y="58" width="28" height="16" rx="3" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text x="164" y="69" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#14532d">${esc(clipText(rightLabel, 8))}</text>
  </svg>`;
  return { svg, sig: `scale_${leftLabel}_${rightLabel}`, label: 'Ilustrasi Pengukuran Massa' };
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
  const items = cards.slice(0, 5);
  const boxes = items
    .map((val, idx) => {
      const x = 10 + idx * 42;
      const isBlank = val === '?';
      return `
      <rect x="${x}" y="22" width="32" height="34" rx="5" fill="${isBlank ? '#fef3c7' : '#e0f2fe'}" stroke="${isBlank ? '#d97706' : '#0284c7'}" stroke-width="2" ${isBlank ? 'stroke-dasharray="3,2"' : ''}/>
      <text x="${x + 16}" y="43" font-size="11.5" font-weight="bold" text-anchor="middle" fill="${isBlank ? '#b45309' : '#0c4a6e'}">${esc(val)}</text>`;
    })
    .join('');

  const svg = `
  <svg viewBox="0 0 220 76" width="190" height="65" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    ${boxes}
    <text x="110" y="70" font-size="9" font-weight="bold" text-anchor="middle" fill="#475569">Kartu Pola Bilangan</text>
  </svg>`;
  return { svg, sig: `seq_${items.join('_')}`, label: 'Ilustrasi Pola Bilangan' };
}

// ---------------------------------------------------------------------------
// 2. CONTEXTUAL 2D SCENE ILLUSTRATIONS (Bahasa Indonesia, IPAS, PJOK, PAI, Sunda, Seni)
// ---------------------------------------------------------------------------

type BahasaSceneKind = 'poster' | 'notice' | 'procedure' | 'letter' | 'dialogue' | 'nature' | 'book' | 'denah' | 'healthy';

function buildBahasaSceneSvg(kind: BahasaSceneKind, textHint: string): { svg: string; sig: string; label: string } {
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
    return { svg, sig: 'scene_notice', label: 'Ilustrasi Papan Informasi' };
  }

  if (kind === 'procedure') {
    const topicTag = extractTopicLabel(textHint, 'LANGKAH KERJA', 24);
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
    return { svg, sig: 'scene_procedure', label: 'Alur Langkah Petunjuk' };
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
      <!-- Compass -->
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

  // poster
  const posterTopic = extractTopicLabel(textHint, 'POSTER EDUKASI', 22);
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
  return { svg, sig: 'scene_poster', label: 'Ilustrasi Poster Kontekstual' };
}

function buildScience2dSvg(kind: 'circuit' | 'magnet' | 'eclipse' | 'states_of_matter' | 'sound_ear'): { svg: string; sig: string; label: string } {
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

function buildPjokCourt2dSvg(sport: 'soccer' | 'volleyball' | 'basketball' | 'running'): { svg: string; sig: string; label: string } {
  if (sport === 'running') {
    const svg = `
    <svg viewBox="0 0 210 100" width="180" height="85" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <rect x="12" y="16" width="186" height="62" rx="30" fill="#fed7aa" stroke="#ea580c" stroke-width="2.5"/>
      <rect x="28" y="28" width="154" height="38" rx="18" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.8"/>
      <line x1="65" y1="16" x2="65" y2="28" stroke="#ffffff" stroke-width="2.5"/>
      <text x="105" y="92" font-size="9" font-weight="bold" text-anchor="middle" fill="#334155">Lintasan Lari / Atletik</text>
    </svg>`;
    return { svg, sig: 'pjok_track', label: 'Ilustrasi Lintasan Atletik' };
  }
  const bg = sport === 'soccer' ? '#22c55e' : '#fdba74';
  const stroke = sport === 'soccer' ? '#ffffff' : '#9a3412';
  const label =
    sport === 'soccer'
      ? 'Lapangan Sepak Bola'
      : sport === 'volleyball'
      ? 'Lapangan Bola Voli'
      : 'Lapangan Bola Basket';
  const svg = `
  <svg viewBox="0 0 210 112" width="180" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
    <rect x="14" y="12" width="182" height="80" rx="4" fill="${bg}" stroke="${stroke}" stroke-width="2.5"/>
    <line x1="105" y1="12" x2="105" y2="92" stroke="${stroke}" stroke-width="2"/>
    <circle cx="105" cy="52" r="14" fill="none" stroke="${stroke}" stroke-width="2"/>
    <rect x="14" y="34" width="22" height="36" fill="none" stroke="${stroke}" stroke-width="2"/>
    <rect x="174" y="34" width="22" height="36" fill="none" stroke="${stroke}" stroke-width="2"/>
    <text x="105" y="106" font-size="9" font-weight="bold" text-anchor="middle" fill="#334155">${label}</text>
  </svg>`;
  return { svg, sig: `pjok_${sport}`, label };
}

function buildSeni2dSvg(kind: 'color' | 'pattern'): { svg: string; sig: string; label: string } {
  if (kind === 'color') {
    const svg = `
    <svg viewBox="0 0 190 114" width="160" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
      <circle cx="72" cy="52" r="28" fill="#ef4444" fill-opacity="0.72"/>
      <circle cx="118" cy="52" r="28" fill="#3b82f6" fill-opacity="0.72"/>
      <circle cx="95" cy="76" r="28" fill="#facc15" fill-opacity="0.72"/>
      <text x="95" y="110" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#334155">Lingkaran Warna Dasar &amp; Sekunder</text>
    </svg>`;
    return { svg, sig: 'seni_colors', label: 'Ilustrasi Pencampuran Warna' };
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
    <text x="90" y="102" font-size="9" font-weight="bold" text-anchor="middle" fill="#7c2d12">Pola Ragam Hias Geometris</text>
  </svg>`;
  return { svg, sig: 'seni_pattern', label: 'Ilustrasi Ragam Hias 2D' };
}

function buildPai2dSvg(kind: 'mosque' | 'quran'): { svg: string; sig: string; label: string } {
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
// 3. UNIFIED CONTEXTUAL 2D RESOLVER
// ---------------------------------------------------------------------------

/**
 * Generates an accurate 2D SVG diagram/illustration strictly matching the question context & exact numbers.
 * Used when:
 * - Question is Mathematics / labeled Science schematic, OR
 * - Question asks for visual observation or benefits from a 2D diagram and internet search had no relevant match.
 */
export function synthesizeContextual2dVisual(
  q: DynamicVisualInput,
  subject: string,
  options?: { allowGeneralScene?: boolean }
): Dynamic2dResult | null {
  const combined = `${q.stimulus || ''} ${q.question || ''}`;
  const lower = combined.toLowerCase();
  const normType = String(q.visualType || 'none').trim().toLowerCase();
  const subjLower = String(subject || '').toLowerCase();
  const isMath = subjLower.includes('matematika');
  const isIpas = subjLower.includes('ipas') || subjLower.includes('ipa');
  const isIndo = subjLower.includes('indonesia');
  const isPjok = subjLower.includes('pjok') || subjLower.includes('jasmani');
  const isSeni = subjLower.includes('seni');
  const isPai = subjLower.includes('agama') || subjLower.includes('pai');

  // --- A. MATH & NUMERIC DIAGRAMS (Highest Precision) ---
  const clockMatch = lower.match(/\bpukul\s+(\d{1,2})[.:](\d{2})\b/);
  if (
    normType === 'clock_0900' ||
    normType === 'clock_0200' ||
    normType === 'dynamic_clock' ||
    normType.includes('clock') ||
    (isMath && clockMatch)
  ) {
    const h = clockMatch ? parseInt(clockMatch[1], 10) : normType === 'clock_0200' ? 2 : 9;
    const m = clockMatch ? parseInt(clockMatch[2], 10) : 0;
    const res = buildClockSvg(h, m);
    return { svg: res.svg, visualType: 'dynamic_clock', title: q.visualTitle?.trim() || res.label, signature: res.sig };
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
      const res = useBar ? buildFractionBarSvg(num, den) : buildFractionCircleSvg(num, den);
      return { svg: res.svg, visualType: useBar ? 'fraction_rect' : 'fraction_circle', title: q.visualTitle?.trim() || res.label, signature: res.sig };
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
    const res = buildAngleSvg(deg);
    return { svg: res.svg, visualType: 'dynamic_angle', title: q.visualTitle?.trim() || res.label, signature: res.sig };
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
    const res = isBalok
      ? buildCubeOrCuboidSvg(true, nums[0] || '10', nums[1] || '6', nums[2] || '5', unit)
      : buildCubeOrCuboidSvg(false, nums[0] || '5', undefined, undefined, unit);
    return { svg: res.svg, visualType: isBalok ? 'shape_cuboid' : 'shape_cube', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  // Triangle
  if (normType === 'shape_triangle' || (isMath && /\bsegitiga\b/.test(lower))) {
    const unit = (lower.match(/\b(cm|m|dm|mm)\b/)?.[1]) || 'cm';
    const alas = lower.match(/alas[^0-9]{0,14}(\d+(?:[.,]\d+)?)/)?.[1];
    const tinggi = lower.match(/tinggi[^0-9]{0,14}(\d+(?:[.,]\d+)?)/)?.[1];
    const miring = lower.match(/miring[^0-9]{0,14}(\d+(?:[.,]\d+)?)/)?.[1];
    const nums = Array.from(lower.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:cm|m|dm|mm)\b/g)).map((m) => m[1]);
    const res = buildTriangleSvg(alas || nums[0] || '8', tinggi || nums[1] || '6', miring || nums[2], unit);
    return { svg: res.svg, visualType: 'shape_triangle', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  // Circle
  if (normType === 'dynamic_circle' || (isMath && /\blingkaran\b/.test(lower) && /\b(jari-jari|diameter|keliling|luas)\b/.test(lower))) {
    const unit = (lower.match(/\b(cm|m|dm|mm)\b/)?.[1]) || 'cm';
    const num = lower.match(/\b(\d+(?:[.,]\d+)?)\s*(?:cm|m|dm|mm)\b/)?.[1] || '7';
    const isDia = /\bdiameter\b/.test(lower);
    const res = buildCircleRadiusSvg(num, isDia, unit);
    return { svg: res.svg, visualType: 'dynamic_circle', title: q.visualTitle?.trim() || res.label, signature: res.sig };
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
    const pVal = isSquare ? (sMatch || nums[0] || '8') : (pMatch || nums[0] || '12');
    const lVal = isSquare ? pVal : (lMatch || nums[1] || '6');
    const res = buildRectangleSvg(pVal, lVal, unit, isSquare);
    return { svg: res.svg, visualType: 'shape_rect', title: q.visualTitle?.trim() || res.label, signature: res.sig };
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

  // Number Line / Scale / Place Value / Sequence for early & middle math
  if (normType === 'dynamic_numline' || (isMath && /\b(garis\s+bilangan|urutan\s+bilangan|bilangan\s+antara)\b/.test(lower))) {
    const nums = Array.from(lower.matchAll(/\b(\d{1,2})\b/g)).map((m) => parseInt(m[1], 10)).filter((n) => n <= 12);
    const res = buildNumberLineSvg(10, nums[0], nums[1]);
    return { svg: res.svg, visualType: 'dynamic_numline', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  if (normType === 'dynamic_scale' || (isMath && /\b(timbangan|lebih\s+berat|lebih\s+ringan|kilogram|kg|ons)\b/.test(lower))) {
    const kgNums = Array.from(lower.matchAll(/\b(\d+(?:[.,]\d+)?\s*(?:kg|gram|ons))\b/gi)).map((m) => m[1]);
    const res = buildBalanceScaleSvg(kgNums[0] || 'A', kgNums[1] || 'B');
    return { svg: res.svg, visualType: 'dynamic_scale', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  if (normType === 'dynamic_placevalue' || (isMath && /\bpuluhan\b/.test(lower) && /\bsatuan\b/.test(lower))) {
    const t = parseInt(lower.match(/(\d)\s*puluhan/)?.[1] || '3', 10);
    const o = parseInt(lower.match(/(\d)\s*satuan/)?.[1] || '5', 10);
    const res = buildPlaceValueBlocksSvg(t, o);
    return { svg: res.svg, visualType: 'dynamic_placevalue', title: q.visualTitle?.trim() || res.label, signature: res.sig };
  }

  if (normType === 'dynamic_sequence' || (isMath && /\b(pola\s+bilangan|barisan\s+angka|kelipatan)\b/.test(lower))) {
    const seqNums = Array.from(lower.matchAll(/\b(\d{1,3})\b/g)).map((m) => m[1]).slice(0, 4);
    const cards = seqNums.length >= 3 ? [...seqNums.slice(0, 3), '?', seqNums[3] || '...'].slice(0, 5) : ['4', '8', '12', '?', '20'];
    const res = buildNumberPatternSvg(cards);
    return { svg: res.svg, visualType: 'dynamic_sequence', title: q.visualTitle?.trim() || res.label, signature: res.sig };
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
    normType === 'dynamic_states'
  ) {
    if (normType === 'dynamic_circuit' || normType === 'electric_circuit' || /\brangkaian\s+listrik|lampu\s+seri|lampu\s+paralel|sakelar\b/.test(lower)) {
      const res = buildScience2dSvg('circuit');
      return { svg: res.svg, visualType: 'dynamic_circuit', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_magnet' || normType === 'magnet' || /\bmagnet\b/.test(lower)) {
      const res = buildScience2dSvg('magnet');
      return { svg: res.svg, visualType: 'dynamic_magnet', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_eclipse' || normType === 'eclipse' || /\bgerhana\b/.test(lower)) {
      const res = buildScience2dSvg('eclipse');
      return { svg: res.svg, visualType: 'dynamic_eclipse', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_sound' || /\bbunyi|telinga|pendengaran|suara\b/.test(lower)) {
      const res = buildScience2dSvg('sound_ear');
      return { svg: res.svg, visualType: 'dynamic_sound', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_states' || /\b(perubahan\s+wujud|mencair|membeku|menguap|menyublim|mengembun)\b/.test(lower)) {
      const res = buildScience2dSvg('states_of_matter');
      return { svg: res.svg, visualType: 'dynamic_states', title: res.label, signature: res.sig };
    }
  }

  // Allow explicit dynamic_* rehydration even if allowGeneralScene was not specified
  const isExplicitDynamicScene = normType.startsWith('dynamic_');
  if (!options?.allowGeneralScene && !isExplicitDynamicScene) {
    return null;
  }

  // --- C. GENERAL CONTEXTUAL 2D SCENES (Bahasa, Sunda, Inggris, PJOK, Seni, PAI) ---
  if (isIndo || subjLower.includes('sunda') || subjLower.includes('inggris') || isExplicitDynamicScene) {
    if (normType === 'dynamic_poster' || /\b(poster|iklan|pengumuman|slogan|imbauan)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('poster', q.question);
      return { svg: res.svg, visualType: 'dynamic_poster', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_notice' || /\b(rambu|papan|larangan|peringatan|notice|kalimat\s+perintah)\b/.test(lower)) {
      const quoted = combined.match(/["“]([^"”]{4,40})["”]/)?.[1] || 'PATUHI ATURAN SEKOLAH';
      const res = buildBahasaSceneSvg('notice', quoted);
      return { svg: res.svg, visualType: 'dynamic_notice', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_procedure' || /\b(petunjuk|urutan|langkah|membuat|cara\s+membuat|prosedur)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('procedure', q.question);
      return { svg: res.svg, visualType: 'dynamic_procedure', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_letter' || /\b(surat|undangan|kartu)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('letter', q.question);
      return { svg: res.svg, visualType: 'dynamic_letter', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_dialogue' || /\b(percakapan|dialog|paguneman|bertanya|ungkapan\s+sopan|tolong|terima\s+kasih|maaf)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('dialogue', q.question);
      return { svg: res.svg, visualType: 'dynamic_dialogue', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_denah' || /\b(denah|peta|arah\s+mata\s+angin|lalu\s+lintas|menyeberang|zebra\s+cross|jalan\s+raya)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('denah', q.question);
      return { svg: res.svg, visualType: 'dynamic_denah', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_nature' || /\b(pohon|tanaman|lingkungan|kebun|hutan|sawah|desa|lembur|pantai|banjir|sampah|taman)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('nature', q.question);
      return { svg: res.svg, visualType: 'dynamic_nature', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_healthy' || /\b(kebersihan|cuci\s+tangan|sehat|gizi|makanan|piket|gotong\s+royong|keluarga)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('healthy', q.question);
      return { svg: res.svg, visualType: 'dynamic_healthy', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_book' || /\b(membaca|buku|cerita|fabel|dongeng|kancil|perpustakaan|puisi|pantun|bacaan|paragraf|ide\s+pokok|kamus)\b/.test(lower)) {
      const res = buildBahasaSceneSvg('book', q.question);
      return { svg: res.svg, visualType: 'dynamic_book', title: res.label, signature: res.sig };
    }
  }

  if (isPjok || normType === 'dynamic_court') {
    if (/\bsepak\s+bola\b/.test(lower)) return { ...buildPjokCourt2dSvg('soccer'), visualType: 'dynamic_court', title: 'Lapangan Sepak Bola', signature: 'pjok_soccer' };
    if (/\bbola\s+voli\b/.test(lower)) return { ...buildPjokCourt2dSvg('volleyball'), visualType: 'dynamic_court', title: 'Lapangan Bola Voli', signature: 'pjok_volleyball' };
    if (/\bbola\s+basket\b/.test(lower)) return { ...buildPjokCourt2dSvg('basketball'), visualType: 'dynamic_court', title: 'Lapangan Bola Basket', signature: 'pjok_basketball' };
    if (/\b(lari|atletik|estafet|lokomotor)\b/.test(lower)) return { ...buildPjokCourt2dSvg('running'), visualType: 'dynamic_court', title: 'Lintasan Lari Atletik', signature: 'pjok_running' };
  }

  if (isSeni || normType === 'dynamic_color' || normType === 'dynamic_pattern') {
    if (normType === 'dynamic_color' || /\bwarna\s+(primer|sekunder|dasar)|campuran\s+warna\b/.test(lower)) {
      const res = buildSeni2dSvg('color');
      return { svg: res.svg, visualType: 'dynamic_color', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_pattern' || /\b(motif|pola|ragam\s+hias|ornamen|dekoratif|batik|gerabah|anyaman)\b/.test(lower)) {
      const res = buildSeni2dSvg('pattern');
      return { svg: res.svg, visualType: 'dynamic_pattern', title: res.label, signature: res.sig };
    }
  }

  if (isPai || normType === 'dynamic_mosque' || normType === 'dynamic_quran') {
    if (normType === 'dynamic_mosque' || /\b(masjid|salat|shalat|azan|jamaah)\b/.test(lower)) {
      const res = buildPai2dSvg('mosque');
      return { svg: res.svg, visualType: 'dynamic_mosque', title: res.label, signature: res.sig };
    }
    if (normType === 'dynamic_quran' || /\b(al-?qur'?an|surah|ayat|mushaf|kitab)\b/.test(lower)) {
      const res = buildPai2dSvg('quran');
      return { svg: res.svg, visualType: 'dynamic_quran', title: res.label, signature: res.sig };
    }
  }

  return null;
}
