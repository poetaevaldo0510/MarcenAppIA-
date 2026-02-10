
import React, { useState, useEffect } from 'react';
import type { ProjectHistoryItem, IMaterialCost } from '../types';
import { generateDetailedProductionBudget } from '../services/geminiService';
import { fetchCurrentWoodPrice } from '../services/budgetService';
import { Spinner, CurrencyDollarIcon, CheckIcon, CopyIcon, GlobeIcon, SparklesIcon, ShieldCheckIcon } from './Shared';
import { convertMarkdownToHtml } from '../utils/helpers';

interface ManufacturingBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem;
    showAlert: (message: string, title?: string) => void;
}

export const ManufacturingBudgetModal: React.FC<ManufacturingBudgetModalProps> = ({ isOpen, onClose, project, showAlert }) => {
    const [budgetMarkdown, setBudgetMarkdown] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingPrices, setIsCheckingPrices] = useState(false);
    const [liveMaterial, setLiveMaterial] = useState<IMaterialCost | null>(null);
    const [copyFeedback, setCopyFeedback] = useState(false);

    const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleGenerateBudget = async () => {
        setIsLoading(true);
        try {
            const md = await generateDetailedProductionBudget(project);
            setBudgetMarkdown(md);
        } catch (error) { 
            showAlert('Falha ao processar orçamento dinâmico da Estela.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleLivePriceCheck = async () => {
        setIsCheckingPrices(true);
        try {
            const material = project.technicalSpec?.projectParams?.dominantMaterial || 'MDF 18mm';
            const priceData = await fetchCurrentWoodPrice(material);
            setLiveMaterial(priceData);
        } catch (error) {
            console.error("Failed to fetch live prices:", error);
        } finally {
            setIsCheckingPrices(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            handleGenerateBudget();
            handleLivePriceCheck();
        }
    }, [isOpen]);

    const handleCopy = () => {
        if (budgetMarkdown) {
            navigator.clipboard.writeText(budgetMarkdown);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[700] flex justify-center items-center p-4 backdrop-blur-3xl animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#111] rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-8 border-b border-[#e6ddcd] dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#1a1414]">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg">
                            <CurrencyDollarIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Gestão Financeira Estela</h2>
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.4em] mt-1">Margem de Lucro: 35% (Premium)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-red-500 text-4xl transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto custom-scrollbar p-10 bg-[#fdfaf5] dark:bg-[#0a0808]">
                    <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-[#1a1414] p-6 rounded-[2rem] border border-blue-200 dark:border-blue-900/30 flex items-center gap-5 shadow-sm">
                            <div className="bg-blue-500/10 p-4 rounded-2xl text-blue-500"><GlobeIcon className="w-6 h-6" /></div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-gray-400">Referência MDF (Brasil 2025)</p>
                                <p className="text-xl font-black text-[#3e3535] dark:text-white">{isCheckingPrices ? 'Sincronizando...' : liveMaterial ? formatBRL(liveMaterial.pricePerUnit) : '---'}</p>
                            </div>
                        </div>
                        <div className="bg-emerald-600 p-6 rounded-[2rem] text-white flex items-center gap-5 shadow-xl">
                            <div className="bg-white/20 p-4 rounded-2xl"><ShieldCheckIcon className="w-6 h-6" /></div>
                            <div>
                                <p className="text-[9px] font-black uppercase opacity-60">Status da Margem</p>
                                <p className="text-xl font-black uppercase italic">Lucro de 35% Blindado</p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center">
                            <Spinner size="lg" />
                            <h3 className="text-xl font-black uppercase italic mt-8 text-[#3e3535] dark:text-white animate-pulse">Estela está auditando os insumos...</h3>
                        </div>
                    ) : budgetMarkdown ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-black/20 p-10 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-inner animate-fadeIn">
                             <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(budgetMarkdown) }} />
                        </div>
                    ) : null}
                </main>

                <footer className="p-8 border-t border-[#e6ddcd] dark:border-white/5 bg-[#f5f1e8] dark:bg-[#1a1414] flex justify-between items-center">
                    <button onClick={handleGenerateBudget} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center gap-3">
                        <SparklesIcon className="w-5 h-5" /> Recalcular para Master Pro
                    </button>
                    <button onClick={handleCopy} className="bg-[#3e3535] text-[#d4ac6e] px-8 py-5 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg transition-all active:scale-95">
                        {copyFeedback ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                        {copyFeedback ? 'Copiado!' : 'Copiar Dossiê'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
