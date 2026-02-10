
import React from 'react';
import { BookIcon, SparklesIcon, ToolsIcon, CubeIcon, CheckIcon } from './Shared';

interface LibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const modules = [
        { 
            title: "Mobiliário Pallet Pro", 
            count: 800, 
            tags: ["Ecológico", "Rústico", "Jardim", "Modular"],
            desc: "Expertise em transformar estruturas de pallet em móveis de alto valor agregado."
        },
        { 
            title: "Mesas e Cadeiras Luxo", 
            count: 250, 
            tags: ["Ergonomia", "Madeira Maciça", "Jantar", "Office"],
            desc: "Padrões de angulação e resistência para mobiliário de assento e apoio."
        },
        { 
            title: "Living & Ambientes", 
            count: 250, 
            tags: ["Salas", "Hometheater", "Decoração", "8K Staging"],
            desc: "Integração de mobiliário em ambientes de convívio com foco em iluminação."
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/90 z-[3000] flex justify-center items-center p-4 backdrop-blur-3xl animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#111] rounded-[3.5rem] w-full max-w-3xl h-[80vh] shadow-[0_0_100px_rgba(212,172,110,0.1)] border border-white/5 flex flex-col overflow-hidden animate-scaleIn">
                <header className="p-10 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-5">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <BookIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase italic tracking-tighter">Biblioteca Mestre</h2>
                            <p className="text-[10px] text-[#b99256] font-black uppercase tracking-[0.3em] mt-1.5">Conhecimento IA Sincronizado</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-4xl font-light transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto p-10 custom-scrollbar space-y-8 bg-[#fdfaf5] dark:bg-[#0a0808]">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-start gap-4">
                        <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-widest">Sincronia Ativa</h4>
                            <p className="text-[10px] text-emerald-800/70 dark:text-emerald-300 font-medium leading-relaxed mt-1">
                                Mestre Evaldo, a Dra. Iara indexou todos os seus projetos do Drive. Ela agora utiliza esses padrões para cada nova materialização.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {modules.map((m, i) => (
                            <div key={i} className="bg-white dark:bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl group hover:border-[#d4ac6e]/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-[#3e3535] dark:text-white uppercase tracking-tight italic">{m.title}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {m.tags.map(t => (
                                                <span key={t} className="bg-gray-50 dark:bg-black/20 text-gray-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-gray-100 dark:border-white/5">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-[#d4ac6e] leading-none">+{m.count}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Projetos</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">{m.desc}</p>
                                <div className="mt-6 flex items-center gap-2">
                                    <div className="bg-emerald-500/10 text-emerald-500 p-1 rounded-full"><CheckIcon className="w-3 h-3" /></div>
                                    <span className="text-[9px] font-black text-[#00a884] uppercase tracking-widest">Modelagem Sincronizada</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="p-8 border-t border-gray-100 dark:border-white/5 bg-[#f5f1e8] dark:bg-[#111] text-center">
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.4em]">Iara Master Library v1.0 • Ecossistema Mestre Evaldo</p>
                </footer>
            </div>
        </div>
    );
};
