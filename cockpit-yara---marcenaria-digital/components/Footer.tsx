
import React from 'react';
import { LogoIcon, TicketIcon, SparklesIcon, BookIcon, ToolsIcon, InfoIcon } from './Shared';

interface FooterProps {
    onOpenLegal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
    return (
        <footer className="bg-[#3e3535] text-[#f5f1e8] mt-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Coluna 1: Identidade */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 opacity-60">
                            <LogoIcon className="w-8 h-8" />
                            <span className="text-xl font-black uppercase italic tracking-tighter">Massa na PP</span>
                        </div>
                        <p className="text-sm text-[#a89d8d] leading-relaxed max-w-xs">
                            Tecnologia de ponta para marcenaria profissional. Projetos, engenharia e gestão em um único ecossistema digital.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <button onClick={onOpenLegal} className="text-[10px] font-black uppercase tracking-widest text-[#d4ac6e] hover:underline">Privacidade</button>
                            <span className="text-white/10">•</span>
                            <button onClick={onOpenLegal} className="text-[10px] font-black uppercase tracking-widest text-[#d4ac6e] hover:underline">Termos</button>
                        </div>
                    </div>

                    {/* Coluna 2: Política de Créditos */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4ac6e] flex items-center gap-2">
                            <TicketIcon className="w-4 h-4" /> Uso de Créditos
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-white/5 rounded-lg text-[#d4ac6e] flex-shrink-0">
                                    <SparklesIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">1 Crédito = 1 Projeto Novo</p>
                                    <p className="text-xs text-[#8a7e7e]">Cada nova renderização a partir de rascunho ou foto consome 1 crédito do saldo.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-white/5 rounded-lg text-amber-500 flex-shrink-0">
                                    <ToolsIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Módulos Inclusos</p>
                                    <p className="text-xs text-[#8a7e7e]">BOM, Plano de Corte e Ajustes de LED estão inclusos para cada projeto gerado com sucesso.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 3: Transparência IA */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4ac6e] flex items-center gap-2">
                            <InfoIcon className="w-4 h-4" /> Importante
                        </h3>
                        <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                            <p className="text-[11px] text-[#a89d8d] leading-relaxed">
                                As estimativas de materiais e renderizações são geradas por Inteligência Artificial. <strong>É obrigatória a revisão técnica por um profissional</strong> antes da execução final ou compra de insumos. O sistema otimiza o tempo, mas não substitui a conferência em obra.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[9px] font-bold text-[#8a7e7e] uppercase tracking-[0.2em]">
                        © 2025 Massa na PP - Marcenaria Digital
                    </p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Powered by Iara AI v2.5</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
