
import React, { useState } from 'react';
import { generateContract } from '../services/geminiService';
import { Spinner, DocumentTextIcon, CheckIcon, DownloadIcon, LogoIcon } from './Shared';
import { PDFExport, convertMarkdownToHtml } from '../utils/helpers';
import type { ProjectHistoryItem, UserProfile } from '../types';

interface LegalDepartmentProps {
    isOpen: boolean;
    project: ProjectHistoryItem | null;
    profile: UserProfile;
    onClose: () => void;
}

export const LegalDepartment: React.FC<LegalDepartmentProps> = ({ isOpen, project, profile, onClose }) => {
    const [contract, setContract] = useState<string | null>(project?.legalSpec?.contractText || null);
    const [isLoading, setIsLoading] = useState(false);
    const [manualData, setManualData] = useState({ client: project?.clientName || '', projectName: project?.name || '', description: project?.description || '' });

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const dataToUse = project || { name: manualData.projectName, clientName: manualData.client, description: manualData.description };
            const text = await generateContract(dataToUse, { name: dataToUse.clientName || "Cliente" }, profile);
            setContract(text);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#1a1414] w-full max-w-4xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/5 animate-scaleIn">
                <header className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#111]">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 p-3 rounded-2xl text-white">
                            <DocumentTextIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Departamento Jurídico: Dr. Admir</h2>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Modo Independente Ativo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto p-10 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <Spinner size="lg" />
                            <p className="text-slate-500 font-bold uppercase text-[10px] animate-pulse">Dr. Admir está redigindo suas cláusulas de proteção...</p>
                        </div>
                    ) : contract ? (
                        <div id="contract-view" className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-black/40 p-12 rounded-3xl border border-gray-100 dark:border-white/5 shadow-inner">
                             <div className="flex justify-between mb-10 opacity-30">
                                <LogoIcon className="w-12 h-12" />
                                <div className="text-right text-[10px] font-black uppercase">MarcenApp Legal Core v1.0</div>
                             </div>
                             <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(contract) }} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-xl mx-auto">
                            {!project && (
                                <div className="w-full space-y-4 text-left bg-gray-50 dark:bg-white/5 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5">
                                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">Dados do Contrato</h3>
                                    <input 
                                        type="text" placeholder="Nome do Cliente" value={manualData.client} 
                                        onChange={e => setManualData({...manualData, client: e.target.value})}
                                        className="w-full bg-white dark:bg-[#111] p-4 rounded-xl border border-slate-200 outline-none focus:border-slate-800 text-sm font-bold"
                                    />
                                    <input 
                                        type="text" placeholder="Título do Projeto" value={manualData.projectName} 
                                        onChange={e => setManualData({...manualData, projectName: e.target.value})}
                                        className="w-full bg-white dark:bg-[#111] p-4 rounded-xl border border-slate-200 outline-none focus:border-slate-800 text-sm font-bold"
                                    />
                                    <textarea 
                                        placeholder="Breve descrição dos materiais e prazos..." value={manualData.description} 
                                        onChange={e => setManualData({...manualData, description: e.target.value})}
                                        className="w-full bg-white dark:bg-[#111] p-4 rounded-xl border border-slate-200 outline-none focus:border-slate-800 text-sm font-medium h-32"
                                    />
                                </div>
                            )}
                            
                            <div className="flex flex-col items-center">
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={!manualData.client.trim() && !project}
                                    className="bg-slate-800 text-white px-16 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all disabled:opacity-30"
                                >
                                    Gerar Minuta de Contrato
                                </button>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-4">Padrão MarcenApp de Segurança Jurídica</p>
                            </div>
                        </div>
                    )}
                </main>

                {contract && (
                    <footer className="p-8 border-t border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex justify-between items-center">
                        <button onClick={() => setContract(null)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Refazer</button>
                        <div className="flex gap-4">
                            <button onClick={() => { navigator.clipboard.writeText(contract); }} className="bg-gray-200 text-slate-700 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px]">Copiar Texto</button>
                            <button onClick={() => PDFExport(document.getElementById('contract-view'), `Contrato_${manualData.projectName || 'Projeto'}.pdf`)} className="bg-slate-800 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                                <DownloadIcon className="w-4 h-4" /> Exportar Contrato
                            </button>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};
