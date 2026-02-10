
import React, { useState } from 'react';
import { CheckIcon, PencilIcon, ToolsIcon, LogoIcon, SparklesIcon, Spinner, WandIcon } from './Shared';
import { refineTechnicalText } from '../services/geminiService';

interface TechnicalEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (text: string) => void;
    initialText: string;
}

export const TechnicalEditorModal: React.FC<TechnicalEditorModalProps> = ({ isOpen, onClose, onApply, initialText }) => {
    const [text, setText] = useState(initialText);
    const [isRefining, setIsRefining] = useState(false);

    if (!isOpen) return null;

    const handleRefine = async () => {
        if (!text.trim() || isRefining) return;
        setIsRefining(true);
        try {
            const refined = await refineTechnicalText(text);
            setText(refined);
        } catch (e) {
            console.error("Erro ao refinar texto");
        } finally {
            setIsRefining(false);
        }
    };

    const templates = [
        { 
            name: 'Luxury Elite Finish 2025', 
            content: '[ELITE_SPEC]: Aplicar acabamento premium de Laca Fosca com toque de seda (PBR), zero reflexos especulares. [GEO_SYNC]: Garantir alinhamento de veios (Grain Matching) em todas as superfícies madeiradas com reflexos anisotrópicos realistas. [LIGHT]: Iluminação Softbox de Estúdio HD.',
            icon: SparklesIcon,
            highlight: true
        },
        { name: 'MDF & Frentes', content: '[MATERIAL_LOCK]: Substituir frentes por MDF Freijó com veios verticais sincronizados. Estrutura interna em MDF Branco TX 15mm.' },
        { name: 'Iluminação Pro', content: '[LIGHT_ENGINE]: Adicionar perfis de LED 3000K Warm White embutidos em todos os nichos superiores e prateleiras de vidro.' },
        { name: 'Puxadores Cava', content: '[TECH_DETAIL]: Implementar usinagem tipo cava J-Pull integrada na borda superior das portas e gavetas para estética minimalista.' },
        { name: 'Estrutura Interna', content: '[GEO_ADJUST]: Configurar divisórias internas para prateleiras móveis e gavetões com corrediças invisíveis tipo Blum Movento.' }
    ];

    return (
        <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl animate-fadeIn">
            <div className="bg-[#110e0e] rounded-[3rem] w-full max-w-4xl h-[85vh] shadow-[0_0_100px_rgba(212,172,110,0.1)] border border-white/5 flex flex-col overflow-hidden animate-scaleIn">
                <header className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1a1414]">
                    <div className="flex items-center gap-5">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <PencilIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Bancada de Escrita</h2>
                            <p className="text-[10px] text-[#b99256] font-black uppercase tracking-[0.4em] mt-1.5">Refinamento Estruturado de Briefing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-white text-5xl font-light transition-all active:scale-90">&times;</button>
                </header>

                <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    <aside className="w-full lg:w-80 bg-black/40 border-r border-white/5 p-6 overflow-y-auto custom-scrollbar">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <ToolsIcon className="w-3.5 h-3.5" /> Blocos Assertivos
                        </h3>
                        <div className="space-y-3">
                            {templates.map((tpl) => (
                                <button 
                                    key={tpl.name}
                                    onClick={() => setText(tpl.content)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all group ${tpl.highlight ? 'bg-[#d4ac6e]/10 border-[#d4ac6e]/30' : 'bg-white/5 border-white/5 hover:border-[#d4ac6e]/30'}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-[11px] font-black uppercase tracking-tight group-hover:text-[#d4ac6e] ${tpl.highlight ? 'text-[#d4ac6e]' : 'text-white'}`}>{tpl.name}</p>
                                        {tpl.highlight && <SparklesIcon className="w-3 h-3 text-[#d4ac6e]" />}
                                    </div>
                                    <p className="text-[9px] text-gray-500 leading-tight line-clamp-2">{tpl.content}</p>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="flex-1 p-8 flex flex-col gap-6 bg-[#0a0808] relative">
                        <div className="flex-grow relative">
                            <textarea 
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Redija aqui sua instrução assertiva... Ex: [MATERIAL_LOCK]: MDF Carvalho Malva em tudo."
                                className="w-full h-full bg-black/40 border-2 border-white/5 rounded-[2rem] p-8 text-lg font-medium text-white/90 outline-none focus:border-[#d4ac6e]/50 transition-all shadow-inner resize-none custom-scrollbar"
                            />
                            
                            <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                {isRefining && (
                                    <div className="bg-black/80 px-4 py-2 rounded-xl border border-white/5 animate-fadeIn flex items-center gap-2">
                                        <Spinner size="sm" />
                                        <span className="text-[9px] font-black text-[#d4ac6e] uppercase tracking-widest">Revisando comandos...</span>
                                    </div>
                                )}
                                <button 
                                    onClick={handleRefine}
                                    disabled={!text.trim() || isRefining}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-95 ${text.trim() && !isRefining ? 'bg-[#d4ac6e] text-black hover:rotate-12' : 'bg-white/5 text-white/20'}`}
                                    title="Tornar Texto Assertivo com IA"
                                >
                                    <WandIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
                                <LogoIcon className="w-24 h-24" />
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="p-8 bg-[#1a1414] border-t border-white/5 flex justify-between items-center">
                    <div className="flex flex-col gap-1 max-w-sm">
                        <div className="flex items-center gap-2">
                             <CheckIcon className="w-3 h-3 text-green-500" />
                             <p className="text-[10px] text-white font-black uppercase tracking-widest">Protocolo de Alta Fidelidade Ativo</p>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-relaxed uppercase tracking-tighter">Comandos prefixados garantem que a Iara não faça alterações artísticas indesejadas.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest hover:text-white transition-all">Cancelar</button>
                        <button 
                            onClick={() => onApply(text)}
                            className="bg-[#d4ac6e] text-black px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3"
                        >
                            <CheckIcon className="w-4 h-4" /> Carregar no Chat
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
