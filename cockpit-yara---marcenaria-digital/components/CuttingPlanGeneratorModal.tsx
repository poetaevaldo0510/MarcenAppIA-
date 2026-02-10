
import React, { useState, useEffect, useMemo } from 'react';
import { Spinner, BlueprintIcon, RulerIcon, CheckIcon, SawIcon, ArrowRightIcon, ArrowsExpandIcon, Rotate3DIcon } from './Shared';
import { packParts, calculateSheetEfficiency, Part, Sheet } from '../services/nestingService';
import type { ProjectHistoryItem } from '../types';

interface CuttingPlanGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem | null;
    onSave: (plan: string, image: string, optimization: string) => Promise<void>;
    showAlert: (message: string, title?: string) => void;
}

const SHEET_WIDTH = 2730;
const SHEET_HEIGHT = 1830;

export const CuttingPlanGeneratorModal: React.FC<CuttingPlanGeneratorModalProps> = ({ isOpen, onClose, project, onSave, showAlert }) => {
    const [materialFilter, setMaterialFilter] = useState<'all' | 'white' | 'wood'>('all');
    const [optimizedSheets, setOptimizedSheets] = useState<Sheet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [parts, setParts] = useState<Part[]>([]);

    useEffect(() => {
        if (isOpen && project?.bom) {
            parseBOMToParts(project.bom);
        }
    }, [isOpen, project]);

    const parseBOMToParts = (bomText: string) => {
        setIsLoading(true);
        // Simula o tempo do Bento interpretando a lista
        setTimeout(() => {
            // Regex para extrair medidas do texto da BOM (ex: 2x 700x500mm)
            const lines = bomText.split('\n');
            const detectedParts: Part[] = [];
            
            lines.forEach((line, idx) => {
                const match = line.match(/(\d+)x\s+(\d+)[x|*](\d+)/i);
                if (match) {
                    const qtd = parseInt(match[1]);
                    const w = parseInt(match[2]);
                    const h = parseInt(match[3]);
                    const isWood = line.toLowerCase().includes('freijó') || line.toLowerCase().includes('amadeirado');
                    
                    detectedParts.push({
                        id: idx,
                        name: line.split(':')[0].replace(/[*-]/g, '').trim() || 'Peça Técnica',
                        w: Math.max(w, h),
                        h: Math.min(w, h),
                        qtd,
                        material: isWood ? 'wood' : 'white'
                    });
                }
            });

            setParts(detectedParts);
            setIsLoading(false);
        }, 800);
    };

    const sheets = useMemo(() => {
        const filtered = parts.filter(p => materialFilter === 'all' || p.material === materialFilter);
        return packParts(filtered);
    }, [parts, materialFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[700] flex justify-center items-center p-2 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#0f0f0f] rounded-[2.5rem] w-full max-w-7xl max-h-[95vh] shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="px-8 py-6 border-b border-[#e6ddcd] dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#1a141a]">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <SawIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Corte Mestre Ultra</h2>
                            <p className="text-[10px] text-[#8a7e7e] font-black uppercase tracking-widest mt-1.5">Otimização Industrial 2.73 x 1.83m</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="hidden md:flex bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5">
                            {(['all', 'white', 'wood'] as const).map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setMaterialFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${materialFilter === f ? 'bg-[#3e3535] text-[#d4ac6e] shadow-lg' : 'text-gray-400'}`}
                                >
                                    {f === 'all' ? 'Ver Tudo' : f === 'white' ? 'MDF Branco' : 'Amadeirado'}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="text-[#a89d8d] hover:text-red-500 text-4xl font-light transition-all">&times;</button>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto custom-scrollbar bg-[#fdfaf5] dark:bg-[#080808] p-8">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                            <Spinner size="lg" />
                            <h3 className="text-2xl font-black text-[#3e3535] dark:text-[#f5f1e8] uppercase italic animate-pulse mt-8">Bento calibrando a serra...</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Barra Lateral de Status */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Métricas do Lote</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Peças</span>
                                            <span className="text-sm font-black dark:text-white">{parts.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Chapas</span>
                                            <span className="text-sm font-black dark:text-white">{sheets.length}</span>
                                        </div>
                                        <div className="pt-4 border-t border-gray-50 dark:border-white/5">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[9px] font-black text-[#d4ac6e] uppercase">Aproveitamento Médio</span>
                                                <span className="text-xl font-black dark:text-white">{sheets[0] ? calculateSheetEfficiency(sheets[0]) : 0}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#d4ac6e]" style={{ width: `${sheets[0] ? calculateSheetEfficiency(sheets[0]) : 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20">
                                    <h4 className="text-[9px] font-black text-blue-600 uppercase mb-2">Regras de Oficina</h4>
                                    <ul className="text-[10px] text-blue-800/70 dark:text-blue-300 space-y-2 font-medium italic">
                                        <li>• Serra (Kerf): 3mm inclusos</li>
                                        <li>• Veio: Travado em Amadeirados</li>
                                        <li>• Refile: 10mm em todo o perímetro</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Visualizador das Chapas */}
                            <div className="lg:col-span-9 space-y-12">
                                {sheets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                        <BlueprintIcon className="w-20 h-20 mb-4" />
                                        <p className="font-black uppercase tracking-widest">Nenhuma peça detectada na BOM.</p>
                                    </div>
                                ) : (
                                    sheets.map((sheet, sIdx) => (
                                        <div key={sheet.id} className="bg-white dark:bg-[#111] p-8 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 space-y-6">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-[#3e3535] text-[#d4ac6e] w-10 h-10 rounded-xl flex items-center justify-center font-black">
                                                        {sIdx + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">Mapa de Corte #{sheet.id}</h3>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{sheet.items.length} Peças no plano</p>
                                                    </div>
                                                </div>
                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800">
                                                    <span className="text-[10px] font-black text-emerald-600">{calculateSheetEfficiency(sheet)}% Útil</span>
                                                </div>
                                            </div>

                                            {/* CANVAS DE CORTE */}
                                            <div 
                                                className="relative w-full bg-gray-200 dark:bg-black border-2 border-[#3e3535] rounded-xl shadow-inner overflow-hidden group"
                                                style={{ aspectRatio: `${SHEET_WIDTH}/${SHEET_HEIGHT}` }}
                                            >
                                                {/* Grid de Fundo */}
                                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                                                     style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
                                                </div>

                                                {sheet.items.map((item, iIdx) => (
                                                    <div
                                                        key={item.uniqueId}
                                                        className={`absolute border border-black/20 flex flex-col items-center justify-center text-[7px] md:text-[9px] font-black leading-none text-center transition-all hover:z-20 hover:scale-[1.01] hover:shadow-2xl cursor-help
                                                            ${item.material === 'white' ? 'bg-[#f0f9ff] text-blue-900' : 'bg-[#fffbeb] text-amber-900'}
                                                        `}
                                                        style={{
                                                            left: `${(item.x! / SHEET_WIDTH) * 100}%`,
                                                            top: `${(item.y! / SHEET_HEIGHT) * 100}%`,
                                                            width: `${(item.w / SHEET_WIDTH) * 100}%`,
                                                            height: `${(item.h / SHEET_HEIGHT) * 100}%`,
                                                        }}
                                                    >
                                                        <span className="truncate w-full px-1">{item.name}</span>
                                                        <span className="text-[6px] md:text-[8px] opacity-40 font-bold mt-1">
                                                            {item.w} x {item.h}
                                                        </span>
                                                        {item.rotated && <Rotate3DIcon className="absolute bottom-1 right-1 w-2 h-2 opacity-30" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </main>

                <footer className="px-8 py-6 border-t border-[#e6ddcd] dark:border-white/5 bg-[#f5f1e8] dark:bg-[#1a141a] flex justify-between items-center">
                    <button onClick={onClose} className="px-8 py-3 font-black text-[#8a7e7e] hover:text-[#3e3535] dark:hover:text-white uppercase text-[10px] tracking-widest">Sair da Oficina</button>
                    <div className="flex gap-4">
                        <button className="bg-white dark:bg-white/5 text-[#3e3535] dark:text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] border border-black/5 shadow-sm active:scale-95 transition-all">Baixar PDF de Corte</button>
                        <button 
                            onClick={async () => {
                                await onSave("Plano de Corte Otimizado v2", "", "Eficiência Industrial Aplicada");
                                onClose();
                            }} 
                            className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-black px-10 py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                        >
                            <CheckIcon className="w-4 h-4" /> Vincular ao Dossiê
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
