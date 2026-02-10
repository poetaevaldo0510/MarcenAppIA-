
import React, { useState, useEffect } from 'react';
import type { ProjectHistoryItem } from '../types';
import { getProjectById } from '../services/historyService';
import { InteractiveImageViewer } from './InteractiveImageViewer';
import { ProjectReport } from './ProjectReport';
import { LogoIcon, Spinner, CheckIcon, WhatsappIcon, BookIcon, DownloadIcon } from './Shared';

interface PublicProjectViewProps {
    projectId: string;
    onBackToApp: () => void;
}

export const PublicProjectView: React.FC<PublicProjectViewProps> = ({ projectId, onBackToApp }) => {
    const [project, setProject] = useState<ProjectHistoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        const fetchProject = async () => {
            setIsLoading(true);
            try {
                const data = await getProjectById(projectId);
                if (data) {
                    setProject(data);
                    setActiveIdx(data.views3d.length - 1);
                }
            } catch (error) {
                console.error("Erro ao carregar projeto compartilhado:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-8">
                <Spinner size="lg" />
                <p className="mt-4 font-black uppercase text-[9px] tracking-[0.4em] text-[#d4ac6e]">Carregando Dossiê Digital</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-black text-[#1a1a1a] uppercase italic tracking-tighter">Projeto não encontrado.</h2>
                <button onClick={onBackToApp} className="mt-8 bg-[#1a1a1a] text-[#d4ac6e] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Voltar ao Início</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col overflow-x-hidden">
            {/* Header Compacto para Mobile com Safe Area */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-[60] py-3 px-4 pt-safe">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#1a1a1a] p-2 rounded-lg text-[#d4ac6e]">
                            <LogoIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-[#1a1a1a] uppercase tracking-tighter italic leading-none truncate max-w-[150px]">{project.name}</h1>
                            <p className="text-[7px] font-black text-[#b99256] uppercase tracking-[0.2em] mt-1 opacity-60">Dossiê Exclusivo</p>
                        </div>
                    </div>
                    <button onClick={onBackToApp} className="bg-[#1a1a1a] text-[#d4ac6e] px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all">Criar Novo</button>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-10 space-y-6 md:space-y-16 pb-44">
                
                {/* Hero Section - Imagem Principal Mobile-Ready */}
                <section className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
                    <div className="h-[50vh] md:h-[75vh] relative">
                        <InteractiveImageViewer 
                            src={project.views3d[activeIdx]} 
                            alt={project.name} 
                            projectName={project.name} 
                            allVersions={project.views3d}
                            activeVersionIdx={activeIdx}
                            onVersionChange={setActiveIdx}
                        />
                    </div>
                    
                    <div className="p-6 md:p-12 bg-white flex flex-col gap-6 border-t border-gray-50">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <BookIcon className="w-4 h-4 text-[#b99256]" />
                                <h3 className="text-[9px] font-black uppercase text-[#1a1a1a] tracking-[0.1em]">Conceito do Projeto</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium italic">
                                "{project.description}"
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span className="text-[9px] font-black uppercase text-[#1a1a1a]">Aprovado</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</p>
                                <span className="text-[9px] font-black uppercase text-[#1a1a1a]">{new Date(project.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Relatórios em Acordeão ou Lista Simples no Mobile */}
                {(project.bom || project.cuttingPlan) && (
                    <section className="space-y-4">
                        <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 px-2">Detalhamento Técnico</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {project.bom && (
                                <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100">
                                    <h3 className="text-xs font-black uppercase text-[#b99256] tracking-widest mb-4 flex items-center gap-2">
                                        <BookIcon className="w-4 h-4" /> Lista de Materiais
                                    </h3>
                                    <div className="prose prose-xs text-gray-600" dangerouslySetInnerHTML={{ __html: project.bom.replace(/\n/g, '<br/>') }} />
                                </div>
                            )}
                            {project.cuttingPlan && (
                                <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100">
                                    <h3 className="text-xs font-black uppercase text-[#b99256] tracking-widest mb-4 flex items-center gap-2">
                                        <DownloadIcon className="w-4 h-4" /> Plano de Produção
                                    </h3>
                                    <div className="prose prose-xs text-gray-600" dangerouslySetInnerHTML={{ __html: project.cuttingPlan.replace(/\n/g, '<br/>') }} />
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>

            {/* CTA Fixo na Base para Mobile - Ultra Proeminente */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[100] pb-safe-offset-2">
                <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Olá, aprovei o projeto "${project.name}" materializado na Oficina Digital. Vamos iniciar a fabricação?`)}`}
                    target="_blank"
                    className="w-full max-w-xl mx-auto bg-[#25D366] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_15px_40px_-5px_rgba(37,211,102,0.6)] hover:scale-[1.03] hover:brightness-110 active:scale-95 transition-all text-xs"
                >
                    <WhatsappIcon className="w-7 h-7" /> ENVIAR APROVAÇÃO VIA WHATSAPP
                </a>
            </div>

            <footer className="bg-white border-t border-gray-100 p-8 text-center pb-44 md:pb-8">
                <LogoIcon className="w-5 h-5 text-[#1a1a1a]/10 mx-auto mb-4" />
                <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed">
                    Dossiê técnico gerado por Inteligência Artificial MarcenApp.
                </p>
            </footer>
        </div>
    );
};
