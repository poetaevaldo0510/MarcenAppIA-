
import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { updateProjectInHistory } from '../services/historyService';
import { Spinner, WandIcon, SparklesIcon, CameraIcon, CubeIcon, SunIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface NewViewGeneratorProps {
    isOpen: boolean;
    project: ProjectHistoryItem;
    onClose: () => void;
    onSaveComplete: () => Promise<void>;
    showAlert: (message: string, title?: string) => void;
}

const PERSPECTIVE_SUGGESTIONS = [
    { label: '📐 Vista Frontal Técnica', prompt: 'Gere uma vista frontal 100% plana do móvel. Destaque os puxadores com realismo extremo e foque na nitidez da textura do MDF (fibras e veios). Não mude o número de portas ou vãos.' },
    { label: '📐 Vista Lateral', prompt: 'Gere uma vista lateral (perfil) deste móvel, mantendo 100% da iluminação e materiais.' },
    { label: '🚪 Vista Interna + LED', prompt: 'Gere uma vista com as portas abertas revelando a organização interna (prateleiras, cabideiros, gavetas). Adicione iluminação LED técnica em 3000K embutida nos nichos e sob as prateleiras para destacar o acabamento interno. Mantenha a textura original do MDF.' },
    { label: '🔝 Planta Isométrica', prompt: 'Gere uma perspectiva aérea (planta isométrica) olhando o móvel de cima.' },
    { label: '🔍 Detalhe de Ferragem', prompt: 'Gere um close-up fotorrealista focado no sistema de abertura e nos puxadores. Alta definição PBR.' },
];

export const NewViewGenerator: React.FC<NewViewGeneratorProps> = ({ isOpen, project, onSaveComplete, onClose, showAlert }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageSrc, setGeneratedImageSrc] = useState<string | null>(null);

    const originalImageSrc = project.views3d[0];

    const handleGenerate = async (customPrompt?: string) => {
        const finalPrompt = customPrompt || prompt;
        if (!finalPrompt.trim()) {
            showAlert('Por favor, descreva o novo ângulo ou escolha uma sugestão.');
            return;
        }

        setIsGenerating(true);
        setGeneratedImageSrc(null);
        try {
            const base64Data = originalImageSrc.split(',')[1];
            const mimeType = originalImageSrc.match(/data:(.*);/)?.[1] || 'image/png';
            
            const fullPrompt = `VOCÊ É UMA CÂMERA VIRTUAL PROFISSIONAL DE ARQUITETURA. 
            Mantenha a estrutura do móvel ABSOLUTAMENTE IDENTICA ao original (geometria externa fixa).
            Instrução de cena: "${finalPrompt}".
            Fidelidade de materiais máxima. Estética High-End.`;

            const newImageBase64 = await editImage([{ data: base64Data, mimeType }], fullPrompt);
            setGeneratedImageSrc(`data:image/png;base64,${newImageBase64}`);
        } catch (error) {
            showAlert(error instanceof Error ? error.message : 'Erro na geração da vista.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = async () => {
        if(generatedImageSrc) {
            const updatedViews = [...project.views3d, generatedImageSrc];
            await updateProjectInHistory(project.id, { views3d: updatedViews });
            await onSaveComplete();
            handleClose();
        }
    }

    const handleClose = () => {
        setPrompt('');
        setGeneratedImageSrc(null);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[500] flex justify-center items-center p-4 backdrop-blur-xl animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#110e0e] rounded-[3.5rem] w-full max-w-6xl max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-8 border-b border-[#e6ddcd] dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#1a1414]">
                    <div className="flex items-center gap-5">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <CameraIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Iara Studio Camera</h2>
                            <p className="text-[10px] text-[#b99256] font-black uppercase tracking-[0.3em] mt-1">Sessão de Fotografia Virtual v2.5</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-[#a89d8d] hover:text-red-500 text-5xl font-light transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-hidden flex flex-col lg:flex-row">
                    <aside className="w-full lg:w-96 bg-gray-50/50 dark:bg-black/20 border-r border-[#e6ddcd] dark:border-white/5 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a7e7e] mb-6 flex items-center gap-2">
                                <WandIcon className="w-4 h-4 text-[#d4ac6e]" /> Ângulos Sugeridos
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {PERSPECTIVE_SUGGESTIONS.map(suggestion => (
                                    <button
                                        key={suggestion.label}
                                        onClick={() => { setPrompt(suggestion.label); handleGenerate(suggestion.prompt); }}
                                        disabled={isGenerating}
                                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all group ${prompt === suggestion.label ? 'bg-[#d4ac6e] border-[#d4ac6e] text-[#3e3535] shadow-xl scale-[1.02]' : 'bg-white dark:bg-[#1a1414] border-transparent hover:border-[#d4ac6e]/30 text-[#6a5f5f] dark:text-[#a89d8d]'}`}
                                    >
                                        <p className={`text-xs font-black uppercase tracking-tight ${prompt === suggestion.label ? 'text-[#3e3535]' : 'text-[#3e3535] dark:text-white'}`}>{suggestion.label}</p>
                                        <p className={`text-[9px] mt-1 font-bold leading-tight line-clamp-2 ${prompt === suggestion.label ? 'text-[#3e3535]/70' : 'text-[#8a7e7e]'}`}>{suggestion.prompt}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                            <h4 className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <SunIcon className="w-3.5 h-3.5" /> Dica Profissional
                            </h4>
                            <p className="text-[10px] text-blue-700/80 dark:text-blue-300 leading-relaxed font-bold uppercase tracking-tighter">
                                Use a "Vista Interna + LED" para impressionar seu cliente com o nível de detalhamento da ferragem e iluminação cênica.
                            </p>
                        </div>
                    </aside>

                    <section className="flex-grow p-10 bg-white dark:bg-[#0a0808] overflow-y-auto custom-scrollbar flex flex-col gap-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8a7e7e] mb-4 text-center">Referência Atual</h3>
                                <div className="rounded-[2.5rem] overflow-hidden border-4 border-[#f5f1e8] dark:border-white/5 shadow-2xl bg-[#f5f1e8] dark:bg-[#1a1414] flex-grow flex items-center group relative">
                                    <img src={originalImageSrc} alt="Referência" className="w-full h-auto transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b99256] mb-4 text-center">Novo Snapshot IA</h3>
                                <div className="rounded-[3rem] border-4 border-dashed border-[#d4ac6e]/20 bg-[#fdfaf5] dark:bg-[#110e0e] flex-grow flex items-center justify-center relative overflow-hidden shadow-inner">
                                    {isGenerating ? (
                                        <div className="text-center p-12 z-10 flex flex-col items-center">
                                            <Spinner size="lg" />
                                            <p className="text-lg font-black mt-8 text-[#3e3535] dark:text-white uppercase italic tracking-tighter animate-pulse">Capturando nova perspectiva...</p>
                                            <p className="text-[9px] text-[#d4ac6e] font-black uppercase tracking-[0.4em] mt-2">Iara está posicionando as luzes</p>
                                        </div>
                                    ) : generatedImageSrc ? (
                                        <div className="w-full h-full animate-fadeIn group">
                                            <img src={generatedImageSrc} alt="Nova Vista" className="w-full h-full object-contain" />
                                            <div className="absolute top-6 left-6">
                                                <span className="bg-[#d4ac6e] text-[#3e3535] text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-xl">Draft Processado</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-[#8a7e7e] opacity-30 p-12">
                                            <CubeIcon className="w-24 h-24 mx-auto mb-6" />
                                            <p className="text-sm font-black uppercase tracking-widest italic">Aguardando gatilho de câmera</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="p-8 border-t border-[#e6ddcd] dark:border-white/5 bg-[#f5f1e8] dark:bg-[#1a1414] flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4">
                         <div className="flex-grow relative">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="Descreva um ângulo customizado... Ex: Close no detalhe do puxador cava."
                                className="w-full bg-white dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-white/10 rounded-[2rem] p-6 pr-20 text-lg font-bold text-[#3e3535] dark:text-white outline-none focus:border-[#d4ac6e] shadow-inner transition-all placeholder:text-gray-300"
                            />
                            <button 
                                onClick={() => handleGenerate()} 
                                disabled={isGenerating || !prompt.trim()} 
                                className="absolute right-3 top-3 bottom-3 bg-[#3e3535] text-[#d4ac6e] px-8 rounded-2xl hover:brightness-125 transition-all disabled:opacity-30 shadow-xl"
                            >
                                <WandIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <button 
                            onClick={handleSave} 
                            disabled={!generatedImageSrc || isGenerating} 
                            className="bg-[#d4ac6e] text-[#3e3535] font-black py-6 px-16 rounded-[2.5rem] shadow-2xl disabled:opacity-20 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs transition-all"
                        >
                            <SparklesIcon className="w-5 h-5" /> Adicionar à Galeria
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
