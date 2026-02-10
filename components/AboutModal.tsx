
import React, { useState } from 'react';
import { LogoIcon, CheckIcon, SparklesIcon, ToolsIcon, BlueprintIcon, TrendingUpIcon, BookIcon } from './Shared';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GLOSSARY = [
    { term: 'Usinagem J-Pull', desc: 'Puxador tipo cava usinado diretamente na borda superior ou lateral do MDF de 18mm.' },
    { term: 'Nesting / Ninho', desc: 'Estratégia de plano de corte que agrupa peças complexas para máximo aproveitamento da chapa.' },
    { term: 'PBR Textures', desc: 'Physically Based Rendering: texturas de MDF que reagem à luz com brilho e rugosidade reais.' },
    { term: 'Meia-Esquadria 45º', desc: 'Corte angular para fechamento de cantos onde o topo do MDF não fica aparente.' },
    { term: 'LED 3000K Warm', desc: 'Iluminação amarelada aconchegante, ideal para nichos de madeira e quartos.' },
    { term: 'Corrediça Oculta', desc: 'Ferragem de gaveta instalada sob o fundo, deixando o visual interno 100% limpo.' },
    { term: 'Puxador Cava', desc: 'Rebaixo feito na marcenaria para abertura manual sem necessidade de peças metálicas externas.' },
    { term: 'Tamponamento 36mm', desc: 'Uso de chapas duplas para criar uma moldura robusta em volta dos armários.' }
];

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'strategy' | 'glossary'>('strategy');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[200] flex justify-center items-center p-4 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#1a1414] rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-10 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center bg-[#f5f1e8] dark:bg-[#1a1414] gap-6">
                    <div className="flex items-center gap-5">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <LogoIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Suporte Técnico HD</h2>
                            <p className="text-[10px] text-[#b99256] font-black uppercase tracking-[0.3em] mt-1">Inteligência MarcenApp v2.5.2</p>
                        </div>
                    </div>
                    <div className="flex bg-black/10 p-1.5 rounded-2xl border border-black/5">
                        <button onClick={() => setActiveTab('strategy')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'strategy' ? 'bg-[#3e3535] text-white shadow-lg' : 'text-gray-400'}`}>Estratégia</button>
                        <button onClick={() => setActiveTab('glossary')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'glossary' ? 'bg-[#3e3535] text-white shadow-lg' : 'text-gray-400'}`}>Dicionário Técnico</button>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto custom-scrollbar p-10 lg:p-14">
                    {activeTab === 'strategy' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-7 space-y-12">
                                <section>
                                    <h3 className="text-xl font-black text-[#3e3535] dark:text-white uppercase italic tracking-tighter mb-4">A Tese de Valor</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                        O MarcenaPP domina a jornada do projeto antes mesmo dele chegar à produção física, transformando rascunhos em ativos de engenharia prontos para o checkout.
                                    </p>
                                </section>
                                <section className="space-y-6">
                                    <h3 className="text-xs font-black uppercase text-[#b99256] tracking-[0.3em]">Estrutura Growth</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-100 dark:bg-black/20 p-6 rounded-[2rem] border border-gray-200 dark:border-white/5">
                                            <h4 className="text-[10px] font-black uppercase text-[#3e3535] dark:text-white mb-2 italic">Conversão 8K</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Impacto visual imediato que reduz o ciclo de venda.</p>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-black/20 p-6 rounded-[2rem] border border-gray-200 dark:border-white/5">
                                            <h4 className="text-[10px] font-black uppercase text-[#3e3535] dark:text-white mb-2 italic">Ponte de Materiais</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Integração direta com o balcão do fornecedor.</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                            <div className="lg:col-span-5">
                                <div className="bg-[#3e3535] p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden group shadow-2xl">
                                    <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12"><TrendingUpIcon className="w-64 h-64" /></div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase italic tracking-tighter text-[#d4ac6e] mb-2">Target Exit Valuation</h3>
                                        <p className="text-5xl font-black tracking-tighter">R$ 100M</p>
                                        <p className="text-[9px] font-black uppercase text-gray-400 mt-1 tracking-widest">Roadmap: 2026/2027</p>
                                    </div>
                                    <button className="w-full bg-[#d4ac6e] text-black font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Baixar Deck Investidor</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                            {GLOSSARY.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#2d2424] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-[#d4ac6e]/10 p-2 rounded-lg text-[#b99256]">
                                            <ToolsIcon className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs font-black uppercase text-[#3e3535] dark:text-white">{item.term}</h4>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium italic">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <footer className="p-8 border-t border-gray-100 dark:border-white/5 bg-[#f5f1e8] dark:bg-[#1a1414] flex justify-center">
                    <button onClick={onClose} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all">Voltar ao App</button>
                </footer>
            </div>
        </div>
    );
};
