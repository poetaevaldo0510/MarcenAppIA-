
import React, { useState, useEffect } from 'react';
import { projectTypePresets } from '../services/presetService';
import { SparklesIcon, InfoIcon, LogoIcon, ArrowRightIcon } from './Shared';

interface StyleAssistantProps {
  onSelect: (text: string) => void;
  presetId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StyleAssistant: React.FC<StyleAssistantProps> = ({ onSelect, presetId = 'cozinha', isOpen, onClose }) => {
    const activePreset = projectTypePresets.find(p => p.id === presetId) || projectTypePresets[0];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#111] w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/5 animate-scaleIn">
                <header className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-[#f8f9fa] dark:bg-[#1a1414]">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#d4ac6e] p-3 rounded-2xl text-black shadow-lg">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1a1a1a] dark:text-white uppercase italic tracking-tighter">Iara Design Master</h2>
                            <p className="text-[9px] text-[#b99256] font-black uppercase tracking-widest mt-1">Sugestões Técnicas: {activePreset.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-4xl transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-6">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2rem] flex items-start gap-4">
                        <div className="bg-white dark:bg-emerald-500 p-2 rounded-xl text-emerald-600 dark:text-white shadow-sm">
                            <InfoIcon className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium leading-relaxed italic">
                            Mestre, clique em uma base de design abaixo para preencher seu comando técnico. Você poderá ajustar medidas e materiais antes de renderizar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {activePreset.suggestions.map((text, idx) => (
                            <button
                                key={idx}
                                onClick={() => { onSelect(text); onClose(); }}
                                className="w-full flex items-start gap-4 text-left bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-[#d4ac6e]/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute right-0 top-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
                                    <LogoIcon className="w-24 h-24" />
                                </div>
                                <div className="bg-white dark:bg-black/20 p-3 rounded-xl text-[#d4ac6e] shadow-sm group-hover:scale-110 transition-transform">
                                    <activePreset.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-xs font-black text-[#1a1a1a] dark:text-white uppercase tracking-tight mb-1">
                                        {text.includes(':') ? text.split(':')[0] : `Opção ${idx + 1}`}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">
                                        "{text.includes(':') ? text.split(':').slice(1).join(':').trim() : text}"
                                    </p>
                                </div>
                                <div className="self-center bg-[#d4ac6e]/10 p-2 rounded-full text-[#d4ac6e] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRightIcon className="w-4 h-4" />
                                </div>
                            </button>
                        ))}
                    </div>
                </main>

                <footer className="p-6 bg-gray-50 dark:bg-[#1a1414] border-t border-gray-100 dark:border-white/5 text-center">
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.4em]">Protocolo de Rascunho Iara v15.0 • Digital Dynamics</p>
                </footer>
            </div>
        </div>
    );
};
