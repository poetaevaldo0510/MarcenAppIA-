
import React, { useState, useEffect } from 'react';
import { editFloorPlan, analyzeFloorPlan } from '../services/geminiService';
import { Spinner, WandIcon, SearchIcon, SparklesIcon } from './Shared';
import { convertMarkdownToHtml } from '../utils/helpers';

interface LayoutEditorProps {
    isOpen: boolean;
    floorPlanSrc: string;
    projectDescription: string;
    onClose: () => void;
    onSave: (newImageBase64: string) => void;
    showAlert: (message: string, title?: string) => void;
}

export const LayoutEditor: React.FC<LayoutEditorProps> = ({ isOpen, floorPlanSrc, projectDescription, onClose, onSave, showAlert }) => {
    const [prompt, setPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editedImageSrc, setEditedImageSrc] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEditedImageSrc(null);
            setAnalysisResult(null);
            setPrompt('');
        }
    }, [isOpen, floorPlanSrc]);

    const handleEdit = async () => {
        if (!prompt.trim()) {
            showAlert('Por favor, descreva a alteração que deseja fazer no layout.');
            return;
        }
        setIsEditing(true);
        setEditedImageSrc(null);
        try {
            const base64Data = floorPlanSrc.split(',')[1];
            const mimeType = floorPlanSrc.match(/data:(.*);/)?.[1] || 'image/png';
            const fullPrompt = `Contexto: "${projectDescription}". Instrução: "${prompt}"`;
            const newImageBase64 = await editFloorPlan(base64Data, mimeType, fullPrompt);
            setEditedImageSrc(`data:image/png;base64,${newImageBase64}`);
        } catch (error) {
            console.error(error);
            showAlert('Erro na edição do layout.');
        } finally {
            setIsEditing(false);
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            const base64Data = floorPlanSrc.split(',')[1];
            const mimeType = floorPlanSrc.match(/data:(.*);/)?.[1] || 'image/png';
            const result = await analyzeFloorPlan(base64Data, mimeType, projectDescription);
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
            showAlert('Não foi possível realizar a análise.');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSave = () => {
        if(editedImageSrc) {
            const base64Data = editedImageSrc.split(',')[1];
            onSave(base64Data);
            onClose();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#3e3535] rounded-2xl w-full max-w-6xl max-h-[95vh] shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#f5f1e8] dark:bg-[#2d2424]">
                    <div>
                        <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                             <SparklesIcon /> Revisão de Layout Assistida
                        </h2>
                        <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d]">Ajuste visualmente e receba dicas técnicas de ergonomia.</p>
                    </div>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-3xl transition-colors">&times;</button>
                </header>

                <main className="p-6 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 space-y-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[#6a5f5f] dark:text-[#c7bca9]">Planta Original</h3>
                            <div className="rounded-xl overflow-hidden border-2 border-[#e6ddcd] dark:border-[#4a4040] bg-white p-2">
                                <img src={floorPlanSrc} alt="Planta" className="w-full h-auto object-contain" />
                            </div>
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full flex items-center justify-center gap-2 py-3 bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#d4ac6e] text-[#3e3535] dark:text-[#f5f1e8] rounded-xl font-bold transition-all border border-[#dcd6c8] dark:border-[#5a4f4f] disabled:opacity-50">
                                {isAnalyzing ? <Spinner size="sm" /> : <SearchIcon className="w-5 h-5" />}
                                {isAnalyzing ? 'Analisando...' : 'Analisar Fluxo'}
                            </button>
                        </div>
                        <div className="lg:col-span-5 space-y-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[#b99256] dark:text-[#d4ac6e]">Novo Layout</h3>
                            <div className="w-full aspect-square bg-[#f0e9dc] dark:bg-[#2d2424] rounded-xl flex items-center justify-center border-2 border-dashed border-[#d4ac6e]/30 overflow-hidden shadow-inner p-2">
                                {isEditing ? <div className="text-center"><Spinner size="lg" /><p className="mt-4 text-sm font-bold animate-pulse">Redesenhando...</p></div> : editedImageSrc ? <img src={editedImageSrc} alt="Novo" className="w-full h-auto object-contain rounded-md bg-white p-1 animate-scaleIn" /> : <div className="text-center opacity-40"><WandIcon className="w-5 h-5" /><p className="text-sm mt-2">Instrua o ajuste...</p></div>}
                            </div>
                        </div>
                        <div className="lg:col-span-3 space-y-3">
                             <h3 className="text-sm font-bold uppercase tracking-wider text-[#6a5f5f] dark:text-[#c7bca9]">Sugestões</h3>
                             <div className="bg-[#f0e9dc]/50 dark:bg-[#2d2424]/50 rounded-xl p-4 border border-[#e6ddcd] dark:border-[#4a4040] min-h-[200px] h-full overflow-y-auto max-h-[500px] custom-scrollbar">
                                 {isAnalyzing ? <div className="flex flex-col items-center justify-center h-full gap-3 py-10"><Spinner size="sm" /></div> : analysisResult ? <div className="prose prose-xs dark:prose-invert" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(analysisResult) }} /> : <div className="flex flex-col items-center justify-center h-full gap-2 text-[#8a7e7e] opacity-60 text-center py-10"><SparklesIcon className="w-8 h-8" /></div>}
                             </div>
                        </div>
                    </div>
                </main>

                <footer className="p-6 border-t border-[#e6ddcd] dark:border-[#4a4040] bg-[#f5f1e8] dark:bg-[#2d2424] space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                         <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleEdit()} placeholder="Ajuste (ex: Ilha)" className="flex-grow bg-white dark:bg-[#3e3535] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-xl p-4 outline-none transition shadow-sm" />
                        <button onClick={handleEdit} disabled={isEditing || !prompt.trim()} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                            {isEditing ? <Spinner size="sm" /> : <WandIcon className="w-6 h-6" />}
                            <span>Ajustar</span>
                        </button>
                    </div>
                     <div className="flex justify-end gap-4 pt-2">
                        <button onClick={onClose} className="text-[#8a7e7e] dark:text-[#a89d8d] font-bold py-2 px-6 hover:underline transition">Descartar</button>
                        <button onClick={handleSave} disabled={!editedImageSrc || isEditing} className="bg-[#b99256] text-white font-bold py-3 px-10 rounded-xl transition-all disabled:opacity-50 shadow-md">Salvar</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
