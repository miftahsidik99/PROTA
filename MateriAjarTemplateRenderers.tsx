import React, { useState } from 'react';
import { GeneratedMateriAjarData } from './materiAjarHelper';

interface RendererProps {
    data: GeneratedMateriAjarData;
    isPrintMode?: boolean;
}

export const PosterIllustrationFrame: React.FC<{ data: GeneratedMateriAjarData; accentHex?: string }> = ({
    data,
    accentHex = '#0f766e'
}) => {
    const [imgFailed, setImgFailed] = useState(false);
    const hasProxiedImage = Boolean(data.visualImageDataUrl) && !imgFailed;
    const svgMarkup = (data.visualSvg || '').trim();
    const caption = data.visualCaption || `Ilustrasi Pendukung: ${data.title}`;

    return (
        <div
            className="rounded-2xl border-2 bg-white overflow-hidden"
            style={{ borderColor: accentHex }}
        >
            <div className="px-3.5 py-2 flex items-center justify-between gap-2 text-[11px] font-bold text-white" style={{ backgroundColor: accentHex }}>
                <span>Ilustrasi Pendukung Konsep</span>
                <span className="font-medium opacity-90">{data.subject} · {data.className}</span>
            </div>

            <div className="p-3 bg-slate-50/70 space-y-2.5">
                {hasProxiedImage ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center max-h-48">
                            <img
                                src={data.visualImageDataUrl}
                                alt={caption}
                                referrerPolicy="no-referrer"
                                onError={() => setImgFailed(true)}
                                className="w-full h-44 object-contain bg-white"
                            />
                        </div>
                        {svgMarkup ? (
                            <div
                                className="rounded-xl overflow-hidden border border-slate-200 bg-white p-1.5"
                                dangerouslySetInnerHTML={{ __html: svgMarkup }}
                            />
                        ) : null}
                    </div>
                ) : svgMarkup ? (
                    <div
                        className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2 max-w-[540px] mx-auto"
                        dangerouslySetInnerHTML={{ __html: svgMarkup }}
                    />
                ) : (
                    <svg viewBox="0 0 460 150" width="460" height="150" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl border border-slate-200 bg-sky-50">
                        <rect x="0" y="0" width="460" height="150" rx="12" fill="#f0f9ff" />
                        <rect x="0" y="114" width="460" height="36" fill="#bae6fd" />
                        <rect x="135" y="28" width="190" height="78" rx="10" fill="#ffffff" stroke={accentHex} strokeWidth="2" />
                        <rect x="150" y="42" width="76" height="50" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                        <rect x="234" y="42" width="76" height="50" rx="6" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
                        <circle cx="90" cy="84" r="14" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.5" />
                        <path d="M 72 114 C 72 98, 108 98, 108 114 Z" fill="#2563eb" />
                        <circle cx="370" cy="84" r="14" fill="#fde68a" stroke="#92400e" strokeWidth="1.5" />
                        <path d="M 352 114 C 352 98, 388 98, 388 114 Z" fill="#059669" />
                    </svg>
                )}

                <div className="text-[11px] font-semibold text-slate-700 text-center leading-snug px-2">
                    {caption}
                </div>
            </div>
        </div>
    );
};

export const EducationalInfographicView: React.FC<RendererProps> = ({ data }) => {
    const info = data.infographicData;
    if (!info) return null;

    const accents = ['#0f766e', '#0369a1', '#6d28d9', '#b45309'];

    return (
        <div className="space-y-3">
            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(info.pillars || []).map((pillar, idx) => {
                    const accent = accents[idx % accents.length];
                    return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span
                                        className="w-6 h-6 rounded-lg text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums"
                                        style={{ backgroundColor: accent }}
                                    >
                                        {pillar.number}
                                    </span>
                                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{pillar.title}</h4>
                                </div>
                                <p className="text-[11.5px] text-slate-700 leading-relaxed">{pillar.summary}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 space-y-0.5">
                                <div className="text-[10.5px] font-bold text-slate-800">Fakta Kunci: <span className="font-normal text-slate-600">{pillar.keyFact}</span></div>
                                <div className="text-[10.5px] font-bold text-teal-800">Contoh: <span className="font-normal text-slate-600">{pillar.example}</span></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {info.goldenTakeaway && (
                <div data-pdf-block="true" className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <div className="text-[11px] font-bold text-teal-900">Pesan Kunci Infografis</div>
                        <p className="text-[11.5px] text-teal-900/90 leading-relaxed">{info.goldenTakeaway}</p>
                    </div>
                    <div className="bg-white border border-teal-200 rounded-xl px-3 py-1.5 text-left sm:text-right shrink-0">
                        <div className="text-[10px] text-teal-700 font-semibold">{info.heroStatLabel}</div>
                        <div className="text-xs font-extrabold text-teal-950 tabular-nums">{info.heroStatValue}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const CheatSheetView: React.FC<RendererProps> = ({ data }) => {
    const cs = data.cheatSheetData;
    if (!cs) return null;

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-blue-950 text-white rounded-2xl p-4 border border-blue-800">
                <div className="text-[11px] font-semibold text-blue-200">
                    Cheat Sheet · Lembar Referensi Cepat {data.subject}
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{data.title}</h3>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">{cs.quickOverview}</p>
            </div>

            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(cs.boxes || []).map((box, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <h4 className="font-bold text-sm text-slate-900">{box.title}</h4>
                            <span className="text-[11px] font-semibold text-blue-700 shrink-0">{box.category}</span>
                        </div>
                        {box.formulaOrRule && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-950 font-mono">
                                {box.formulaOrRule}
                            </div>
                        )}
                        <ul className="space-y-1.5">
                            {(box.items || []).map((item, i) => (
                                <li key={i} className="text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                                    <span className="text-blue-600 font-bold shrink-0 tabular-nums">{i + 1}.</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div data-pdf-block="true" className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-900 mb-2.5">Ceklis Anti-Keliru (Kesalahan Umum vs Cara Tepat)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(cs.commonMistakes || []).map((cm, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                            <div className="text-xs text-rose-700 font-semibold">Hindari: {cm.mistake}</div>
                            <div className="text-xs text-emerald-800 font-semibold">Lakukan: {cm.correction}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const StickyNotesView: React.FC<RendererProps> = ({ data }) => {
    const sn = data.stickyNotesData;
    if (!sn) return null;

    const palette: Record<string, { bg: string; border: string; title: string; pin: string }> = {
        amber: { bg: '#fef9c3', border: '#fde047', title: '#713f12', pin: '#ca8a04' },
        sky: { bg: '#e0f2fe', border: '#7dd3fc', title: '#0c4a6e', pin: '#0284c7' },
        emerald: { bg: '#d1fae5', border: '#6ee7b7', title: '#064e3b', pin: '#059669' },
        rose: { bg: '#ffe4e6', border: '#fda4af', title: '#881337', pin: '#e11d48' },
        violet: { bg: '#ede9fe', border: '#c4b5fd', title: '#4c1d95', pin: '#7c3aed' }
    };

    return (
        <div data-pdf-block="true" className="bg-slate-100 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                    <div className="text-[11px] font-semibold text-slate-500">Papan Catatan Penting · Sticky Notes</div>
                    <h3 className="text-base font-bold text-slate-900">{sn.boardTopic}</h3>
                </div>
                <div className="text-xs font-medium text-slate-600">{sn.notes.length} Kartu Catatan</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(sn.notes || []).map((note, idx) => {
                    const style = palette[note.colorTheme] || palette.amber;
                    return (
                        <div
                            key={idx}
                            className="rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm"
                            style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[11px] font-bold" style={{ color: style.pin }}>{note.tag}</span>
                                    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="8" cy="8" r="6" fill={style.pin} />
                                        <circle cx="6.5" cy="6.5" r="2" fill="#ffffff" opacity="0.6" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-sm mb-1.5" style={{ color: style.title }}>{note.title}</h4>
                                <p className="text-xs text-slate-800 leading-relaxed">{note.content}</p>
                            </div>
                            <div className="pt-2 border-t border-black/10 text-[11px] font-semibold text-slate-700">
                                Pengingat: {note.reminder}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const MindMapView: React.FC<RendererProps> = ({ data }) => {
    const mm = data.mindMapData;
    if (!mm) return null;

    const branches = (mm.branches || []).slice(0, 6);
    const width = 720;
    const height = 390;
    const cx = width / 2;
    const cy = height / 2;

    const positions = [
        { x: 140, y: 74, align: 'end' as const },
        { x: 580, y: 74, align: 'start' as const },
        { x: 120, y: 205, align: 'end' as const },
        { x: 600, y: 205, align: 'start' as const },
        { x: 185, y: 332, align: 'end' as const },
        { x: 535, y: 332, align: 'start' as const }
    ];

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                        <div className="text-[11px] font-semibold text-slate-500">Pemetaan Konsep Visual · Mind Map</div>
                        <h3 className="text-base font-bold text-slate-900">{mm.centralNode}</h3>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{mm.centralSubtitle}</span>
                </div>

                <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block bg-slate-50/60 rounded-xl border border-slate-200">
                    {/* Branches */}
                    {branches.map((branch, idx) => {
                        const pos = positions[idx % positions.length];
                        const ctrlX = (cx + pos.x) / 2;
                        const color = branch.colorHex || '#4f46e5';
                        const boxW = 196;
                        const boxH = 68;
                        const boxX = pos.x - boxW / 2;
                        const boxY = pos.y - boxH / 2;
                        const shortTitle = branch.title.length > 26 ? branch.title.slice(0, 24) + '…' : branch.title;
                        const kwLine = (branch.keywords || []).slice(0, 3).join(' · ');
                        const shortKw = kwLine.length > 30 ? kwLine.slice(0, 28) + '…' : kwLine;

                        return (
                            <g key={idx}>
                                <path
                                    d={`M ${cx} ${cy} Q ${ctrlX} ${pos.y}, ${pos.x} ${pos.y}`}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="3"
                                    opacity="0.8"
                                />
                                <rect
                                    x={boxX}
                                    y={boxY}
                                    width={boxW}
                                    height={boxH}
                                    rx="12"
                                    fill="#ffffff"
                                    stroke={color}
                                    strokeWidth="2"
                                />
                                <rect x={boxX} y={boxY} width={boxW} height="22" rx="10" fill={color} />
                                <text x={pos.x} y={boxY + 15} fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#ffffff">
                                    {shortTitle}
                                </text>
                                <text x={pos.x} y={boxY + 42} fontSize="9.5" fontWeight="600" textAnchor="middle" fill="#334155">
                                    {shortKw}
                                </text>
                                <text x={pos.x} y={boxY + 57} fontSize="8.5" textAnchor="middle" fill="#64748b">
                                    Cabang Konsep #{idx + 1}
                                </text>
                            </g>
                        );
                    })}

                    {/* Central Node */}
                    <rect x={cx - 108} y={cy - 44} width="216" height="88" rx="18" fill="#1e1b4b" stroke="#6366f1" strokeWidth="3" />
                    <text x={cx} y={cy - 14} fontSize="10" fontWeight="700" textAnchor="middle" fill="#a5b4fc">
                        TOPIK UTAMA
                    </text>
                    <text x={cx} y={cy + 8} fontSize="12" fontWeight="800" textAnchor="middle" fill="#ffffff">
                        {mm.centralNode.length > 28 ? mm.centralNode.slice(0, 26) + '…' : mm.centralNode}
                    </text>
                    <text x={cx} y={cy + 27} fontSize="9" textAnchor="middle" fill="#e0e7ff">
                        {mm.centralSubtitle}
                    </text>
                </svg>
            </div>

            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {branches.map((b, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: b.colorHex || '#4f46e5' }} />
                            <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{b.explanation}</p>
                        <div className="text-[11px] font-medium text-slate-500">
                            Kata kunci: {(b.keywords || []).join(' · ')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ComicCharacterSvg: React.FC<{ mood: string; leftName: string; rightName?: string }> = ({ mood, leftName, rightName }) => {
    const bgColor =
        mood === 'eureka' ? '#fef9c3' : mood === 'curious' ? '#e0f2fe' : mood === 'explain' ? '#ecfdf5' : '#fdf2f8';
    const leftInitial = (leftName || 'A').charAt(0).toUpperCase();
    const rightInitial = (rightName || 'B').charAt(0).toUpperCase();

    return (
        <svg viewBox="0 0 300 108" width="300" height="108" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg border border-slate-200">
            <rect x="0" y="0" width="300" height="108" fill={bgColor} />
            {/* Classroom / ground strip */}
            <rect x="0" y="84" width="300" height="24" fill="#cbd5e1" opacity="0.45" />
            {/* Chalkboard subtle backdrop */}
            <rect x="95" y="12" width="110" height="44" rx="4" fill="#065f46" stroke="#b45309" strokeWidth="2.5" opacity="0.85" />
            <line x1="110" y1="26" x2="188" y2="26" stroke="#a7f3d0" strokeWidth="2" />
            <line x1="110" y1="38" x2="170" y2="38" stroke="#fde68a" strokeWidth="2" />

            {/* Left Character */}
            <g transform="translate(56, 36)">
                <path d="M -18 48 C -18 28, 18 28, 18 48 Z" fill="#2563eb" />
                <circle cx="0" cy="14" r="16" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.5" />
                <path d="M -15 10 C -12 -6, 14 -6, 15 10 C 6 4, -6 4, -15 10 Z" fill="#1e293b" />
                <circle cx="-5" cy="13" r="1.8" fill="#0f172a" />
                <circle cx="5" cy="13" r="1.8" fill="#0f172a" />
                <path d={mood === 'curious' ? 'M -4 21 Q 0 19 4 21' : 'M -5 19 Q 0 24 5 19'} fill="none" stroke="#9a3412" strokeWidth="1.6" />
                <text x="0" y="44" fontSize="9" fontWeight="700" textAnchor="middle" fill="#ffffff">{leftInitial}</text>
            </g>

            {/* Right Character */}
            {rightName && (
                <g transform="translate(244, 36)">
                    <path d="M -18 48 C -18 28, 18 28, 18 48 Z" fill="#059669" />
                    <circle cx="0" cy="14" r="16" fill="#fde68a" stroke="#92400e" strokeWidth="1.5" />
                    <path d="M -16 12 C -14 -7, 14 -7, 16 12 C 8 2, -8 2, -16 12 Z" fill="#334155" />
                    <circle cx="-5" cy="13" r="1.8" fill="#0f172a" />
                    <circle cx="5" cy="13" r="1.8" fill="#0f172a" />
                    <path d="M -5 19 Q 0 24 5 19" fill="none" stroke="#92400e" strokeWidth="1.6" />
                    <text x="0" y="44" fontSize="9" fontWeight="700" textAnchor="middle" fill="#ffffff">{rightInitial}</text>
                </g>
            )}

            {/* Mood Icon */}
            {mood === 'eureka' && (
                <g transform="translate(150, 72)">
                    <circle cx="0" cy="0" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                    <text x="0" y="4" fontSize="11" fontWeight="800" textAnchor="middle" fill="#713f12">!</text>
                </g>
            )}
            {mood === 'curious' && (
                <g transform="translate(150, 72)">
                    <circle cx="0" cy="0" r="10" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                    <text x="0" y="4" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0284c7">?</text>
                </g>
            )}
        </svg>
    );
};

export const ComicStripView: React.FC<RendererProps> = ({ data }) => {
    const cs = data.comicStripData;
    if (!cs) return null;

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-rose-900 text-white rounded-2xl p-4">
                <div className="text-[11px] font-semibold text-rose-200">Komik Edukasi · {cs.setting}</div>
                <h3 className="text-lg font-bold text-white mt-0.5">{cs.storyTitle}</h3>
            </div>

            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(cs.panels || []).map((panel) => (
                    <div key={panel.panelNo} className="bg-white border-2 border-slate-800 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                                <span>Panel {panel.panelNo}: {panel.sceneTitle}</span>
                                <span className="text-[11px] text-rose-700 font-semibold">{panel.characterLeft}{panel.characterRight ? ` & ${panel.characterRight}` : ''}</span>
                            </div>

                            <ComicCharacterSvg mood={panel.mood} leftName={panel.characterLeft} rightName={panel.characterRight} />

                            <div className="space-y-2">
                                <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 text-xs text-slate-800">
                                    <span className="font-bold text-sky-900">{panel.characterLeft}: </span>
                                    <span>&ldquo;{panel.dialogueLeft}&rdquo;</span>
                                </div>
                                {panel.dialogueRight && panel.characterRight && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-slate-800">
                                        <span className="font-bold text-emerald-900">{panel.characterRight}: </span>
                                        <span>&ldquo;{panel.dialogueRight}&rdquo;</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-950 font-medium">
                            {panel.narration}
                        </div>
                    </div>
                ))}
            </div>

            <div data-pdf-block="true" className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-rose-900 mb-1">Pesan Pembelajaran dari Cerita</div>
                <p className="text-xs text-rose-950 leading-relaxed">{cs.moralLesson}</p>
            </div>
        </div>
    );
};

export const FlashcardView: React.FC<RendererProps> = ({ data, isPrintMode = false }) => {
    const fc = data.flashcardData;
    const [flippedMap, setFlippedMap] = useState<Record<number, boolean>>({});
    if (!fc) return null;

    const toggleFlip = (no: number) => {
        setFlippedMap(prev => ({ ...prev, [no]: !prev[no] }));
    };

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-emerald-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-[11px] font-semibold text-emerald-200">Dek Kartu Belajar · Flashcard PPA</div>
                    <h3 className="text-lg font-bold text-white mt-0.5">{fc.deckTitle}</h3>
                </div>
                <p className="text-xs text-emerald-100 max-w-md">{fc.studyTip}</p>
            </div>

            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(fc.cards || []).map((card) => {
                    const isFlipped = !!flippedMap[card.cardNo];
                    if (isPrintMode) {
                        return (
                            <div key={card.cardNo} className="border-2 border-dashed border-slate-400 rounded-2xl overflow-hidden bg-white">
                                <div className="grid grid-cols-2 divide-x divide-dashed divide-slate-400">
                                    <div className="p-3.5 bg-emerald-50/60 space-y-1.5">
                                        <div className="text-[10px] font-bold text-emerald-800">
                                            KARTU #{card.cardNo} DEPAN · {card.category}
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 leading-relaxed">{card.frontPrompt}</p>
                                        <div className="text-[10.5px] text-slate-600">Petunjuk: {card.hint}</div>
                                    </div>
                                    <div className="p-3.5 bg-white space-y-1.5">
                                        <div className="text-[10px] font-bold text-slate-500">SISI BELAKANG (LIPAT &amp; GUNTING)</div>
                                        <p className="text-xs text-slate-800 leading-relaxed">{card.backAnswer}</p>
                                        <div className="text-[10.5px] text-emerald-700 font-medium">Contoh: {card.realExample}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={card.cardNo}
                            onClick={() => toggleFlip(card.cardNo)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleFlip(card.cardNo);
                                }
                            }}
                            className={`rounded-2xl border p-4 cursor-pointer transition-colors min-h-[156px] flex flex-col justify-between ${
                                isFlipped
                                    ? 'bg-emerald-50 border-emerald-400'
                                    : 'bg-white border-slate-200 hover:border-emerald-400'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                                    <span className="text-emerald-700">Kartu #{card.cardNo} · {card.category}</span>
                                    <span className="text-slate-500">{isFlipped ? 'Sisi Jawaban' : 'Klik untuk Balik'}</span>
                                </div>
                                {!isFlipped ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-slate-900 leading-snug">{card.frontPrompt}</p>
                                        <p className="text-xs text-slate-500">Petunjuk: {card.hint}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-900 leading-relaxed">{card.backAnswer}</p>
                                        <p className="text-[11px] text-emerald-800 bg-white/80 rounded-lg p-2 border border-emerald-200">
                                            Contoh: {card.realExample}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="pt-2 mt-2 border-t border-slate-200/70 text-[11px] font-semibold text-emerald-700">
                                {isFlipped ? 'Klik untuk kembali ke pertanyaan' : 'Klik kartu untuk melihat jawaban'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const StepByStepView: React.FC<RendererProps> = ({ data }) => {
    const sbs = data.stepByStepData;
    if (!sbs) return null;

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-sky-900 text-white rounded-2xl p-4 space-y-2">
                <div className="text-[11px] font-semibold text-sky-200">Panduan Prosedur Step-by-Step</div>
                <h3 className="text-lg font-bold text-white">{data.title}</h3>
                <p className="text-xs text-sky-100 leading-relaxed">Target Pencapaian: {sbs.goalStatement}</p>
                <div className="pt-2 border-t border-sky-700/60 text-xs text-sky-100">
                    <span className="font-bold text-white">Persiapan / Alat: </span>
                    {(sbs.toolsNeeded || []).join(' · ')}
                </div>
            </div>

            <div data-pdf-block="true" className="space-y-3">
                {(sbs.stages || []).map((stage, idx) => (
                    <div key={stage.stepNo} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5">
                        <div className="flex flex-col items-center shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-sky-700 text-white font-bold text-sm flex items-center justify-center tabular-nums">
                                {stage.stepNo}
                            </div>
                            {idx < sbs.stages.length - 1 && (
                                <div className="w-0.5 h-6 bg-sky-200 mt-1.5" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="font-bold text-sm text-slate-900">{stage.title}</h4>
                            <p className="text-xs text-slate-700 leading-relaxed">{stage.instruction}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-900">
                                    <span className="font-bold">Cek Keberhasilan: </span>{stage.checkpoint}
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-900">
                                    <span className="font-bold">Tips Guru: </span>{stage.tip}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div data-pdf-block="true" className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-sky-900 mb-1">Indikator Ketuntasan Langkah</div>
                <p className="text-xs text-sky-950 leading-relaxed">{sbs.successIndicator}</p>
            </div>
        </div>
    );
};

export const TimelineView: React.FC<RendererProps> = ({ data }) => {
    const tl = data.timelineData;
    if (!tl) return null;

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-amber-950 text-white rounded-2xl p-4">
                <div className="text-[11px] font-semibold text-amber-200">Garis Waktu Kronologis · {tl.periodSpan}</div>
                <h3 className="text-lg font-bold text-white mt-0.5">{tl.timelineTitle}</h3>
            </div>

            <div data-pdf-block="true" className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                {/* Horizontal Visual Track SVG */}
                <svg viewBox="0 0 680 64" width="680" height="64" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
                    <line x1="45" y1="28" x2="635" y2="28" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" />
                    {(tl.events || []).map((_, idx) => {
                        const count = Math.max(2, tl.events.length);
                        const x = 60 + (idx * (560 / (count - 1)));
                        return (
                            <g key={idx}>
                                <circle cx={x} cy="28" r="13" fill="#c2410c" stroke="#fff7ed" strokeWidth="3" />
                                <text x={x} y="32" fontSize="11" fontWeight="700" textAnchor="middle" fill="#ffffff">{idx + 1}</text>
                                <text x={x} y="54" fontSize="9.5" fontWeight="600" textAnchor="middle" fill="#7c2d12">Fase {idx + 1}</text>
                            </g>
                        );
                    })}
                </svg>

                <div className="space-y-3">
                    {(tl.events || []).map((ev, idx) => (
                        <div key={idx} className="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-1 space-y-1">
                                <div className="text-xs font-bold text-amber-800">{ev.orderLabel}</div>
                                <div className="text-[11px] text-slate-600 font-medium">{ev.actorOrContext}</div>
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                                <p className="text-xs text-slate-700 leading-relaxed">{ev.description}</p>
                                <div className="text-[11px] font-semibold text-amber-900 bg-white border border-amber-200 rounded-lg px-2.5 py-1.5">
                                    Dampak / Makna: {ev.impact}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div data-pdf-block="true" className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-amber-900 mb-1">Sintesis Hubungan Sebab-Akibat</div>
                <p className="text-xs text-amber-950 leading-relaxed">{tl.synthesisNote}</p>
            </div>
        </div>
    );
};

export const ComparisonChartView: React.FC<RendererProps> = ({ data }) => {
    const cc = data.comparisonData;
    if (!cc) return null;

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-slate-900 text-white rounded-2xl p-4">
                <div className="text-[11px] font-semibold text-slate-300">Matriks Perbandingan Konsep · Comparison Chart</div>
                <h3 className="text-lg font-bold text-white mt-0.5">{cc.conceptAName} vs {cc.conceptBName}</h3>
            </div>

            <div data-pdf-block="true" className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="p-3 text-xs font-bold text-slate-700 w-1/4">Aspek Pembanding</th>
                            <th className="p-3 text-xs font-bold text-blue-900 bg-blue-50/70 w-[37.5%]">{cc.conceptAName}</th>
                            <th className="p-3 text-xs font-bold text-emerald-900 bg-emerald-50/70 w-[37.5%]">{cc.conceptBName}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {(cc.rows || []).map((row, idx) => (
                            <tr key={idx}>
                                <td className="p-3 text-xs font-bold text-slate-800 align-top bg-slate-50/50">{row.aspect}</td>
                                <td className="p-3 text-xs text-slate-700 align-top leading-relaxed">{row.conceptAValue}</td>
                                <td className="p-3 text-xs text-slate-700 align-top leading-relaxed">{row.conceptBValue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-900 mb-1.5">Persamaan Utama Keduanya</div>
                    <ul className="space-y-1">
                        {(cc.similarities || []).map((sim, idx) => (
                            <li key={idx} className="text-xs text-slate-700 leading-relaxed">• {sim}</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-indigo-950 mb-1.5">Kesimpulan Analisis</div>
                    <p className="text-xs text-indigo-950 leading-relaxed">{cc.conclusion}</p>
                </div>
            </div>
        </div>
    );
};

const IsometricSceneSvg: React.FC<{ sceneType: string; title: string }> = ({ sceneType, title }) => {
    // True 30-degree Isometric 3D vector illustrations with numbered pins 1..4
    if (sceneType === 'geometry_solid') {
        return (
            <svg viewBox="0 0 640 240" width="640" height="240" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl border border-indigo-200 bg-slate-50">
                {/* Isometric Grid Hint */}
                <defs>
                    <pattern id="isoGrid" width="40" height="23" patternUnits="userSpaceOnUse">
                        <path d="M 0 11.5 L 20 0 L 40 11.5 L 20 23 Z" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                    </pattern>
                </defs>
                <rect x="0" y="0" width="640" height="240" fill="url(#isoGrid)" />

                {/* Isometric Cube / Cuboid */}
                <g transform="translate(215, 36)">
                    {/* Top Face */}
                    <polygon points="105,15 205,65 105,115 5,65" fill="#818cf8" stroke="#312e81" strokeWidth="2" />
                    {/* Left Face */}
                    <polygon points="5,65 105,115 105,195 5,145" fill="#4f46e5" stroke="#312e81" strokeWidth="2" />
                    {/* Right Face */}
                    <polygon points="105,115 205,65 205,145 105,195" fill="#6366f1" stroke="#312e81" strokeWidth="2" />
                    {/* Hidden Dashed Edges */}
                    <line x1="105" y1="15" x2="105" y2="95" stroke="#e0e7ff" strokeWidth="1.5" strokeDasharray="4,3" />
                    <line x1="5" y1="145" x2="105" y2="95" stroke="#e0e7ff" strokeWidth="1.5" strokeDasharray="4,3" />
                    <line x1="205" y1="145" x2="105" y2="95" stroke="#e0e7ff" strokeWidth="1.5" strokeDasharray="4,3" />

                    {/* Pin 1: Alas */}
                    <circle cx="55" cy="170" r="12" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                    <text x="55" y="174" fontSize="11" fontWeight="700" textAnchor="middle" fill="#ffffff">1</text>
                    {/* Pin 2: Rusuk Tegak */}
                    <circle cx="105" cy="155" r="12" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    <text x="105" y="159" fontSize="11" fontWeight="700" textAnchor="middle" fill="#ffffff">2</text>
                    {/* Pin 3: Sisi Atas */}
                    <circle cx="105" cy="65" r="12" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <text x="105" y="69" fontSize="11" fontWeight="700" textAnchor="middle" fill="#ffffff">3</text>
                    {/* Pin 4: Titik Sudut */}
                    <circle cx="205" cy="65" r="12" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                    <text x="205" y="69" fontSize="11" fontWeight="700" textAnchor="middle" fill="#ffffff">4</text>
                </g>

                <text x="20" y="28" fontSize="12" fontWeight="800" fill="#1e1b4b">Proyeksi Isometrik 30°</text>
                <text x="20" y="45" fontSize="10" fill="#475569">{title.slice(0, 36)}</text>
            </svg>
        );
    }

    if (sceneType === 'electrical_circuit') {
        return (
            <svg viewBox="0 0 640 240" width="640" height="240" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl border border-indigo-200 bg-slate-50">
                {/* Isometric Baseboard */}
                <polygon points="320,30 570,115 320,205 70,115" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
                <polygon points="70,115 320,205 320,222 70,132" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
                <polygon points="320,205 570,115 570,132 320,222" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />

                {/* Circuit Wire Loop */}
                <polygon points="320,62 480,116 320,170 160,116" fill="none" stroke="#dc2626" strokeWidth="4" />

                {/* 3D Battery Cylinder-Box at Left */}
                <g transform="translate(150, 82)">
                    <polygon points="0,12 28,0 56,12 28,24" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                    <polygon points="0,12 28,24 28,50 0,38" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
                    <polygon points="28,24 56,12 56,38 28,50" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                    <circle cx="28" cy="-4" r="11" fill="#0f172a" stroke="#fff" strokeWidth="2" />
                    <text x="28" y="0" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">1</text>
                </g>

                {/* Switch at Bottom */}
                <g transform="translate(300, 148)">
                    <polygon points="0,12 25,2 50,12 25,22" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="15" y1="12" x2="40" y2="2" stroke="#38bdf8" strokeWidth="4" />
                    <circle cx="25" cy="30" r="11" fill="#0284c7" stroke="#fff" strokeWidth="2" />
                    <text x="25" y="34" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">2</text>
                </g>

                {/* 3D Bulb at Right */}
                <g transform="translate(445, 76)">
                    <circle cx="25" cy="18" r="18" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
                    <rect x="17" y="34" width="16" height="10" fill="#64748b" />
                    <circle cx="25" cy="-4" r="11" fill="#059669" stroke="#fff" strokeWidth="2" />
                    <text x="25" y="0" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">3</text>
                </g>

                {/* Pin 4 Baseboard */}
                <circle cx="320" cy="62" r="11" fill="#d97706" stroke="#fff" strokeWidth="2" />
                <text x="320" y="66" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">4</text>
            </svg>
        );
    }

    if (sceneType === 'plant_structure' || sceneType === 'science_ecosystem') {
        return (
            <svg viewBox="0 0 640 240" width="640" height="240" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl border border-emerald-200 bg-sky-50">
                {/* Isometric Soil / Ecosystem Slab */}
                <polygon points="320,100 540,155 320,210 100,155" fill="#84cc16" stroke="#3f6212" strokeWidth="2" />
                <polygon points="100,155 320,210 320,232 100,177" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                <polygon points="320,210 540,155 540,177 320,232" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />

                {/* Roots */}
                <path d="M 320 158 L 302 182 M 320 158 L 336 184 M 320 158 L 320 190" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
                {/* Stem */}
                <rect x="313" y="66" width="14" height="92" rx="4" fill="#15803d" stroke="#14532d" strokeWidth="1.5" />
                {/* Leaves */}
                <ellipse cx="282" cy="96" rx="28" ry="12" transform="rotate(-18 282 96)" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
                <ellipse cx="358" cy="84" rx="28" ry="12" transform="rotate(18 358 84)" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
                {/* Flower / Sun */}
                <circle cx="320" cy="52" r="18" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                <circle cx="515" cy="46" r="22" fill="#fde047" stroke="#eab308" strokeWidth="2" />

                {/* Pins 1..4 */}
                <circle cx="290" cy="186" r="11" fill="#0f172a" stroke="#fff" strokeWidth="2" />
                <text x="290" y="190" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">1</text>

                <circle cx="320" cy="122" r="11" fill="#0284c7" stroke="#fff" strokeWidth="2" />
                <text x="320" y="126" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">2</text>

                <circle cx="282" cy="96" r="11" fill="#059669" stroke="#fff" strokeWidth="2" />
                <text x="282" y="100" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">3</text>

                <circle cx="515" cy="46" r="11" fill="#d97706" stroke="#fff" strokeWidth="2" />
                <text x="515" y="50" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">4</text>
            </svg>
        );
    }

    // Default / Architecture & Layered Isometric 3D Concept Model
    return (
        <svg viewBox="0 0 640 240" width="640" height="240" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl border border-indigo-200 bg-slate-50">
            {/* Layer 1 Base Platform */}
            <polygon points="320,115 510,165 320,215 130,165" fill="#c7d2fe" stroke="#4338ca" strokeWidth="2" />
            <polygon points="130,165 320,215 320,232 130,182" fill="#6366f1" stroke="#312e81" strokeWidth="1.5" />
            <polygon points="320,215 510,165 510,182 320,232" fill="#818cf8" stroke="#312e81" strokeWidth="1.5" />

            {/* Layer 2 Middle Core */}
            <polygon points="320,75 455,112 320,150 185,112" fill="#99f6e4" stroke="#0f766e" strokeWidth="2" />
            <polygon points="185,112 320,150 320,166 185,128" fill="#0d9488" stroke="#115e59" strokeWidth="1.5" />
            <polygon points="320,150 455,112 455,128 320,166" fill="#14b8a6" stroke="#115e59" strokeWidth="1.5" />

            {/* Layer 3 Top Crown */}
            <polygon points="320,30 405,56 320,82 235,56" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
            <polygon points="235,56 320,82 320,98 235,72" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <polygon points="320,82 405,56 405,72 320,98" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />

            {/* Pins 1..4 */}
            <circle cx="170" cy="175" r="12" fill="#0f172a" stroke="#fff" strokeWidth="2" />
            <text x="170" y="179" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">1</text>

            <circle cx="220" cy="118" r="12" fill="#0284c7" stroke="#fff" strokeWidth="2" />
            <text x="220" y="122" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">2</text>

            <circle cx="320" cy="56" r="12" fill="#059669" stroke="#fff" strokeWidth="2" />
            <text x="320" y="60" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">3</text>

            <circle cx="485" cy="165" r="12" fill="#d97706" stroke="#fff" strokeWidth="2" />
            <text x="485" y="169" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">4</text>

            <text x="20" y="28" fontSize="12" fontWeight="800" fill="#1e1b4b">Model Struktural Isometrik 3D</text>
            <text x="20" y="45" fontSize="10" fill="#475569">Lapisan Fondasi, Proses &amp; Hasil</text>
        </svg>
    );
};

export const Isometric3DView: React.FC<RendererProps> = ({ data }) => {
    const iso = data.isometric3dData;
    if (!iso) return null;

    const pinColors = ['#0f172a', '#0284c7', '#059669', '#d97706'];

    return (
        <div className="space-y-4">
            <div data-pdf-block="true" className="bg-indigo-950 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-[11px] font-semibold text-indigo-200">Visualisasi Objek Isometrik 3D · {iso.dimensionSummary}</div>
                    <h3 className="text-lg font-bold text-white mt-0.5">{iso.objectTitle}</h3>
                </div>
                <span className="text-xs font-medium text-indigo-200">{iso.parts.length} Bagian Teranotasi</span>
            </div>

            <div data-pdf-block="true" className="bg-white border border-slate-200 rounded-2xl p-4">
                <IsometricSceneSvg sceneType={iso.visualSceneType} title={iso.objectTitle} />
            </div>

            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(iso.parts || []).map((part, idx) => (
                    <div key={part.pinNo} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
                        <span
                            className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums"
                            style={{ backgroundColor: pinColors[idx % pinColors.length] }}
                        >
                            {part.pinNo}
                        </span>
                        <div className="min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-sm text-slate-900">{part.partName}</h4>
                                <span className="text-[11px] font-semibold text-indigo-700 shrink-0">{part.measurementOrDetail}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{part.functionOrProperty}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div data-pdf-block="true" className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-indigo-950 mb-1">Pemahaman Spasial 3D</div>
                <p className="text-xs text-indigo-950 leading-relaxed">{iso.spatialInsight}</p>
            </div>
        </div>
    );
};

export const MateriAjarTemplateRenderer: React.FC<RendererProps> = ({ data, isPrintMode = false }) => {
    switch (data.templateId) {
        case 'educational_infographic':
            return <EducationalInfographicView data={data} isPrintMode={isPrintMode} />;
        case 'cheat_sheet':
            return <CheatSheetView data={data} isPrintMode={isPrintMode} />;
        case 'sticky_notes':
            return <StickyNotesView data={data} isPrintMode={isPrintMode} />;
        case 'mind_map':
            return <MindMapView data={data} isPrintMode={isPrintMode} />;
        case 'comic_strip':
            return <ComicStripView data={data} isPrintMode={isPrintMode} />;
        case 'flashcard':
            return <FlashcardView data={data} isPrintMode={isPrintMode} />;
        case 'step_by_step':
            return <StepByStepView data={data} isPrintMode={isPrintMode} />;
        case 'timeline':
            return <TimelineView data={data} isPrintMode={isPrintMode} />;
        case 'comparison_chart':
            return <ComparisonChartView data={data} isPrintMode={isPrintMode} />;
        case 'isometric_3d':
            return <Isometric3DView data={data} isPrintMode={isPrintMode} />;
        default:
            return <EducationalInfographicView data={data} isPrintMode={isPrintMode} />;
    }
};
