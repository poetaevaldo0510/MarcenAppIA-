
import React from 'react';
import type { ToolInfo } from '../types';
import { InfoIcon, SparklesIcon, TicketIcon, CheckIcon } from './Shared';

interface ToolExplainerProps {
    isOpen: boolean;
    tool: ToolInfo | null;
    onClose: () => void;
}

export const ToolExplainer: React.FC<ToolExplainerProps> = ({ isOpen, tool, onClose }) => {
    if (!isOpen || !tool) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex justify-center items-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-[#2d2424] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="bg-[#f5f1e8] dark:bg-[#3e3535] p-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
                    <div className="bg-[#d4ac6e] p-3 rounded-2xl text-[#3e3535]">
                        <tool.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter">{tool.title}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <TicketIcon className="w-3 h-3 text-[#b99256]" />
                            <span className="text-[10px] font-black text-[#b99256] uppercase tracking-widest">Custo: {tool.creditCost} Crédito</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="p-8">
                    <p className="text-[#6a5f5f] dark:text-[#c7bca9] text-sm leading-relaxed mb-6 font-medium">
                        {tool.description}
                    </p>

                    <h3 className="text-[10px] font-black uppercase text-[#8a7e7e] tracking-[0.2em] mb-4">Como utilizar:</h3>
                    <ul className="space-y-3">
                        {tool.howToUse.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3 group">
                                <div className="bg-[#f0e9dc] dark:bg-[#3e3535] text-[#b99256] w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black border border-[#e6ddcd] dark:border-white/10 group-hover:bg-[#d4ac6e] group-hover:text-[#3e3535] transition-colors">
                                    {idx + 1}
                                </div>
                                <span className="text-xs text-[#3e3535] dark:text-[#f5f1e8] pt-1">{step}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center gap-3">
                        <SparklesIcon className="text-green-500 w-5 h-5" />
                        <p className="text-[10px] font-bold text-green-700 dark:text-green-400">Dica da Iara: Quanto mais detalhado for o seu rascunho, mais precisa será a inteligência técnica na geração.</p>
                    </div>
                </main>

                <footer className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                    <button onClick={onClose} className="w-full bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
                        <CheckIcon className="w-5 h-5" /> Entendido, vamos lá!
                    </button>
                </footer>
            </div>
        </div>
    );
};
