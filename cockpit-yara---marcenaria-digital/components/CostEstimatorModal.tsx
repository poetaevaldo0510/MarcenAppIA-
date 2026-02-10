
import React, { useState } from 'react';
import { estimateProjectCosts } from '../services/geminiService';
import { Spinner, SparklesIcon, CurrencyDollarIcon, CheckIcon, CopyIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface CostEstimatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
}

export const CostEstimatorModal: React.FC<CostEstimatorModalProps> = ({ isOpen, onClose, showAlert }) => {
    const [bomInput, setBomInput] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [estimatedMaterialCost, setEstimatedMaterialCost] = useState<number | null>(null);
    const [estimatedLaborCost, setEstimatedLaborCost] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const totalEstimatedCost = estimatedMaterialCost !== null && estimatedLaborCost !== null
        ? estimatedMaterialCost + estimatedLaborCost
        : null;

    const handleEstimateCosts = async () => {
        if (!bomInput.trim()) {
            setErrors({ bom: "Mestre, a lista técnica é necessária para o cálculo." });
            return;
        }

        setErrors({});
        setIsLoading(true);
        setEstimatedMaterialCost(null);
        setEstimatedLaborCost(null);
        setCopyFeedback(null);

        try {
            // Fix: Added missing required properties 'updatedAt' and 'messages'
            const dummyProject: ProjectHistoryItem = {
                id: 'temp',
                timestamp: Date.now(),
                updatedAt: Date.now(),
                messages: [],
                name: projectName || 'Projeto Genérico',
                description: projectDescription || 'Descrição não fornecida',
                style: '',
                views3d: [],
                chatHistory: [],
                bom: bomInput,
                status: 'ready',
                saleStatus: 'quote',
                orderStatus: 'rascunho',
                currentStage: 'budget',
                cuttingPlan: null,
                cuttingPlanImage: null,
                cuttingPlanOptimization: null
            };

            const { materialCost, laborCost } = await estimateProjectCosts(dummyProject, '');
            
            setEstimatedMaterialCost(materialCost);
            setEstimatedLaborCost(laborCost);
        } catch (error) {
            console.error('Error estimating costs:', error);
            showAlert(error instanceof Error ? error.message : 'Erro na leitura do banco de preços.', 'Falha de Sincronia');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCosts = () => {
        if (estimatedMaterialCost !== null && estimatedLaborCost !== null) {
            const textToCopy = `Estimativa de Custos para ${projectName || 'o Projeto'}:\n` +
                               `Custo de Material: ${formatCurrency(estimatedMaterialCost)}\n` +
                               `Custo de Mão de Obra: ${formatCurrency(estimatedLaborCost)}\n` +
                               `Total Estimado: ${formatCurrency(totalEstimatedCost || 0)}`;
            navigator.clipboard.writeText(textToCopy);
            setCopyFeedback('Copiado!');
            setTimeout(() => setCopyFeedback(null), 2000);
        }
    };

    const handleClose = () => {
        setBomInput('');
        setProjectName('');
        setProjectDescription('');
        setEstimatedMaterialCost(null);
        setEstimatedLaborCost(null);
        setIsLoading(false);
        setCopyFeedback(null);
        setErrors({});
        onClose();
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/90 z-[500] flex justify-center items-center p-4 animate-fadeIn backdrop-blur-sm" onClick={handleClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#1a1414] rounded-[3.5rem] w-full max-w-4xl max-h-[90vh] shadow-3xl border border-white/5 flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-8 border-b border-[#e6ddcd] dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#3e3535]">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-lg">
                            <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-[#3e3535] dark:text-white uppercase italic tracking-tighter">Estimar Budget Técnico</h2>
                    </div>
                    <button onClick={handleClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-4xl transition-all">&times;</button>
                </header>

                <main className="p-8 flex-grow overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Projeto</label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Ex: Cozinha Gourmet"
                                className="w-full bg-[#fdfaf5] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-xl p-4 text-[#3e3535] dark:text-[#f5f1e8] outline-none focus:border-[#d4ac6e] transition font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Briefing Curto</label>
                            <input
                                type="text"
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="MDF 18mm with damping..."
                                className="w-full bg-[#fdfaf5] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-xl p-4 text-[#3e3535] dark:text-[#f5f1e8] outline-none focus:border-[#d4ac6e] transition font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lista de Materiais (BOM)</label>
                        <textarea
                            rows={8}
                            value={bomInput}
                            onChange={(e) => { setBomInput(e.target.value); if(errors.bom) setErrors({}); }}
                            placeholder="Mestre, cole aqui a lista técnica do projeto..."
                            className={`w-full bg-[#fdfaf5] dark:bg-[#2d2424] border-2 rounded-[2rem] p-6 text-[#3e3535] dark:text-[#f5f1e8] outline-none transition font-medium text-sm resize-none ${errors.bom ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#e6ddcd] dark:border-[#4a4040] focus:border-[#d4ac6e]'}`}
                        />
                        {errors.bom && <p className="text-red-500 text-[9px] font-black uppercase ml-4 mt-1 animate-fadeIn">{errors.bom}</p>}
                    </div>

                    <button
                        onClick={handleEstimateCosts}
                        disabled={isLoading || !bomInput.trim()}
                        className="w-full bg-[#d4ac6e] text-[#3e3535] font-black py-5 rounded-[2rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-30"
                    >
                        {isLoading ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                        <span>{isLoading ? 'Iara Auditoria Ativa...' : 'Disparar Estimativa IA'}</span>
                    </button>

                    {(estimatedMaterialCost !== null || isLoading) && (
                        <div className="bg-[#f5f1e8] dark:bg-[#2d2424] p-8 rounded-[2.5rem] border border-[#e6ddcd] dark:border-white/5 relative animate-fadeInUp shadow-inner">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-[#b99256] uppercase tracking-widest flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4" /> Resultados Oficiais
                                </h3>
                                {estimatedMaterialCost !== null && (
                                    <button 
                                        onClick={handleCopyCosts} 
                                        className="bg-white dark:bg-[#3e3535] px-4 py-2 rounded-xl text-[9px] font-black uppercase text-[#6a5f5f] dark:text-white shadow-sm hover:shadow-md transition flex items-center gap-2 border border-[#e6ddcd] dark:border-white/5"
                                    >
                                        {copyFeedback ? <CheckIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                                        {copyFeedback || 'Copiar Dossiê'}
                                    </button>
                                )}
                            </div>
                            
                            {isLoading ? (
                                <div className="text-center py-10">
                                    <Spinner size="lg" />
                                    <p className="mt-4 text-[10px] font-black uppercase text-[#8a7e7e] tracking-[0.4em] animate-pulse">Sincronizando com o mercado local...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insumos Técnicos</span>
                                        <span className="text-lg font-black text-[#3e3535] dark:text-white">{formatCurrency(estimatedMaterialCost || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mão de Obra Oficina</span>
                                        <span className="text-lg font-black text-[#3e3535] dark:text-white">{formatCurrency(estimatedLaborCost || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2">
                                        <span className="text-[11px] font-black text-[#d4ac6e] uppercase tracking-[0.2em]">Investimento Total</span>
                                        <span className="text-4xl font-black text-[#3e3535] dark:text-[#d4ac6e] tracking-tighter">{formatCurrency(totalEstimatedCost || 0)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
                <footer className="p-8 border-t border-[#e6ddcd] dark:border-white/5 bg-[#f5f1e8] dark:bg-[#1a1414] flex justify-end">
                    <button onClick={handleClose} className="px-10 py-4 font-black text-[#8a7e7e] hover:text-[#3e3535] dark:hover:text-white uppercase text-[10px] tracking-widest">Fechar</button>
                </footer>
            </div>
        </div>
    );
};
