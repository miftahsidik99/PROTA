import React, { useState } from 'react';
import {
    GeneratedMateriAjarData,
    MateriVisualTheme,
    MATERI_VISUAL_THEMES
} from './materiAjarHelper';

export interface ExtraRendererProps {
    data: GeneratedMateriAjarData;
    theme?: MateriVisualTheme;
    isPrintMode?: boolean;
}

const getTheme = (data: GeneratedMateriAjarData, theme?: MateriVisualTheme): MateriVisualTheme => {
    if (theme) return theme;
    return MATERI_VISUAL_THEMES.find(t => t.id === data.themeId) || MATERI_VISUAL_THEMES[0];
};

const trunc = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/* ==================== A4. VISUAL GLOSSARY ==================== */
export const VisualGlossaryView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const vg = data.visualGlossaryData;
    if (!vg) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Kamus Istilah Bergambar · Visual Glossary</div>
                <h3 className="text-lg font-bold mt-0.5">{vg.glossaryTitle}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(vg.entries || []).map((entry, idx) => (
                    <div key={idx} className="bg-white border rounded-2xl p-4 flex items-start gap-3.5" style={{ borderColor: t.borderHex }}>
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}
                        >
                            <svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="15" fill={t.primaryHex} opacity="0.16" />
                                <circle cx="20" cy="20" r="9" fill={idx % 2 === 0 ? t.primaryHex : t.secondaryHex} />
                                <text x="20" y="24" fontSize="11" fontWeight="800" textAnchor="middle" fill="#ffffff">
                                    {entry.term.charAt(0).toUpperCase()}
                                </text>
                            </svg>
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-sm text-slate-900">{entry.term}</h4>
                                <span className="text-[10.5px] font-semibold shrink-0" style={{ color: t.primaryHex }}>{entry.category}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{entry.definition}</p>
                            <div className="text-[11px] rounded-lg px-2.5 py-1.5 border" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex, color: t.darkHex }}>
                                <span className="font-bold">Contoh: </span>{entry.example}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ==================== A5. KNOWLEDGE PYRAMID ==================== */
export const KnowledgePyramidView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const kp = data.knowledgePyramidData;
    if (!kp) return null;

    const tierColors = [t.secondaryHex, '#059669', '#0284c7', t.primaryHex];
    const sorted = [...(kp.tiers || [])].sort((a, b) => b.level - a.level);

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Piramida Tingkatan Pemahaman · Knowledge Pyramid</div>
                <h3 className="text-lg font-bold mt-0.5">{kp.pyramidTitle}</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4">
                    <svg viewBox="0 0 320 230" width="320" height="230" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
                        <polygon points="160,14 202,62 118,62" fill={tierColors[0]} />
                        <text x="160" y="48" fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">4. Puncak</text>

                        <polygon points="112,68 208,68 238,116 82,116" fill={tierColors[1]} />
                        <text x="160" y="96" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">3. Hubungan &amp; Analisis</text>

                        <polygon points="76,122 244,122 274,170 46,170" fill={tierColors[2]} />
                        <text x="160" y="150" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">2. Unsur &amp; Mekanisme</text>

                        <polygon points="40,176 280,176 308,220 12,220" fill={tierColors[3]} />
                        <text x="160" y="202" fontSize="11.5" fontWeight="800" textAnchor="middle" fill="#fff">1. Fondasi Konsep Dasar</text>
                    </svg>
                </div>

                <div className="lg:col-span-7 space-y-2.5">
                    {sorted.map((tier, idx) => (
                        <div key={tier.level} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                            <span
                                className="w-7 h-7 rounded-lg text-white text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums"
                                style={{ backgroundColor: tierColors[idx % tierColors.length] }}
                            >
                                {tier.level}
                            </span>
                            <div className="min-w-0 space-y-0.5">
                                <div className="text-[11px] font-bold" style={{ color: tierColors[idx % tierColors.length] }}>{tier.tierLabel}</div>
                                <h4 className="text-xs font-extrabold text-slate-900">{tier.title}</h4>
                                <p className="text-xs text-slate-700 leading-relaxed">{tier.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl p-3.5 border text-xs" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex, color: t.darkHex }}>
                <span className="font-bold">Inti Puncak Pemahaman: </span>{kp.apexInsight}
            </div>
        </div>
    );
};

/* ==================== B2. CONCEPT MAP (WITH LINKING VERBS) ==================== */
export const ConceptMapView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const cm = data.conceptMapData;
    if (!cm) return null;

    const coords: Record<string, { x: number; y: number; w: number }> = {
        c: { x: 340, y: 44, w: 220 },
        n1: { x: 165, y: 158, w: 195 },
        n2: { x: 515, y: 158, w: 195 },
        n4: { x: 165, y: 274, w: 205 },
        n3: { x: 515, y: 274, w: 205 }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Peta Hubungan Konsep Berlabel · Concept Map</div>
                <h3 className="text-lg font-bold mt-0.5">{cm.title}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <svg viewBox="0 0 680 325" width="680" height="325" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl bg-slate-50 border border-slate-200">
                    <defs>
                        <marker id="cmArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill={t.primaryHex} />
                        </marker>
                    </defs>

                    {(cm.edges || []).map((edge, idx) => {
                        const from = coords[edge.fromId];
                        const to = coords[edge.toId];
                        if (!from || !to) return null;
                        const mx = (from.x + to.x) / 2;
                        const my = (from.y + to.y) / 2;
                        return (
                            <g key={idx}>
                                <line
                                    x1={from.x}
                                    y1={from.y + 24}
                                    x2={to.x}
                                    y2={to.y - 26}
                                    stroke={t.primaryHex}
                                    strokeWidth="2.2"
                                    markerEnd="url(#cmArrow)"
                                />
                                <rect x={mx - 58} y={my - 11} width="116" height="22" rx="11" fill="#ffffff" stroke={t.borderHex} strokeWidth="1.3" />
                                <text x={mx} y={my + 4} fontSize="10" fontWeight="700" textAnchor="middle" fill={t.darkHex}>
                                    {trunc(edge.linkingVerb, 18)}
                                </text>
                            </g>
                        );
                    })}

                    {(cm.nodes || []).map((node) => {
                        const pos = coords[node.id] || { x: 340, y: 160, w: 180 };
                        const isCore = node.role === 'core';
                        return (
                            <g key={node.id}>
                                <rect
                                    x={pos.x - pos.w / 2}
                                    y={pos.y - 24}
                                    width={pos.w}
                                    height="48"
                                    rx="12"
                                    fill={isCore ? t.primaryHex : '#ffffff'}
                                    stroke={isCore ? t.darkHex : t.secondaryHex}
                                    strokeWidth="2"
                                />
                                <text
                                    x={pos.x}
                                    y={pos.y + 4}
                                    fontSize="11.5"
                                    fontWeight="800"
                                    textAnchor="middle"
                                    fill={isCore ? '#ffffff' : '#0f172a'}
                                >
                                    {trunc(node.label, 24)}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(cm.nodes || []).map((node) => (
                    <div key={node.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                        <div className="text-xs font-extrabold" style={{ color: t.primaryHex }}>{node.label}</div>
                        <p className="text-xs text-slate-700 leading-relaxed">{node.summary}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ==================== B3. TREE DIAGRAM ==================== */
export const TreeDiagramView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const td = data.treeDiagramData;
    if (!td) return null;

    const branches = (td.branches || []).slice(0, 3);

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Hierarki Klasifikasi · Tree Diagram</div>
                <h3 className="text-lg font-bold mt-0.5">{td.rootTitle}</h3>
                <p className="text-xs opacity-85 mt-0.5">{td.rootSubtitle}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <svg viewBox="0 0 680 120" width="680" height="120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
                    <line x1="340" y1="44" x2="340" y2="64" stroke={t.primaryHex} strokeWidth="2.5" />
                    <line x1="115" y1="64" x2="565" y2="64" stroke={t.primaryHex} strokeWidth="2.5" />
                    <line x1="115" y1="64" x2="115" y2="86" stroke={t.primaryHex} strokeWidth="2.5" />
                    <line x1="340" y1="64" x2="340" y2="86" stroke={t.primaryHex} strokeWidth="2.5" />
                    <line x1="565" y1="64" x2="565" y2="86" stroke={t.primaryHex} strokeWidth="2.5" />

                    <rect x="200" y="6" width="280" height="38" rx="10" fill={t.primaryHex} />
                    <text x="340" y="30" fontSize="12" fontWeight="800" textAnchor="middle" fill="#ffffff">{trunc(td.rootTitle, 32)}</text>

                    {branches.map((br, idx) => {
                        const cx = idx === 0 ? 115 : idx === 1 ? 340 : 565;
                        return (
                            <g key={idx}>
                                <rect x={cx - 95} y="84" width="190" height="32" rx="8" fill={t.surfaceHex} stroke={t.primaryHex} strokeWidth="1.8" />
                                <text x={cx} y="104" fontSize="10.5" fontWeight="700" textAnchor="middle" fill={t.darkHex}>{trunc(br.category, 24)}</text>
                            </g>
                        );
                    })}
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {branches.map((br, idx) => (
                        <div key={idx} className="rounded-xl border p-3 space-y-2" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                            <div className="text-xs font-extrabold" style={{ color: t.darkHex }}>{br.category}</div>
                            <p className="text-[11.5px] text-slate-700 leading-relaxed">{br.description}</p>
                            <div className="space-y-1.5 pt-1 border-t border-black/10">
                                {(br.children || []).map((ch, ci) => (
                                    <div key={ci} className="bg-white rounded-lg p-2 border border-slate-200 text-[11px]">
                                        <span className="font-bold text-slate-900">{ch.label}: </span>
                                        <span className="text-slate-700">{ch.detail}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ==================== B4. VENN DIAGRAM ==================== */
export const VennDiagramView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const vd = data.vennDiagramData;
    if (!vd) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Diagram Irisan Persamaan &amp; Perbedaan · Venn Diagram</div>
                <h3 className="text-lg font-bold mt-0.5">{vd.title}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                <svg viewBox="0 0 680 230" width="680" height="230" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
                    <circle cx="245" cy="116" r="98" fill={t.primaryHex} fillOpacity="0.18" stroke={t.primaryHex} strokeWidth="2.8" />
                    <circle cx="435" cy="116" r="98" fill={t.secondaryHex} fillOpacity="0.18" stroke={t.secondaryHex} strokeWidth="2.8" />

                    <text x="180" y="64" fontSize="12" fontWeight="800" textAnchor="middle" fill={t.darkHex}>{trunc(vd.leftLabel, 20)}</text>
                    <text x="180" y="102" fontSize="10" fontWeight="600" textAnchor="middle" fill="#1e293b">{trunc(vd.leftPoints[0] || '', 26)}</text>
                    <text x="180" y="124" fontSize="10" fontWeight="600" textAnchor="middle" fill="#1e293b">{trunc(vd.leftPoints[1] || '', 26)}</text>

                    <text x="500" y="64" fontSize="12" fontWeight="800" textAnchor="middle" fill={t.secondaryHex}>{trunc(vd.rightLabel, 20)}</text>
                    <text x="500" y="102" fontSize="10" fontWeight="600" textAnchor="middle" fill="#1e293b">{trunc(vd.rightPoints[0] || '', 26)}</text>
                    <text x="500" y="124" fontSize="10" fontWeight="600" textAnchor="middle" fill="#1e293b">{trunc(vd.rightPoints[1] || '', 26)}</text>

                    <rect x="292" y="76" width="96" height="80" rx="14" fill="#ffffff" fillOpacity="0.92" stroke={t.primaryHex} strokeWidth="1.6" />
                    <text x="340" y="96" fontSize="10" fontWeight="800" textAnchor="middle" fill={t.darkHex}>PERSAMAAN</text>
                    <text x="340" y="116" fontSize="9.5" fontWeight="600" textAnchor="middle" fill="#334155">{trunc(vd.intersectionLabel, 18)}</text>
                    <text x="340" y="136" fontSize="9" textAnchor="middle" fill="#475569">Keterpaduan TP</text>
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border p-3 space-y-1.5" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                        <div className="text-xs font-extrabold" style={{ color: t.darkHex }}>{vd.leftLabel}</div>
                        {vd.leftPoints.map((p, i) => <p key={i} className="text-xs text-slate-700 leading-relaxed">• {p}</p>)}
                    </div>
                    <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 space-y-1.5">
                        <div className="text-xs font-extrabold text-slate-900">{vd.intersectionLabel}</div>
                        {vd.intersectionPoints.map((p, i) => <p key={i} className="text-xs text-slate-700 leading-relaxed">• {p}</p>)}
                    </div>
                    <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 space-y-1.5">
                        <div className="text-xs font-extrabold text-sky-950">{vd.rightLabel}</div>
                        {vd.rightPoints.map((p, i) => <p key={i} className="text-xs text-slate-700 leading-relaxed">• {p}</p>)}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800">
                    <span className="font-bold">Kesimpulan Irisan: </span>{vd.insight}
                </div>
            </div>
        </div>
    );
};

/* ==================== B5. FISHBONE DIAGRAM ==================== */
export const FishboneDiagramView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const fb = data.fishboneData;
    if (!fb) return null;

    const causes = (fb.causes || []).slice(0, 4);

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Diagram Tulang Ikan Sebab-Akibat · Fishbone Diagram</div>
                <h3 className="text-lg font-bold mt-0.5">{fb.headEffect}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                <svg viewBox="0 0 680 220" width="680" height="220" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl bg-slate-50 border border-slate-200">
                    {/* Tail */}
                    <polygon points="30,110 72,78 72,142" fill={t.secondaryHex} opacity="0.85" />
                    {/* Spine */}
                    <line x1="72" y1="110" x2="500" y2="110" stroke={t.darkHex} strokeWidth="5" strokeLinecap="round" />
                    {/* Head */}
                    <path d="M500 58 Q650 72 650 110 Q650 148 500 162 Z" fill={t.primaryHex} />
                    <text x="562" y="106" fontSize="10.5" fontWeight="800" textAnchor="middle" fill="#ffffff">TOPIK / AKIBAT</text>
                    <text x="562" y="123" fontSize="9.5" fontWeight="600" textAnchor="middle" fill="#e2e8f0">{trunc(fb.headEffect, 20)}</text>

                    {/* Upper ribs (0, 1) & Lower ribs (2, 3) */}
                    {causes.map((c, idx) => {
                        const isTop = idx < 2;
                        const sx = idx % 2 === 0 ? 195 : 365;
                        const bx = sx - 55;
                        const by = isTop ? 36 : 184;
                        return (
                            <g key={idx}>
                                <line x1={sx} y1="110" x2={bx} y2={by} stroke={t.secondaryHex} strokeWidth="2.6" />
                                <rect x={bx - 75} y={isTop ? 14 : 178} width="152" height="28" rx="7" fill="#ffffff" stroke={t.primaryHex} strokeWidth="1.6" />
                                <text x={bx} y={isTop ? 32 : 196} fontSize="10" fontWeight="800" textAnchor="middle" fill={t.darkHex}>
                                    {trunc(c.category, 22)}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {causes.map((c, idx) => (
                        <div key={idx} className="border rounded-xl p-3 space-y-1.5" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                            <div className="text-xs font-extrabold" style={{ color: t.darkHex }}>{c.category}</div>
                            {c.subCauses.map((sc, sIdx) => (
                                <div key={sIdx} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 leading-snug">
                                    • {sc}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ==================== C2. FLOWCHART (OVAL / PROCESS / DIAMOND DECISION) ==================== */
export const FlowchartView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const fc = data.flowchartData;
    if (!fc) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Diagram Alir Keputusan · Flowchart</div>
                <h3 className="text-lg font-bold mt-0.5">{fc.title}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-2">
                {(fc.steps || []).map((step, idx) => (
                    <React.Fragment key={step.id}>
                        {step.shape === 'start' || step.shape === 'end' ? (
                            <div
                                className="px-8 py-3 rounded-full text-white text-center max-w-md w-full shadow-xs"
                                style={{ backgroundColor: step.shape === 'start' ? '#059669' : t.primaryHex }}
                            >
                                <div className="text-xs font-extrabold uppercase tracking-wider">{step.label}</div>
                                <div className="text-[11px] opacity-90 mt-0.5">{step.detail}</div>
                            </div>
                        ) : step.shape === 'decision' ? (
                            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-3 items-center py-1">
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center text-[11px] text-rose-900">
                                    <div className="font-extrabold">TIDAK →</div>
                                    <div>{step.noBranch || 'Tinjau ulang konsep'}</div>
                                </div>
                                <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-3 text-center rotate-0 shadow-xs">
                                    <div className="text-[10px] font-extrabold text-amber-800 uppercase">Keputusan (Cek Syarat)</div>
                                    <div className="text-xs font-bold text-slate-900 mt-0.5">{step.label}</div>
                                    <div className="text-[11px] text-slate-600 mt-0.5">{step.detail}</div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center text-[11px] text-emerald-900">
                                    <div className="font-extrabold">YA →</div>
                                    <div>{step.yesBranch || 'Lanjut ke tahap akhir'}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-lg border-2 rounded-xl p-3.5 bg-white text-center" style={{ borderColor: t.secondaryHex }}>
                                <div className="text-xs font-extrabold" style={{ color: t.darkHex }}>{step.label}</div>
                                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{step.detail}</p>
                            </div>
                        )}
                        {idx < fc.steps.length - 1 && (
                            <div className="flex flex-col items-center">
                                <div className="w-0.5 h-4" style={{ backgroundColor: t.primaryHex }} />
                                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent" style={{ borderTopColor: t.primaryHex }} />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

/* ==================== C4. CYCLE DIAGRAM ==================== */
export const CycleDiagramView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const cd = data.cycleDiagramData;
    if (!cd) return null;

    const phases = (cd.phases || []).slice(0, 4);
    const colors = [t.primaryHex, t.secondaryHex, '#059669', '#d97706'];

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Diagram Siklus Berkelanjutan · Cycle Diagram</div>
                <h3 className="text-lg font-bold mt-0.5">{cd.cycleTitle}</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4">
                    <svg viewBox="0 0 300 260" width="300" height="260" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
                        <circle cx="150" cy="130" r="82" fill="none" stroke={t.borderHex} strokeWidth="14" />
                        <path d="M 150 48 A 82 82 0 0 1 232 130" fill="none" stroke={colors[0]} strokeWidth="6" />
                        <path d="M 232 130 A 82 82 0 0 1 150 212" fill="none" stroke={colors[1]} strokeWidth="6" />
                        <path d="M 150 212 A 82 82 0 0 1 68 130" fill="none" stroke={colors[2]} strokeWidth="6" />
                        <path d="M 68 130 A 82 82 0 0 1 150 48" fill="none" stroke={colors[3]} strokeWidth="6" />

                        <circle cx="150" cy="130" r="42" fill={t.darkHex} />
                        <text x="150" y="126" fontSize="9.5" fontWeight="700" textAnchor="middle" fill="#e2e8f0">SIKLUS</text>
                        <text x="150" y="142" fontSize="9.5" fontWeight="800" textAnchor="middle" fill="#ffffff">{trunc(cd.centerLabel, 14)}</text>

                        {[
                            { x: 150, y: 36, n: 1 },
                            { x: 242, y: 130, n: 2 },
                            { x: 150, y: 224, n: 3 },
                            { x: 58, y: 130, n: 4 }
                        ].map((pt, i) => (
                            <g key={i}>
                                <circle cx={pt.x} cy={pt.y} r="17" fill={colors[i]} stroke="#ffffff" strokeWidth="3" />
                                <text x={pt.x} y={pt.y + 4} fontSize="12" fontWeight="800" textAnchor="middle" fill="#ffffff">{pt.n}</text>
                            </g>
                        ))}
                    </svg>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {phases.map((ph, idx) => (
                        <div key={ph.phaseNo} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}>
                                    {ph.phaseNo}
                                </span>
                                <h4 className="text-xs font-extrabold text-slate-900">{ph.title}</h4>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{ph.description}</p>
                            <div className="text-[11px] font-semibold" style={{ color: colors[idx % colors.length] }}>
                                Penanda: {ph.keyIndicator}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ==================== D2. T-CHART ==================== */
export const TChartView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const tc = data.tChartData;
    if (!tc) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Bagan T Dua Sisi Kontras · T-Chart</div>
                <h3 className="text-lg font-bold mt-0.5">{tc.topicTitle}</h3>
            </div>

            <div className="bg-white border-2 rounded-2xl overflow-hidden" style={{ borderColor: t.primaryHex }}>
                <div className="grid grid-cols-2 text-white font-extrabold text-xs" style={{ backgroundColor: t.primaryHex }}>
                    <div className="p-3.5 border-r-2 border-white/30 text-center">{tc.leftHeader}</div>
                    <div className="p-3.5 text-center">{tc.rightHeader}</div>
                </div>
                <div className="divide-y divide-slate-200">
                    {(tc.rows || []).map((row, idx) => (
                        <div key={idx} className="grid grid-cols-2 divide-x-2" style={{ borderColor: t.primaryHex }}>
                            <div className="p-3.5 text-xs text-slate-800 leading-relaxed bg-emerald-50/35">{row.leftText}</div>
                            <div className="p-3.5 text-xs text-slate-800 leading-relaxed bg-amber-50/35">{row.rightText}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl p-3.5 border text-xs" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex, color: t.darkHex }}>
                <span className="font-bold">Kesimpulan T-Chart: </span>{tc.summaryNote}
            </div>
        </div>
    );
};

/* ==================== D3. FRAYER MODEL (4 QUADRANTS + CENTER CONCEPT) ==================== */
export const FrayerModelView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const fm = data.frayerModelData;
    if (!fm) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white text-center" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Model Pendalaman 4 Kuadran · Frayer Model</div>
                <h3 className="text-lg font-bold mt-0.5">{fm.conceptName}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-1.5">
                    <div className="text-xs font-extrabold text-sky-950 uppercase">1. Definisi Konsep</div>
                    <p className="text-xs text-slate-800 leading-relaxed">{fm.definition}</p>
                </div>

                <div className="bg-violet-50/70 border border-violet-200 rounded-2xl p-4 space-y-1.5">
                    <div className="text-xs font-extrabold text-violet-950 uppercase">2. Ciri &amp; Karakteristik</div>
                    <ul className="space-y-1">
                        {fm.characteristics.map((c, i) => (
                            <li key={i} className="text-xs text-slate-800 leading-relaxed">• {c}</li>
                        ))}
                    </ul>
                </div>

                <div className="md:col-span-2 flex justify-center -my-1">
                    <div className="px-6 py-2.5 rounded-2xl text-white text-xs font-extrabold text-center border-2 border-white shadow-sm" style={{ backgroundColor: t.primaryHex }}>
                        KONSEP INTI: {fm.conceptName}
                    </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
                    <div className="text-xs font-extrabold text-emerald-950 uppercase">3. Contoh Nyata (Benar)</div>
                    <ul className="space-y-1">
                        {fm.examples.map((ex, i) => (
                            <li key={i} className="text-xs text-slate-800 leading-relaxed">✓ {ex}</li>
                        ))}
                    </ul>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-1.5">
                    <div className="text-xs font-extrabold text-rose-950 uppercase">4. Bukan Contoh / Yang Keliru</div>
                    <ul className="space-y-1">
                        {fm.nonExamples.map((nx, i) => (
                            <li key={i} className="text-xs text-slate-800 leading-relaxed">✕ {nx}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

/* ==================== D4. KWL CHART ==================== */
export const KwlChartView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const kwl = data.kwlChartData;
    if (!kwl) return null;

    const cols = [
        { letter: 'K', title: 'Sudah Diketahui (Know)', bg: '#eff6ff', border: '#bfdbfe', head: '#1d4ed8', items: kwl.knowItems },
        { letter: 'W', title: 'Ingin Diketahui (Want)', bg: '#fffbeb', border: '#fde68a', head: '#b45309', items: kwl.wantItems },
        { letter: 'L', title: 'Sudah Dipelajari (Learned)', bg: '#ecfdf5', border: '#a7f3d0', head: '#047857', items: kwl.learnedItems }
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Bagan Penyelidikan Inkuiri · KWL Chart</div>
                <h3 className="text-lg font-bold mt-0.5">{kwl.topicTitle}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {cols.map((c) => (
                    <div key={c.letter} className="rounded-2xl border overflow-hidden flex flex-col" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                        <div className="px-4 py-3 text-white flex items-center gap-2.5" style={{ backgroundColor: c.head }}>
                            <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-extrabold text-sm">{c.letter}</span>
                            <span className="text-xs font-bold leading-snug">{c.title}</span>
                        </div>
                        <div className="p-3.5 space-y-2 flex-1">
                            {c.items.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-xl p-2.5 border border-black/5 text-xs text-slate-800 leading-relaxed">
                                    {idx + 1}. {item}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ==================== E2. STORYBOARD ==================== */
export const StoryboardView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const sb = data.storyboardData;
    if (!sb) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Papan Adegan Pembelajaran · Storyboard</div>
                <h3 className="text-lg font-bold mt-0.5">{sb.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(sb.frames || []).map((frame) => (
                    <div key={frame.frameNo} className="bg-white border border-slate-300 rounded-2xl overflow-hidden flex flex-col">
                        <div className="px-3.5 py-2 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
                            <span>SHOT #{frame.frameNo} · {frame.shotTitle}</span>
                            <span className="text-[10.5px] opacity-80">{frame.learningTakeaway}</span>
                        </div>
                        <div className="p-3 bg-slate-100">
                            <svg viewBox="0 0 320 110" width="320" height="110" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg bg-white border border-slate-200">
                                <rect width="320" height="110" fill={t.surfaceHex} />
                                <rect x="12" y="12" width="296" height="86" rx="6" fill="none" stroke={t.primaryHex} strokeWidth="1.5" strokeDasharray="4,3" />
                                <circle cx="88" cy="52" r="16" fill={t.primaryHex} opacity="0.2" />
                                <circle cx="88" cy="48" r="9" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.2" />
                                <path d="M 74 78 C 74 62, 102 62, 102 78 Z" fill={t.primaryHex} />
                                <rect x="130" y="28" width="160" height="54" rx="6" fill="#ffffff" stroke={t.borderHex} strokeWidth="1.4" />
                                <text x="210" y="50" fontSize="10" fontWeight="700" textAnchor="middle" fill={t.darkHex}>Fokus Adegan #{frame.frameNo}</text>
                                <text x="210" y="67" fontSize="9" textAnchor="middle" fill="#475569">{trunc(frame.visualCue, 32)}</text>
                            </svg>
                        </div>
                        <div className="p-3.5 space-y-1.5 flex-1">
                            <p className="text-xs text-slate-800 leading-relaxed">{frame.actionCaption}</p>
                            <div className="text-[11px] font-bold" style={{ color: t.primaryHex }}>Poin Belajar: {frame.learningTakeaway}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ==================== E3. STORY MAP ==================== */
export const StoryMapView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const sm = data.storyMapData;
    if (!sm) return null;

    const nodes = [
        { step: '1. Tokoh & Latar', color: '#0284c7', text: `${sm.characters.join(', ')} — ${sm.setting}` },
        { step: '2. Awal / Situasi', color: t.primaryHex, text: sm.beginning },
        { step: '3. Masalah / Tantangan', color: '#d97706', text: sm.conflict },
        { step: '4. Penyelesaian', color: '#059669', text: sm.resolution }
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Peta Alur &amp; Unsur Cerita · Story Map</div>
                <h3 className="text-lg font-bold mt-0.5">{sm.storyTitle}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {nodes.map((n, idx) => (
                    <div key={idx} className="bg-white border rounded-2xl p-4 space-y-1.5" style={{ borderColor: t.borderHex }}>
                        <div className="text-xs font-extrabold uppercase" style={{ color: n.color }}>{n.step}</div>
                        <p className="text-xs text-slate-800 leading-relaxed">{n.text}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl p-4 border text-xs" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex, color: t.darkHex }}>
                <div className="font-extrabold uppercase mb-1">5. Amanat &amp; Pesan Pembelajaran</div>
                <p className="leading-relaxed">{sm.moralLesson}</p>
            </div>
        </div>
    );
};

/* ==================== F2. QUIZ LEARNING CARDS ==================== */
export const QuizCardsView: React.FC<ExtraRendererProps> = ({ data, theme, isPrintMode = false }) => {
    const t = getTheme(data, theme);
    const qc = data.quizCardsData;
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    if (!qc) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-2" style={{ backgroundColor: t.darkHex }}>
                <div>
                    <div className="text-[11px] font-semibold opacity-80">Kartu Tantangan Belajar · Quiz Learning Cards</div>
                    <h3 className="text-lg font-bold mt-0.5">{qc.deckTitle}</h3>
                </div>
                <span className="text-xs opacity-90">{qc.cards.length} Kartu Tantangan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {(qc.cards || []).map((card) => {
                    const showAns = isPrintMode || !!revealed[card.cardNo];
                    return (
                        <div key={card.cardNo} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span style={{ color: t.primaryHex }}>Kuis #{card.cardNo}</span>
                                    <span className="text-slate-500">{card.level}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 leading-relaxed">{card.question}</p>
                                <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                    Petunjuk: {card.clue}
                                </div>
                            </div>

                            {showAns ? (
                                <div className="rounded-xl p-2.5 border text-[11px] space-y-1" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                                    <div className="font-bold" style={{ color: t.darkHex }}>Jawaban: {card.answer}</div>
                                    <div className="text-slate-700">{card.explanation}</div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setRevealed(p => ({ ...p, [card.cardNo]: true }))}
                                    className="w-full py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                                    style={{ backgroundColor: t.primaryHex }}
                                >
                                    Tampilkan Jawaban
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ==================== G2. CUTAWAY DIAGRAM ==================== */
export const CutawayDiagramView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const ca = data.cutawayData;
    if (!ca) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Diagram Kupas Bagian Dalam · Cutaway Diagram</div>
                <h3 className="text-lg font-bold mt-0.5">{ca.title}</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4">
                    <svg viewBox="0 0 360 220" width="360" height="220" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl bg-slate-50 border border-slate-200">
                        {/* Outer Shell */}
                        <circle cx="145" cy="110" r="84" fill={t.primaryHex} stroke={t.darkHex} strokeWidth="2.5" />
                        {/* Cutaway wedge revealing layers B & C */}
                        <path d="M 145 26 A 84 84 0 0 1 229 110 L 145 110 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
                        <circle cx="145" cy="110" r="54" fill={t.secondaryHex} fillOpacity="0.35" stroke={t.secondaryHex} strokeWidth="2" />
                        <circle cx="145" cy="110" r="24" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />

                        {/* Callout lines */}
                        <line x1="90" y1="54" x2="256" y2="42" stroke="#0f172a" strokeWidth="1.6" />
                        <rect x="256" y="28" width="90" height="26" rx="6" fill="#ffffff" stroke={t.primaryHex} strokeWidth="1.5" />
                        <text x="301" y="45" fontSize="10" fontWeight="800" textAnchor="middle" fill={t.darkHex}>A. Luar</text>

                        <line x1="184" y1="86" x2="256" y2="108" stroke="#0f172a" strokeWidth="1.6" />
                        <rect x="256" y="95" width="90" height="26" rx="6" fill="#ffffff" stroke={t.secondaryHex} strokeWidth="1.5" />
                        <text x="301" y="112" fontSize="10" fontWeight="800" textAnchor="middle" fill={t.secondaryHex}>B. Tengah</text>

                        <line x1="158" y1="118" x2="256" y2="172" stroke="#0f172a" strokeWidth="1.6" />
                        <rect x="256" y="159" width="90" height="26" rx="6" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
                        <text x="301" y="176" fontSize="10" fontWeight="800" textAnchor="middle" fill="#b45309">C. Inti</text>
                    </svg>
                </div>

                <div className="lg:col-span-6 space-y-2.5">
                    {(ca.layers || []).map((layer, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                            <span className="w-7 h-7 rounded-lg text-white text-xs font-extrabold flex items-center justify-center shrink-0" style={{ backgroundColor: idx === 0 ? t.primaryHex : idx === 1 ? t.secondaryHex : '#d97706' }}>
                                {layer.code}
                            </span>
                            <div className="space-y-0.5">
                                <div className="text-xs font-extrabold text-slate-900">{layer.name} <span className="font-semibold text-slate-500">· {layer.thicknessOrRole}</span></div>
                                <p className="text-xs text-slate-700 leading-relaxed">{layer.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ==================== G3. CROSS-SECTION DIAGRAM ==================== */
export const CrossSectionView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const cs = data.crossSectionData;
    if (!cs) return null;

    const strataPalette = [t.primaryHex, t.secondaryHex, '#b45309'];

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Diagram Irisan Penampang Melintang · Cross-Section</div>
                <h3 className="text-lg font-bold mt-0.5">{cs.title}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                <svg viewBox="0 0 680 180" width="680" height="180" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl bg-slate-50 border border-slate-200">
                    {(cs.strata || []).slice(0, 3).map((st, idx) => {
                        const y = 20 + idx * 48;
                        return (
                            <g key={idx}>
                                <rect x="34" y={y} width="612" height="44" rx="8" fill={strataPalette[idx % strataPalette.length]} opacity={0.92 - idx * 0.1} />
                                <text x="56" y={y + 26} fontSize="12" fontWeight="800" fill="#ffffff">
                                    {st.code}. {trunc(st.name, 26)}
                                </text>
                                <text x="626" y={y + 26} fontSize="11" fontWeight="700" textAnchor="end" fill="#ffffff">
                                    {st.thicknessOrRole}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(cs.strata || []).map((st, idx) => (
                        <div key={idx} className="rounded-xl border p-3 space-y-1" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                            <div className="text-xs font-extrabold" style={{ color: strataPalette[idx % strataPalette.length] }}>
                                {st.code} · {st.name}
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{st.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ==================== G4. SCIENTIFIC LABELED DIAGRAM ==================== */
export const ScientificDiagramView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const sd = data.scientificDiagramData;
    if (!sd) return null;

    const leftCalls = (sd.callouts || []).filter(c => c.side === 'left');
    const rightCalls = (sd.callouts || []).filter(c => c.side === 'right');

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Diagram Ilmiah Garis Penunjuk · Scientific Labeled Diagram</div>
                <h3 className="text-lg font-bold mt-0.5">{sd.title}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-4 space-y-2.5">
                    {leftCalls.map((c) => (
                        <div key={c.pinNo} className="border rounded-xl p-3 space-y-1" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                            <div className="text-xs font-extrabold" style={{ color: t.darkHex }}>{c.pinNo}. {c.partName}</div>
                            <p className="text-[11.5px] text-slate-700 leading-relaxed">{c.functionDesc}</p>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-4">
                    <svg viewBox="0 0 260 220" width="260" height="220" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl bg-slate-50 border border-slate-200">
                        <circle cx="130" cy="110" r="64" fill={t.primaryHex} fillOpacity="0.14" stroke={t.primaryHex} strokeWidth="2.5" />
                        <circle cx="130" cy="110" r="34" fill={t.secondaryHex} fillOpacity="0.25" stroke={t.secondaryHex} strokeWidth="2" />
                        <text x="130" y="114" fontSize="10" fontWeight="800" textAnchor="middle" fill={t.darkHex}>{trunc(sd.centerTitle, 18)}</text>

                        {/* Leader lines + numbered pins */}
                        <line x1="16" y1="54" x2="88" y2="74" stroke={t.darkHex} strokeWidth="1.6" />
                        <circle cx="88" cy="74" r="10" fill={t.primaryHex} /><text x="88" y="78" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff">1</text>

                        <line x1="16" y1="166" x2="88" y2="146" stroke={t.darkHex} strokeWidth="1.6" />
                        <circle cx="88" cy="146" r="10" fill={t.secondaryHex} /><text x="88" y="150" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff">2</text>

                        <line x1="244" y1="54" x2="172" y2="74" stroke={t.darkHex} strokeWidth="1.6" />
                        <circle cx="172" cy="74" r="10" fill="#059669" /><text x="172" y="78" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff">3</text>

                        <line x1="244" y1="166" x2="172" y2="146" stroke={t.darkHex} strokeWidth="1.6" />
                        <circle cx="172" cy="146" r="10" fill="#d97706" /><text x="172" y="150" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff">4</text>
                    </svg>
                </div>

                <div className="lg:col-span-4 space-y-2.5">
                    {rightCalls.map((c) => (
                        <div key={c.pinNo} className="border rounded-xl p-3 space-y-1" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                            <div className="text-xs font-extrabold" style={{ color: t.darkHex }}>{c.pinNo}. {c.partName}</div>
                            <p className="text-[11.5px] text-slate-700 leading-relaxed">{c.functionDesc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ==================== G5. 3D PAPER CUT ==================== */
export const PaperCut3DView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const pc = data.paperCut3dData;
    if (!pc) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: t.darkHex }}>
                <div className="text-[11px] font-semibold opacity-80">Komposisi Lapisan Kertas 3D · 3D Paper Cut</div>
                <h3 className="text-lg font-bold mt-0.5">{pc.title}</h3>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-3">
                <svg viewBox="0 0 680 140" width="680" height="140" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-xl bg-sky-100 border border-slate-200">
                    <circle cx="570" cy="42" r="24" fill="#fbbf24" />
                    <path d="M 0 68 Q 160 32 340 62 Q 520 92 680 50 V 140 H 0 Z" fill={t.secondaryHex} opacity="0.55" />
                    <path d="M 0 92 Q 180 64 360 90 Q 540 116 680 78 V 140 H 0 Z" fill={t.primaryHex} opacity="0.82" />
                    <path d="M 0 114 Q 210 94 420 112 Q 560 124 680 104 V 140 H 0 Z" fill={t.darkHex} />
                    <text x="26" y="42" fontSize="13" fontWeight="800" fill={t.darkHex}>Diorama Kertas 4 Lapisan Kedalaman</text>
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(pc.layers || []).map((layer) => (
                        <div
                            key={layer.depth}
                            className="bg-white rounded-2xl p-4 border-2 shadow-sm space-y-1.5"
                            style={{ borderColor: layer.accentHex || t.primaryHex }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-extrabold" style={{ color: layer.accentHex || t.primaryHex }}>
                                    Lapisan #{layer.depth}
                                </span>
                                <span className="text-[10.5px] font-semibold text-slate-500">Kedalaman Visual</span>
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-900">{layer.title}</h4>
                            <p className="text-xs text-slate-700 leading-relaxed">{layer.detail}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ==================== G6. ILLUSTRATED EDUCATIONAL POSTER ==================== */
export const IllustratedPosterView: React.FC<ExtraRendererProps> = ({ data, theme }) => {
    const t = getTheme(data, theme);
    const ip = data.illustratedPosterData;
    if (!ip) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-3xl p-5 sm:p-6 text-white text-center space-y-2" style={{ backgroundColor: t.primaryHex }}>
                <div className="text-xs font-semibold opacity-90">{ip.tagline}</div>
                <h3 className="text-2xl font-extrabold tracking-tight leading-tight">{ip.headline}</h3>
                <p className="text-xs opacity-95 max-w-2xl mx-auto leading-relaxed">{ip.bigTakeaway}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(ip.highlights || []).map((hl, idx) => (
                    <div key={idx} className="rounded-2xl border p-4 space-y-1.5" style={{ backgroundColor: t.surfaceHex, borderColor: t.borderHex }}>
                        <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: t.darkHex }}>{hl.label}</div>
                        <p className="text-xs text-slate-800 leading-relaxed">{hl.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
