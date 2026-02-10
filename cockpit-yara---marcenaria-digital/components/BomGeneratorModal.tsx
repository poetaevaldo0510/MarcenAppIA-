
import React, { useState, useEffect } from 'react';
import { generateText, analyzeBOMForEconomy } from '../services/geminiService';
import { Spinner, SparklesIcon, BookIcon, CopyIcon, CheckIcon, DownloadIcon, ToolsIcon, CurrencyDollarIcon, RulerIcon } from './Shared';
import { ImageUploader } from './ImageUploader';
import { convertMarkdownToHtml } from '../utils/helpers';
import type { TechnicalReview } from '../types';

interface BomGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
    initialDescription?: string;
    initialImages?: { data: string; mimeType: string }[] | null;
    onSave?: (bom: string) => Promise<void>;
    existingBom?: string | null;
    autoGenerate?: boolean;
    technicalReview?: TechnicalReview | null;
}

export const BomGeneratorModal: React.FC<BomGeneratorModalProps> = ({ 
    isOpen, 
    onClose, 
    showAlert, 
    initialDescription, 
    initialImages,
    onSave,
    existingBom,
    autoGenerate = false
}) => {
    const [projectDescription, setProjectDescription] = useState('');
    const [uploadedImages, setUploadedImages] = useState<{ data: string; mimeType: string }[] | null>(null);
    const [generatedBom, setGeneratedBom] = useState<string | null>(null);
    const [economySuggestions, setEconomySuggestions] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzingEconomy, setIsAnalyzingEconomy] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState(false);
    const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

    const loadingSteps = [
        "Mestre Bento conferindo vãos...",
        "Calculando sobras de MDF...",
        "Listando ferragens técnicas...",
        "Organizando milímetros...",
        "Finalizando Dossiê do Bento..."
    ];

    useEffect(() => {
        if (isOpen) {
            setProjectDescription(initialDescription || '');
            setUploadedImages(initialImages || null);
            setGeneratedBom(existingBom || null);
            setEconomySuggestions(null);
            setSaveFeedback(false);
            if (autoGenerate && initialDescription && !existingBom) handleGenerateBom(initialDescription, initialImages);
        }
    }, [isOpen, initialDescription, initialImages, existingBom, autoGenerate]);

    useEffect(() => {
        let interval: any;
        if (isLoading) interval = setInterval(() => setLoadingMsgIdx(prev => (prev + 1) % loadingSteps.length), 2500);
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleGenerateBom = async (overrideDesc?: string, overrideImages?: typeof uploadedImages) => {
        const desc = overrideDesc || projectDescription;
        const imgs = overrideImages || uploadedImages;
        if (!desc.trim()) return showAlert('Descreva o projeto para o Mestre Bento.');
        setIsLoading(true);
        try {
            const bomPrompt = `MESTRE BENTO: Gere uma LISTA DE MATERIAIS REALISTA para o projeto: "${desc}". Use MDF 18mm para frentes e 15mm caixaria. Enumere ferragens profissionais.`;
            const bomText = await generateText(bomPrompt, imgs);
            setGeneratedBom(bomText);
        } catch (error) { showAlert('Erro na oficina do Bento.'); } finally { setIsLoading(false); }
    };

    const handleAnalyzeEconomy = async () => {
        if (!generatedBom) return;
        setIsAnalyzingEconomy(true);
        try {
            const result = await analyzeBOMForEconomy(generatedBom);
            setEconomySuggestions(result);
        } catch (error) { showAlert("Erro na análise técnica."); } finally { setIsAnalyzingEconomy(false); }
    };

    const handleSaveToProject = async () => {
        if (generatedBom && onSave) {
            setIsSaving(true);
            try { await onSave(generatedBom); setSaveFeedback(true); setTimeout(() => setSaveFeedback(false), 3000); }
            finally { setIsSaving(false); }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[600] flex justify-center items-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#1a1414] rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-[#e6ddcd] dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#2d2424]">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg">
                            <ToolsIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Bancada do Mestre Bento</h2>
                            <p className="text-[10px] text-[#8a7e7e] font-black uppercase tracking-widest mt-1">Engenharia de Materiais Independente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] text-3xl">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                         <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Spinner size="lg" />
                            <h3 className="text-2xl font-black text-[#3e3535] dark:text-[#f5f1e8] mt-6">{loadingSteps[loadingMsgIdx]}</h3>
                        </div>
                    ) : !generatedBom ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                            <div className="space-y-6">
                                <h3 className="font-bold text-[#6a5f5f] dark:text-[#c7bca9] uppercase text-sm tracking-widest flex items-center gap-2">🛠️ Instrução de Oficina</h3>
                                <textarea rows={6} value={projectDescription} onChange={e => setProjectDescription(e.target.value)} className="w-full bg-[#f5f1e8] dark:bg-[#2d2424] p-6 rounded-[2rem] border border-[#e6ddcd] text-sm outline-none focus:ring-2 focus:ring-amber-500/20" placeholder="Ex: Roupeiro planejado 3 portas, 2400x2000mm, com nichos laterais..." />
                                <ImageUploader onImagesChange={setUploadedImages} showAlert={showAlert} initialImages={uploadedImages} />
                                <button onClick={() => handleGenerateBom()} disabled={!projectDescription.trim()} className="w-full bg-[#3e3535] text-[#d4ac6e] font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs active:scale-95 transition-all">Solicitar BOM ao Bento</button>
                            </div>
                            <div className="bg-gradient-to-br from-[#f5f1e8] to-[#e6ddcd] dark:from-[#2d2424] dark:to-[#1a1414] p-10 rounded-[3rem] flex flex-col justify-center items-center text-center opacity-60">
                                <RulerIcon className="w-16 h-16 text-[#d4ac6e] mb-6" />
                                <p className="text-xs text-[#8a7e7e] font-black uppercase tracking-widest">Bento garante que nada falte na montagem.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fadeIn space-y-8 p-8">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 bg-white dark:bg-[#2d2424] p-8 rounded-3xl border border-[#e6ddcd] shadow-inner">
                                    <h3 className="text-[10px] font-black uppercase text-[#b99256] mb-6 tracking-widest">Lista Técnica Gerada</h3>
                                    <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(generatedBom) }} />
                                </div>
                                <div className="flex-1">
                                    {!economySuggestions ? (
                                        <div className="bg-white dark:bg-[#1a1414] p-8 rounded-[3rem] border border-[#e6ddcd] h-full flex flex-col items-center justify-center text-center shadow-xl">
                                            <CurrencyDollarIcon className="w-12 h-12 text-[#d4ac6e] mb-6" />
                                            <h4 className="text-lg font-black text-[#3e3535] dark:text-white uppercase mb-4">Otimizar Plano</h4>
                                            <button onClick={handleAnalyzeEconomy} disabled={isAnalyzingEconomy} className="bg-[#d4ac6e] text-[#3e3535] px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Analisar Aproveitamento</button>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 dark:bg-green-900/10 p-8 rounded-[3rem] border border-green-200 animate-fadeIn h-full shadow-lg">
                                            <h3 className="text-xs font-black uppercase text-green-800 dark:text-green-400 mb-6">Sugestão do Bento</h3>
                                            <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(economySuggestions) }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="p-8 border-t border-[#e6ddcd] bg-[#f5f1e8] dark:bg-[#2d2424] flex justify-between items-center">
                    <button onClick={onClose} className="px-10 py-3 font-black text-[#8a7e7e] uppercase text-[10px]">Fechar</button>
                    <div className="flex gap-4">
                        {generatedBom && (
                            <button onClick={() => { navigator.clipboard.writeText(generatedBom); showAlert("Lista copiada!"); }} className="bg-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95">Copiar Texto</button>
                        )}
                        {generatedBom && onSave && (
                            <button onClick={handleSaveToProject} disabled={isSaving} className="bg-teal-600 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 uppercase text-[10px] active:scale-95 transition-all">
                                {isSaving ? <Spinner size="sm" /> : saveFeedback ? <CheckIcon className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5" />}
                                Vincular ao Projeto
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};
