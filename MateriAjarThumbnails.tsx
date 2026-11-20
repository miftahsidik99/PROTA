import React from 'react';
import { MateriTemplateId } from './materiAjarHelper';

interface ThumbnailProps {
    templateId: MateriTemplateId;
    accentHex?: string;
    active?: boolean;
}

export const TemplateWireframeThumbnail: React.FC<ThumbnailProps> = ({
    templateId,
    accentHex = '#0f766e',
    active = false
}) => {
    const bg = active ? '#0f172a' : '#f8fafc';
    const card = active ? '#1e293b' : '#ffffff';
    const muted = active ? '#475569' : '#cbd5e1';
    const textTone = active ? '#94a3b8' : '#64748b';

    switch (templateId) {
        case 'educational_infographic':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="10" y="8" width="140" height="18" rx="4" fill={accentHex} />
                    <rect x="16" y="14" width="68" height="5" rx="2" fill="#ffffff" opacity="0.9" />
                    <rect x="10" y="32" width="66" height="28" rx="5" fill={card} stroke={muted} strokeWidth="1.2" />
                    <circle cx="22" cy="44" r="5" fill={accentHex} />
                    <rect x="31" y="40" width="38" height="4" rx="2" fill={muted} />
                    <rect x="16" y="51" width="52" height="3" rx="1.5" fill={muted} opacity="0.7" />
                    <rect x="84" y="32" width="66" height="28" rx="5" fill={card} stroke={muted} strokeWidth="1.2" />
                    <circle cx="96" cy="44" r="5" fill="#0284c7" />
                    <rect x="105" y="40" width="38" height="4" rx="2" fill={muted} />
                    <rect x="90" y="51" width="52" height="3" rx="1.5" fill={muted} opacity="0.7" />
                    <rect x="10" y="66" width="140" height="24" rx="5" fill={card} stroke={accentHex} strokeWidth="1.2" />
                    <rect x="18" y="74" width="100" height="4" rx="2" fill={accentHex} opacity="0.7" />
                    <rect x="18" y="81" width="76" height="3" rx="1.5" fill={muted} />
                </svg>
            );

        case 'cheat_sheet':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="10" y="8" width="140" height="14" rx="3" fill={accentHex} />
                    <rect x="10" y="26" width="44" height="38" rx="4" fill={card} stroke={muted} strokeWidth="1.2" />
                    <rect x="58" y="26" width="44" height="38" rx="4" fill={card} stroke={muted} strokeWidth="1.2" />
                    <rect x="106" y="26" width="44" height="38" rx="4" fill={card} stroke={muted} strokeWidth="1.2" />
                    <rect x="15" y="32" width="34" height="8" rx="2" fill={accentHex} opacity="0.25" />
                    <rect x="63" y="32" width="34" height="8" rx="2" fill={accentHex} opacity="0.25" />
                    <rect x="111" y="32" width="34" height="8" rx="2" fill={accentHex} opacity="0.25" />
                    <rect x="15" y="45" width="30" height="3" rx="1" fill={muted} />
                    <rect x="15" y="52" width="24" height="3" rx="1" fill={muted} />
                    <rect x="63" y="45" width="30" height="3" rx="1" fill={muted} />
                    <rect x="111" y="45" width="30" height="3" rx="1" fill={muted} />
                    <rect x="10" y="69" width="140" height="22" rx="4" fill={card} stroke="#10b981" strokeWidth="1.2" />
                    <circle cx="20" cy="80" r="3.5" fill="#10b981" />
                    <rect x="28" y="78" width="50" height="3.5" rx="1.5" fill={muted} />
                    <circle cx="92" cy="80" r="3.5" fill="#ef4444" />
                    <rect x="100" y="78" width="42" height="3.5" rx="1.5" fill={muted} />
                </svg>
            );

        case 'sticky_notes':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="12" y="12" width="40" height="36" rx="3" fill="#fef08a" stroke="#eab308" strokeWidth="1" transform="rotate(-2 32 30)" />
                    <circle cx="32" cy="17" r="2.8" fill="#ca8a04" />
                    <rect x="60" y="11" width="40" height="36" rx="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" transform="rotate(2 80 29)" />
                    <circle cx="80" cy="16" r="2.8" fill="#0369a1" />
                    <rect x="108" y="13" width="40" height="36" rx="3" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1" transform="rotate(-1.5 128 31)" />
                    <circle cx="128" cy="18" r="2.8" fill="#15803d" />
                    <rect x="32" y="54" width="44" height="36" rx="3" fill="#fecdd3" stroke="#e11d48" strokeWidth="1" transform="rotate(1.5 54 72)" />
                    <circle cx="54" cy="59" r="2.8" fill="#be123c" />
                    <rect x="86" y="54" width="44" height="36" rx="3" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1" transform="rotate(-2 108 72)" />
                    <circle cx="108" cy="59" r="2.8" fill="#6d28d9" />
                </svg>
            );

        case 'visual_glossary':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    {[0, 1, 2, 3].map((i) => {
                        const x = i % 2 === 0 ? 12 : 84;
                        const y = i < 2 ? 12 : 54;
                        return (
                            <g key={i}>
                                <rect x={x} y={y} width="64" height="34" rx="5" fill={card} stroke={muted} strokeWidth="1.2" />
                                <rect x={x + 6} y={y + 6} width="18" height="22" rx="4" fill={accentHex} opacity="0.2" />
                                <circle cx={x + 15} cy={y + 17} r="5" fill={accentHex} />
                                <rect x={x + 29} y={y + 8} width="28" height="4.5" rx="2" fill={accentHex} />
                                <rect x={x + 29} y={y + 17} width="26" height="3" rx="1.5" fill={muted} />
                                <rect x={x + 29} y={y + 23} width="20" height="3" rx="1.5" fill={muted} />
                            </g>
                        );
                    })}
                </svg>
            );

        case 'knowledge_pyramid':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <polygon points="80,10 96,28 64,28" fill="#f59e0b" />
                    <polygon points="61,31 99,31 112,48 48,48" fill="#10b981" />
                    <polygon points="45,51 115,51 128,68 32,68" fill="#0284c7" />
                    <polygon points="29,71 131,71 144,88 16,88" fill={accentHex} />
                    <rect x="62" y="58" width="36" height="3" rx="1.5" fill="#ffffff" opacity="0.85" />
                    <rect x="52" y="78" width="56" height="3.5" rx="1.5" fill="#ffffff" opacity="0.85" />
                </svg>
            );

        case 'mind_map':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <path d="M80 50 Q52 24 32 24" stroke="#0284c7" strokeWidth="2.2" fill="none" />
                    <path d="M80 50 Q108 24 128 24" stroke="#059669" strokeWidth="2.2" fill="none" />
                    <path d="M80 50 Q52 76 32 76" stroke="#d97706" strokeWidth="2.2" fill="none" />
                    <path d="M80 50 Q108 76 128 76" stroke="#7c3aed" strokeWidth="2.2" fill="none" />
                    <rect x="12" y="14" width="38" height="18" rx="5" fill={card} stroke="#0284c7" strokeWidth="1.4" />
                    <rect x="110" y="14" width="38" height="18" rx="5" fill={card} stroke="#059669" strokeWidth="1.4" />
                    <rect x="12" y="68" width="38" height="18" rx="5" fill={card} stroke="#d97706" strokeWidth="1.4" />
                    <rect x="110" y="68" width="38" height="18" rx="5" fill={card} stroke="#7c3aed" strokeWidth="1.4" />
                    <rect x="56" y="38" width="48" height="24" rx="10" fill={accentHex} />
                    <rect x="64" y="48" width="32" height="4" rx="2" fill="#ffffff" />
                </svg>
            );

        case 'concept_map':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <line x1="80" y1="28" x2="40" y2="54" stroke={accentHex} strokeWidth="1.6" />
                    <line x1="80" y1="28" x2="120" y2="54" stroke={accentHex} strokeWidth="1.6" />
                    <line x1="40" y1="68" x2="80" y2="82" stroke="#0284c7" strokeWidth="1.4" />
                    <line x1="120" y1="68" x2="80" y2="82" stroke="#0284c7" strokeWidth="1.4" />
                    <rect x="46" y="36" width="24" height="8" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="90" y="36" width="24" height="8" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="54" y="10" width="52" height="18" rx="5" fill={accentHex} />
                    <rect x="16" y="50" width="48" height="18" rx="5" fill={card} stroke={accentHex} strokeWidth="1.3" />
                    <rect x="96" y="50" width="48" height="18" rx="5" fill={card} stroke={accentHex} strokeWidth="1.3" />
                    <rect x="52" y="76" width="56" height="16" rx="5" fill={card} stroke="#0284c7" strokeWidth="1.3" />
                </svg>
            );

        case 'tree_diagram':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <line x1="80" y1="24" x2="80" y2="36" stroke={accentHex} strokeWidth="2" />
                    <line x1="34" y1="36" x2="126" y2="36" stroke={accentHex} strokeWidth="2" />
                    <line x1="34" y1="36" x2="34" y2="48" stroke={accentHex} strokeWidth="2" />
                    <line x1="80" y1="36" x2="80" y2="48" stroke={accentHex} strokeWidth="2" />
                    <line x1="126" y1="36" x2="126" y2="48" stroke={accentHex} strokeWidth="2" />
                    <rect x="52" y="8" width="56" height="16" rx="4" fill={accentHex} />
                    {[16, 62, 108].map((x, idx) => (
                        <g key={idx}>
                            <rect x={x} y="48" width="36" height="14" rx="3" fill={card} stroke={accentHex} strokeWidth="1.3" />
                            <line x1={x + 18} y1="62" x2={x + 18} y2="74" stroke={muted} strokeWidth="1.4" />
                            <rect x={x + 2} y="74" width="32" height="14" rx="3" fill={card} stroke={muted} strokeWidth="1.1" />
                        </g>
                    ))}
                </svg>
            );

        case 'venn_diagram':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <circle cx="58" cy="50" r="34" fill="#3b82f6" fillOpacity="0.28" stroke="#2563eb" strokeWidth="2" />
                    <circle cx="102" cy="50" r="34" fill="#10b981" fillOpacity="0.28" stroke="#059669" strokeWidth="2" />
                    <rect x="34" y="45" width="18" height="4" rx="2" fill="#1d4ed8" />
                    <rect x="108" y="45" width="18" height="4" rx="2" fill="#047857" />
                    <circle cx="80" cy="50" r="7" fill={accentHex} />
                </svg>
            );

        case 'fishbone_diagram':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <line x1="18" y1="50" x2="114" y2="50" stroke={accentHex} strokeWidth="3" />
                    <polygon points="114,32 148,50 114,68" fill={accentHex} />
                    <line x1="18" y1="50" x2="8" y2="38" stroke={accentHex} strokeWidth="2" />
                    <line x1="18" y1="50" x2="8" y2="62" stroke={accentHex} strokeWidth="2" />
                    <line x1="48" y1="50" x2="32" y2="20" stroke="#0284c7" strokeWidth="2" />
                    <line x1="86" y1="50" x2="70" y2="20" stroke="#0284c7" strokeWidth="2" />
                    <line x1="48" y1="50" x2="32" y2="80" stroke="#d97706" strokeWidth="2" />
                    <line x1="86" y1="50" x2="70" y2="80" stroke="#d97706" strokeWidth="2" />
                    <rect x="18" y="13" width="28" height="8" rx="3" fill={card} stroke="#0284c7" strokeWidth="1" />
                    <rect x="56" y="13" width="28" height="8" rx="3" fill={card} stroke="#0284c7" strokeWidth="1" />
                    <rect x="18" y="79" width="28" height="8" rx="3" fill={card} stroke="#d97706" strokeWidth="1" />
                    <rect x="56" y="79" width="28" height="8" rx="3" fill={card} stroke="#d97706" strokeWidth="1" />
                </svg>
            );

        case 'step_by_step':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    {[0, 1, 2].map((i) => {
                        const y = 14 + i * 28;
                        return (
                            <g key={i}>
                                {i < 2 && <line x1="25" y1={y + 18} x2="25" y2={y + 30} stroke={accentHex} strokeWidth="2" />}
                                <circle cx="25" cy={y + 10} r="9" fill={accentHex} />
                                <text x="25" y={y + 14} fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">{i + 1}</text>
                                <rect x="42" y={y} width="104" height="20" rx="5" fill={card} stroke={muted} strokeWidth="1.2" />
                                <rect x="48" y={y + 6} width="54" height="3.5" rx="1.5" fill={accentHex} />
                                <rect x="48" y={y + 12} width="84" height="2.5" rx="1" fill={muted} />
                            </g>
                        );
                    })}
                </svg>
            );

        case 'flowchart':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="58" y="7" width="44" height="14" rx="7" fill="#10b981" />
                    <line x1="80" y1="21" x2="80" y2="29" stroke={textTone} strokeWidth="1.6" />
                    <rect x="50" y="29" width="60" height="16" rx="3" fill={card} stroke="#2563eb" strokeWidth="1.5" />
                    <line x1="80" y1="45" x2="80" y2="52" stroke={textTone} strokeWidth="1.6" />
                    <polygon points="80,52 104,65 80,78 56,65" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
                    <line x1="104" y1="65" x2="132" y2="65" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="118" y="76" width="32" height="14" rx="7" fill={accentHex} />
                    <line x1="134" y1="65" x2="134" y2="76" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="56" y1="65" x2="26" y2="65" stroke="#ef4444" strokeWidth="1.5" />
                    <line x1="26" y1="65" x2="26" y2="37" stroke="#ef4444" strokeWidth="1.5" />
                    <line x1="26" y1="37" x2="50" y2="37" stroke="#ef4444" strokeWidth="1.5" />
                </svg>
            );

        case 'timeline':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <line x1="18" y1="50" x2="142" y2="50" stroke={accentHex} strokeWidth="3" strokeLinecap="round" />
                    {[30, 64, 98, 130].map((cx, idx) => (
                        <g key={idx}>
                            <circle cx={cx} cy="50" r="6" fill={accentHex} stroke="#fff" strokeWidth="1.8" />
                            <line x1={cx} y1={idx % 2 === 0 ? 44 : 56} x2={cx} y2={idx % 2 === 0 ? 32 : 68} stroke={muted} strokeWidth="1.5" />
                            <rect x={cx - 16} y={idx % 2 === 0 ? 14 : 68} width="32" height="18" rx="4" fill={card} stroke={muted} strokeWidth="1.2" />
                        </g>
                    ))}
                </svg>
            );

        case 'cycle_diagram':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <circle cx="80" cy="50" r="28" fill="none" stroke={accentHex} strokeWidth="2.5" strokeDasharray="12,5" />
                    <circle cx="80" cy="50" r="11" fill={accentHex} opacity="0.2" />
                    <rect x="64" y="11" width="32" height="15" rx="4" fill="#0284c7" />
                    <rect x="108" y="42" width="32" height="15" rx="4" fill="#059669" />
                    <rect x="64" y="74" width="32" height="15" rx="4" fill="#d97706" />
                    <rect x="20" y="42" width="32" height="15" rx="4" fill="#7c3aed" />
                </svg>
            );

        case 'comparison_chart':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="12" y="12" width="136" height="76" rx="6" fill={card} stroke={muted} strokeWidth="1.3" />
                    <rect x="12" y="12" width="136" height="18" rx="5" fill={accentHex} />
                    <line x1="54" y1="12" x2="54" y2="88" stroke={muted} strokeWidth="1.2" />
                    <line x1="102" y1="12" x2="102" y2="88" stroke={muted} strokeWidth="1.2" />
                    <line x1="12" y1="48" x2="148" y2="48" stroke={muted} strokeWidth="1" />
                    <line x1="12" y1="68" x2="148" y2="68" stroke={muted} strokeWidth="1" />
                </svg>
            );

        case 't_chart':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="14" y="12" width="132" height="76" rx="6" fill={card} stroke={muted} strokeWidth="1.2" />
                    <line x1="14" y1="30" x2="146" y2="30" stroke={accentHex} strokeWidth="3.5" />
                    <line x1="80" y1="14" x2="80" y2="88" stroke={accentHex} strokeWidth="3.5" />
                    <rect x="24" y="18" width="44" height="6" rx="2" fill="#0284c7" />
                    <rect x="92" y="18" width="44" height="6" rx="2" fill="#e11d48" />
                    <rect x="22" y="40" width="48" height="4" rx="2" fill={muted} />
                    <rect x="22" y="54" width="42" height="4" rx="2" fill={muted} />
                    <rect x="90" y="40" width="48" height="4" rx="2" fill={muted} />
                    <rect x="90" y="54" width="42" height="4" rx="2" fill={muted} />
                </svg>
            );

        case 'frayer_model':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="12" y="10" width="64" height="36" rx="4" fill={card} stroke="#0284c7" strokeWidth="1.4" />
                    <rect x="84" y="10" width="64" height="36" rx="4" fill={card} stroke="#7c3aed" strokeWidth="1.4" />
                    <rect x="12" y="54" width="64" height="36" rx="4" fill={card} stroke="#059669" strokeWidth="1.4" />
                    <rect x="84" y="54" width="64" height="36" rx="4" fill={card} stroke="#e11d48" strokeWidth="1.4" />
                    <polygon points="80,32 106,50 80,68 54,50" fill={accentHex} stroke="#ffffff" strokeWidth="2" />
                </svg>
            );

        case 'kwl_chart':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    {[0, 1, 2].map((i) => {
                        const x = 12 + i * 47;
                        const colors = ['#0284c7', '#d97706', '#059669'];
                        const letters = ['K', 'W', 'L'];
                        return (
                            <g key={i}>
                                <rect x={x} y="12" width="42" height="76" rx="5" fill={card} stroke={colors[i]} strokeWidth="1.3" />
                                <rect x={x} y="12" width="42" height="18" rx="4" fill={colors[i]} />
                                <text x={x + 21} y="24" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff">{letters[i]}</text>
                                <rect x={x + 6} y="38" width="30" height="4" rx="2" fill={muted} />
                                <rect x={x + 6} y="48" width="24" height="4" rx="2" fill={muted} />
                                <rect x={x + 6} y="58" width="28" height="4" rx="2" fill={muted} />
                            </g>
                        );
                    })}
                </svg>
            );

        case 'comic_strip':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    {[0, 1, 2, 3].map((i) => {
                        const x = i % 2 === 0 ? 12 : 84;
                        const y = i < 2 ? 10 : 53;
                        return (
                            <g key={i}>
                                <rect x={x} y={y} width="64" height="37" rx="4" fill={card} stroke="#1e293b" strokeWidth="1.5" />
                                <circle cx={x + 14} cy={y + 24} r="6" fill="#fb923c" />
                                <circle cx={x + 50} cy={y + 24} r="6" fill="#38bdf8" />
                                <rect x={x + 20} y={y + 6} width="26" height="10" rx="5" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
                            </g>
                        );
                    })}
                </svg>
            );

        case 'storyboard':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    {[0, 1, 2].map((i) => {
                        const x = 12 + i * 47;
                        return (
                            <g key={i}>
                                <rect x={x} y="14" width="42" height="72" rx="4" fill={card} stroke={muted} strokeWidth="1.2" />
                                <rect x={x + 4} y="18" width="34" height="26" rx="3" fill="#0f172a" />
                                <circle cx={x + 21} cy="31" r="6" fill={accentHex} />
                                <rect x={x + 4} y="50" width="30" height="4" rx="1.5" fill={accentHex} />
                                <rect x={x + 4} y="58" width="34" height="3" rx="1" fill={muted} />
                                <rect x={x + 4} y="65" width="26" height="3" rx="1" fill={muted} />
                            </g>
                        );
                    })}
                </svg>
            );

        case 'story_map':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <path d="M26 70 Q54 20 80 44 Q106 68 134 26" fill="none" stroke={accentHex} strokeWidth="2.5" strokeDasharray="4,3" />
                    <rect x="12" y="60" width="32" height="22" rx="4" fill={card} stroke="#0284c7" strokeWidth="1.3" />
                    <rect x="48" y="14" width="34" height="22" rx="4" fill={card} stroke="#d97706" strokeWidth="1.3" />
                    <rect x="86" y="54" width="34" height="22" rx="4" fill={card} stroke="#e11d48" strokeWidth="1.3" />
                    <rect x="116" y="14" width="32" height="22" rx="4" fill={card} stroke="#059669" strokeWidth="1.3" />
                </svg>
            );

        case 'flashcard':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="14" y="14" width="60" height="72" rx="6" fill={card} stroke={accentHex} strokeWidth="1.5" />
                    <rect x="22" y="24" width="44" height="6" rx="2" fill={accentHex} opacity="0.25" />
                    <text x="44" y="54" fontSize="18" fontWeight="800" textAnchor="middle" fill={accentHex}>?</text>
                    <rect x="86" y="14" width="60" height="72" rx="6" fill={accentHex} />
                    <rect x="94" y="28" width="44" height="5" rx="2" fill="#ffffff" />
                    <rect x="94" y="39" width="36" height="4" rx="2" fill="#ffffff" opacity="0.7" />
                    <rect x="94" y="48" width="40" height="4" rx="2" fill="#ffffff" opacity="0.7" />
                </svg>
            );

        case 'quiz_cards':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    {[0, 1].map((i) => {
                        const x = 14 + i * 68;
                        return (
                            <g key={i}>
                                <rect x={x} y="14" width="64" height="72" rx="6" fill={card} stroke={muted} strokeWidth="1.3" />
                                <rect x={x} y="14" width="64" height="16" rx="5" fill={i === 0 ? accentHex : '#7c3aed'} />
                                <rect x={x + 8} y="38" width="48" height="4" rx="2" fill={muted} />
                                <rect x={x + 8} y="47" width="38" height="4" rx="2" fill={muted} />
                                <rect x={x + 8} y="64" width="48" height="14" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                            </g>
                        );
                    })}
                </svg>
            );

        case 'isometric_3d':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <polygon points="80,14 118,32 80,50 42,32" fill="#818cf8" stroke="#312e81" strokeWidth="1.5" />
                    <polygon points="42,32 80,50 80,86 42,68" fill="#4f46e5" stroke="#312e81" strokeWidth="1.5" />
                    <polygon points="80,50 118,32 118,68 80,86" fill="#6366f1" stroke="#312e81" strokeWidth="1.5" />
                    <circle cx="80" cy="32" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="1.2" />
                    <circle cx="60" cy="60" r="5" fill="#10b981" stroke="#fff" strokeWidth="1.2" />
                    <circle cx="102" cy="58" r="5" fill="#0284c7" stroke="#fff" strokeWidth="1.2" />
                </svg>
            );

        case 'cutaway_diagram':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <circle cx="62" cy="50" r="34" fill={accentHex} />
                    <path d="M62 16 A34 34 0 0 1 96 50 L62 50 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
                    <circle cx="62" cy="50" r="16" fill="#fb923c" />
                    <circle cx="62" cy="50" r="7" fill="#fef08a" />
                    <line x1="88" y1="30" x2="112" y2="24" stroke={textTone} strokeWidth="1.3" />
                    <line x1="78" y1="50" x2="112" y2="50" stroke={textTone} strokeWidth="1.3" />
                    <line x1="68" y1="68" x2="112" y2="76" stroke={textTone} strokeWidth="1.3" />
                    <rect x="114" y="18" width="34" height="10" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="114" y="45" width="34" height="10" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="114" y="71" width="34" height="10" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                </svg>
            );

        case 'cross_section':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="18" y="14" width="124" height="18" rx="3" fill="#22c55e" />
                    <rect x="18" y="34" width="124" height="18" rx="3" fill="#b45309" />
                    <rect x="18" y="54" width="124" height="16" rx="3" fill="#ea580c" />
                    <rect x="18" y="72" width="124" height="16" rx="3" fill="#7c2d12" />
                    <rect x="28" y="20" width="44" height="5" rx="2" fill="#ffffff" />
                    <rect x="28" y="40" width="54" height="5" rx="2" fill="#ffffff" />
                    <rect x="28" y="59" width="48" height="5" rx="2" fill="#ffffff" />
                </svg>
            );

        case 'scientific_diagram':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <circle cx="80" cy="50" r="22" fill={accentHex} opacity="0.2" stroke={accentHex} strokeWidth="2" />
                    <circle cx="80" cy="50" r="9" fill={accentHex} />
                    <line x1="62" y1="38" x2="44" y2="24" stroke={accentHex} strokeWidth="1.4" />
                    <line x1="62" y1="62" x2="44" y2="74" stroke={accentHex} strokeWidth="1.4" />
                    <line x1="98" y1="38" x2="116" y2="24" stroke={accentHex} strokeWidth="1.4" />
                    <line x1="98" y1="62" x2="116" y2="74" stroke={accentHex} strokeWidth="1.4" />
                    <rect x="10" y="16" width="34" height="14" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="10" y="68" width="34" height="14" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="116" y="16" width="34" height="14" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="116" y="68" width="34" height="14" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                </svg>
            );

        case 'paper_cut_3d':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="14" y="12" width="132" height="76" rx="8" fill="#0284c7" opacity="0.25" />
                    <path d="M14 54 Q52 38 86 52 Q118 66 146 46 V88 H14 Z" fill="#059669" opacity="0.7" />
                    <path d="M14 68 Q62 54 102 68 Q128 76 146 62 V88 H14 Z" fill={accentHex} />
                    <circle cx="116" cy="28" r="10" fill="#fbbf24" />
                </svg>
            );

        case 'illustrated_poster':
            return (
                <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block rounded-lg">
                    <rect width="160" height="100" rx="8" fill={bg} />
                    <rect x="14" y="10" width="132" height="14" rx="3" fill={accentHex} />
                    <rect x="18" y="29" width="124" height="44" rx="6" fill={card} stroke={accentHex} strokeWidth="1.5" />
                    <circle cx="80" cy="51" r="14" fill={accentHex} opacity="0.25" />
                    <circle cx="80" cy="51" r="7" fill={accentHex} />
                    <rect x="18" y="78" width="38" height="12" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="61" y="78" width="38" height="12" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                    <rect x="104" y="78" width="38" height="12" rx="3" fill={card} stroke={muted} strokeWidth="1" />
                </svg>
            );
    }
};
