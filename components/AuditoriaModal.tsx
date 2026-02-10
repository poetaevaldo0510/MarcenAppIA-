
import React from 'react';
import { SparklesIcon, CheckIcon, ToolsIcon, UserIcon, Spinner, LogoIcon, ARIcon } from './Shared';

interface AuditoriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: { ergonomics: string[], trends: string[], technical: string[] } | null;
    isLoading: boolean;
    onApply: (suggestion: string) => void;
}

export const AuditoriaModal: React.FC<AuditoriaModalProps> = ({ isOpen, onClose, data, isLoading, onApply }) => {
    if (!isOpen) return null;

    const Section = ({ title, items, icon: Icon, color }: any) => (
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 hover:border-[#d4ac6e]/30 transition-all group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg mb-2`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">{title}</h3>
            <ul className="space-y-3">
                {items?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 group/item">
                        <button 
                            onClick={() => onApply(item)}
                            className="bg-green-500/20 text-green-500 p-1 rounded-lg mt-0.5 opacity-40 group-hover/item:opacity-100 transition-opacity"
                        >
                            <CheckIcon className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] text-gray-400 leading-relaxed font-medium group-hover/item:text-white transition-colors cursor-pointer" onClick={() => onApply(item)}>
                            {item}
                        </span>
                    </li>
                ))}
                {(!items || items.length === 0) && (
                    <li className="text-[10px] text-gray-600 italic">Nenhuma sugestão detectada nesta categoria.</li>
                )}
            </ul>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/95 z-[900] flex justify-center items-center p-4 backdrop-blur-xl animate-fadeIn">
            <div className="bg-[#110e0e] rounded-[3.5rem] w-full max-w-5xl h-[85vh] shadow-[0_0_100px_rgba(212,172,110,0.1)] border border-white/5 flex flex-col overflow-hidden animate-scaleIn">
                <header className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1a1414]">
                    <div className="flex items-center gap-5">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <ARIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Consultoria Premium 2025</h2>
                            <p className="text-[10px] text-[#b99256] font-black uppercase tracking-[0.4em] mt-1.5">Auditado por Iara Vision Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-white text-5xl font-light transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto custom-scrollbar p-10 bg-gradient-to-b from-[#1a1414] to-[#0a0808]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-8">
                            <Spinner size="lg" />
                            <div className="text-center">
                                <p className="text-sm font-black text-[#d4ac6e] uppercase tracking-[0.6em] animate-pulse">Analisando DNA do Projeto...</p>
                                <p className="text-[10px] text-gray-600 font-bold uppercase mt-4">Calculando Ergonomia e Tendências de Milão</p>
                            </div>
                        </div>
                    ) : data ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
                            <Section title="Conforto & Ergonomia" items={data.ergonomics} icon={UserIcon} color="bg-blue-500/10 text-blue-500" />
                            <Section title="Tendências de Luxo 2025" items={data.trends} icon={SparklesIcon} color="bg-[#d4ac6e]/10 text-[#d4ac6e]" />
                            <Section title="Inteligência de Oficina" items={data.technical} icon={ToolsIcon} color="bg-purple-500/10 text-purple-500" />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center opacity-20">
                            <LogoIcon className="w-32 h-32" />
                        </div>
                    )}
                </main>

                <footer className="p-10 bg-[#1a1414] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                        Clique em uma sugestão técnica para que a Iara aplique a mudança automaticamente ao render.
                    </p>
                    <button onClick={onClose} className="bg-white/5 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/10">
                        Fechar Painel
                    </button>
                </footer>
            </div>
        </div>
    );
};
