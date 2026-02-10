
import React, { useState, useMemo } from 'react';
import type { ProjectHistoryItem } from '../types';
import { Spinner, BookIcon, TrashIcon, SearchIcon, CheckIcon, LogoIcon } from './Shared';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: ProjectHistoryItem[];
    onViewProject: (project: ProjectHistoryItem) => void;
    onAddNewView: (projectId: string) => void;
    onDeleteProject: (id: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onViewProject, onDeleteProject }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const displayedHistory = useMemo(() => {
        return history
            .filter(project => 
                project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [history, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-black/80 flex animate-fadeIn" onClick={onClose}>
            <div className="w-full max-w-[400px] h-full bg-[#111b21] shadow-2xl flex flex-col overflow-hidden animate-slideInLeft" onClick={e => e.stopPropagation()}>
                <header className="bg-[#202c33] p-4 pt-12 flex flex-col gap-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-[#8696a0]" />
                        </div>
                        <h2 className="text-[#e9edef] font-bold text-xl">Conversas</h2>
                    </div>
                    
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Pesquisar ou começar uma nova conversa"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#202c33] text-[#d1d7db] text-[14px] rounded-lg py-2 pl-12 pr-4 outline-none border-none focus:ring-0 placeholder:text-[#8696a0]"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8696a0]"><SearchIcon className="w-4 h-4" /></div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#111b21]">
                    {displayedHistory.length === 0 ? (
                        <div className="text-center py-20 opacity-20 flex flex-col items-center">
                            <LogoIcon className="w-16 h-16 mb-4 text-[#8696a0]" />
                            <p className="text-[#8696a0] font-medium uppercase tracking-widest text-[10px]">Sem rascunhos ativos</p>
                        </div>
                    ) : (
                        displayedHistory.map((project) => (
                            <div 
                                key={project.id} 
                                className="flex items-center px-4 py-3 gap-3 hover:bg-[#202c33] active:bg-[#2a3942] transition-colors cursor-pointer border-b border-[#202c33]/50 group"
                                onClick={() => onViewProject(project)}
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2a3942] flex-shrink-0 border border-white/5">
                                    {project.views3d[0] ? (
                                        <img src={project.views3d[project.views3d.length-1]} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><BookIcon className="w-6 h-6 text-[#8696a0]" /></div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0 flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-[#e9edef] text-[16px] truncate">{project.name}</h3>
                                        <span className="text-[11px] text-[#8696a0]">{new Date(project.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 mt-0.5">
                                        <p className="text-[13px] text-[#8696a0] truncate italic leading-tight">
                                            {project.views3d.length > 0 ? "📷 Projeto materializado" : project.description}
                                        </p>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-[#8696a0] hover:text-red-400 transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </main>
                
                <footer className="p-4 bg-[#111b21] border-t border-[#202c33] flex justify-center">
                    <p className="text-[10px] text-[#8696a0] font-black uppercase tracking-[0.4em]">Iara Vision OS v15.5</p>
                </footer>
            </div>
        </div>
    );
};

// Internal Helper for Avatar
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
