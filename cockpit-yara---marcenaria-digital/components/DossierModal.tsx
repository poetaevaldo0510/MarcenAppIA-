
import React, { useState, useRef } from 'react';
import type { ProjectHistoryItem, Client, UserProfile } from '../types';
import { PDFExport } from '../utils/helpers';
import { LogoIcon, DownloadIcon, SparklesIcon, CheckIcon, DossierIcon, Spinner } from './Shared';

interface DossierModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    projects: ProjectHistoryItem[];
    userProfile: UserProfile | null;
}

export const DossierModal: React.FC<DossierModalProps> = ({ isOpen, onClose, client, projects, userProfile }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(projects.map(p => p.id)));
    const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const dossierRef = useRef<HTMLDivElement>(null);

    const toggleProject = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleApproval = (id: string) => {
        const next = new Set(approvedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setApprovedIds(next);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setTimeout(() => {
            if (dossierRef.current) {
                PDFExport(dossierRef.current, `dossie-${client.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
            }
            setIsExporting(false);
        }, 500);
    };

    if (!isOpen) return null;

    const selectedProjects = projects.filter(p => selectedIds.has(p.id));

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#2d2424] rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-8 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#f5f1e8] dark:bg-[#3e3535]">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-lg">
                            <DossierIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Dossiê de Obra Completa</h2>
                            <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] font-bold uppercase tracking-widest mt-1">Cliente: {client.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-4xl transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-hidden flex flex-col lg:flex-row">
                    {/* Lista de Seleção Lateral */}
                    <aside className="w-full lg:w-80 bg-white/50 dark:bg-black/10 border-r border-[#e6ddcd] dark:border-white/5 p-6 overflow-y-auto custom-scrollbar">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#b99256] mb-6">Ambientes Disponíveis</h3>
                        <div className="space-y-4">
                            {projects.map(p => (
                                <div key={p.id} className="bg-white dark:bg-[#3e3535] p-4 rounded-2xl border border-[#e6ddcd] dark:border-white/5 shadow-sm space-y-3 transition-all hover:shadow-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-grow">
                                            <p className="text-xs font-black text-[#3e3535] dark:text-white uppercase truncate">{p.name}</p>
                                            <p className="text-[9px] text-[#8a7e7e] uppercase font-bold mt-1">Renderizado em {new Date(p.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(p.id)} 
                                            onChange={() => toggleProject(p.id)}
                                            className="w-5 h-5 rounded-md accent-[#d4ac6e]"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => toggleApproval(p.id)}
                                        className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${approvedIds.has(p.id) ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-[#f0e9dc] dark:bg-black/20 text-[#8a7e7e]'}`}
                                    >
                                        {approvedIds.has(p.id) ? <><CheckIcon className="w-3 h-3" /> Aprovado pelo Cliente</> : 'Marcar como Aprovado'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Preview do Layout do PDF */}
                    <section className="flex-grow p-10 bg-gray-100 dark:bg-[#1a1414] overflow-y-auto custom-scrollbar">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a7e7e]">Preview da Apresentação</h3>
                            <div className="flex items-center gap-3">
                                <span className="bg-[#3e3535] text-white px-3 py-1 rounded-full text-[9px] font-bold">{selectedProjects.length} Páginas</span>
                            </div>
                        </div>

                        {/* Este div é o que será exportado para PDF */}
                        <div ref={dossierRef} className="max-w-[800px] mx-auto bg-white shadow-2xl p-0 text-[#1e293b]" style={{fontFamily: "'Poppins', sans-serif"}}>
                            {/* Capa */}
                            <div className="h-[1050px] p-20 flex flex-col justify-between border-b-[20px] border-[#3e3535]">
                                <div>
                                    <div className="flex items-center gap-4 mb-20 opacity-20">
                                        <LogoIcon className="w-16 h-16" />
                                        <span className="text-3xl font-black italic tracking-tighter uppercase">MarcenApp</span>
                                    </div>
                                    <h1 className="text-7xl font-black uppercase tracking-tighter italic leading-none mb-4 text-[#3e3535]">Dossiê<br/><span className="text-[#d4ac6e]">Técnico</span></h1>
                                    <div className="w-32 h-2 bg-[#d4ac6e] mb-12"></div>
                                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#8a7e7e]">Apresentação de Projeto de Marcenaria</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#d4ac6e] mb-1">Elaborado para:</p>
                                        <p className="text-2xl font-black uppercase text-[#3e3535]">{client.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-10 pt-10 border-t border-gray-100">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Responsável Técnico</p>
                                            <p className="text-sm font-bold text-[#3e3535]">{userProfile?.fullName || 'Profissional MarcenApp'}</p>
                                            <p className="text-xs text-[#8a7e7e]">{userProfile?.businessName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Data de Emissão</p>
                                            <p className="text-sm font-bold text-[#3e3535]">{new Date().toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Páginas dos Projetos */}
                            {selectedProjects.map((p, idx) => (
                                <div key={p.id} className="h-[1050px] p-16 flex flex-col relative overflow-hidden" style={{pageBreakBefore: 'always'}}>
                                    <header className="flex justify-between items-start mb-10">
                                        <div>
                                            <span className="text-[10px] font-black text-[#d4ac6e] uppercase tracking-[0.4em]">Ambiente {String(idx + 1).padStart(2, '0')}</span>
                                            <h2 className="text-3xl font-black uppercase tracking-tighter text-[#3e3535]">{p.name}</h2>
                                        </div>
                                        {approvedIds.has(p.id) && (
                                            <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-green-500/20">
                                                <CheckIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase">Projeto Aprovado</span>
                                            </div>
                                        )}
                                    </header>

                                    <div className="grid grid-cols-12 gap-8 flex-grow">
                                        <div className="col-span-8 space-y-6">
                                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-50 aspect-video bg-gray-100">
                                                <img src={p.views3d[0]} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {p.views3d.slice(1, 3).map((view, vIdx) => (
                                                    <div key={vIdx} className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-50 aspect-[4/3] bg-gray-100">
                                                        <img src={view} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="col-span-4 space-y-8">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-[#d4ac6e] mb-2 tracking-widest">Memorial Descritivo</h4>
                                                <p className="text-[11px] leading-relaxed text-gray-500 font-medium">{p.description}</p>
                                            </div>
                                            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                                <h4 className="text-[10px] font-black uppercase text-[#3e3535] mb-4 tracking-widest flex items-center gap-2">
                                                    <SparklesIcon className="w-3 h-3" /> Ficha Técnica
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-[10px] font-bold border-b border-gray-200 pb-2">
                                                        <span className="text-gray-400">Estilo</span>
                                                        <span className="text-[#3e3535] uppercase">{p.style}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-bold border-b border-gray-200 pb-2">
                                                        <span className="text-gray-400">Iluminação</span>
                                                        <span className="text-[#3e3535]">{p.withLedLighting ? 'LED Ativo' : 'Padrão'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <footer className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center opacity-30">
                                        <div className="flex items-center gap-2">
                                            <LogoIcon className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">MarcenApp Digital Dossier</span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Página {idx + 2}</span>
                                    </footer>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="p-8 border-t border-[#e6ddcd] dark:border-white/5 bg-[#f5f1e8] dark:bg-[#3e3535] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-2xl hidden md:block">
                            <SparklesIcon className="w-5 h-5 text-[#b99256]" />
                        </div>
                        <p className="text-[10px] text-[#8a7e7e] font-bold uppercase tracking-widest max-w-xs leading-relaxed">
                            O Dossiê compila todos os ambientes aprovados em um único PDF comercial de alta qualidade.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 font-black text-[#8a7e7e] hover:text-[#3e3535] dark:hover:text-white uppercase text-[10px] tracking-widest transition-all">Cancelar</button>
                        <button 
                            onClick={handleExport} 
                            disabled={isExporting || selectedProjects.length === 0}
                            className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-black py-4 px-12 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest text-[10px] disabled:opacity-50"
                        >
                            {isExporting ? <Spinner size="sm" /> : <DownloadIcon className="w-5 h-5" />}
                            Gerar PDF de Apresentação
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
