import React, { useState, useRef, useEffect, useCallback } from 'react';
import { editImage, analyzeTechnicalDetail } from '../services/geminiService';
// Added PencilIcon to the imports from Shared components
import { Spinner, WandIcon, SparklesIcon, CheckIcon, RefreshCcw, X, MapPin, ArrowsExpandIcon, PaperClipIcon, CameraIcon, StarIcon, PlusIcon, SunIcon, SearchIcon, InfoIcon, ShieldCheckIcon, ToolsIcon, SawIcon, LogoIcon, PencilIcon } from './Shared';
import { processImage, validateMediaFile } from '../utils/helpers';
import type { ProjectHistoryItem } from '../types';

interface StudioRenderProps {
    isOpen: boolean;
    imageSrc: string;
    project: ProjectHistoryItem | null;
    onClose: () => void;
    onSave: (newImageBase64: string) => void;
    showAlert: (message: string, title?: string) => void;
}

interface PrecisionPoint {
    x: number;
    y: number;
}

interface TechnicalDiagnosis {
    observation: string;
    fixSuggestion: string;
    severity: 'low' | 'med' | 'high';
    technicalCategory: string;
}

export const StudioRender: React.FC<StudioRenderProps> = ({ isOpen, imageSrc, project, onClose, onSave, showAlert }) => {
    const [prompt, setPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editedImageSrc, setEditedImageSrc] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);
    const [activePoint, setActivePoint] = useState<PrecisionPoint | null>(null);
    const [diagnosis, setDiagnosis] = useState<TechnicalDiagnosis | null>(null);
    const [mode, setMode] = useState<'adjust' | 'audit'>('adjust');
    
    // Novas Variáveis para o Modo Fantasma
    const [ghostOpacity, setGhostOpacity] = useState(0); // 0 = Render, 1 = Rascunho
    const [originalSketch, setOriginalSketch] = useState<string | null>(null);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragMoved, setDragMoved] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const promptRef = useRef<HTMLTextAreaElement>(null);

    const resetView = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        if (isOpen && project) {
            resetView();
            setEditedImageSrc(null);
            setActivePoint(null);
            setDiagnosis(null);
            setPrompt('');
            setGhostOpacity(0);
            
            // Busca a última imagem de rascunho anexada no histórico do chat
            const lastSketch = [...project.chatHistory]
                .reverse()
                .find(m => m.metadata?.originalImageUrl)?.metadata?.originalImageUrl;
            
            setOriginalSketch(lastSketch || null);
        }
    }, [isOpen, project, resetView]);

    const handleWheel = useCallback((e: WheelEvent) => {
        if (!containerRef.current || isEditing || isAnalyzing) return;
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = -e.deltaY * 0.0015 * scale;
        const newScale = Math.min(Math.max(1, scale + delta), 10);
        if (newScale !== scale) {
            const scaleRatio = newScale / scale;
            setScale(newScale);
            setPosition(newScale === 1 ? { x: 0, y: 0 } : {
                x: mouseX - (mouseX - position.x) * scaleRatio,
                y: mouseY - (mouseY - position.y) * scaleRatio
            });
        }
    }, [scale, position, isEditing, isAnalyzing]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container?.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (isEditing || isAnalyzing) return;
        setIsDragging(true);
        setDragMoved(false);
        if (!('touches' in e)) {
            lastPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
    };

    const lastPos = useRef({ x: 0, y: 0 });

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || isEditing || isAnalyzing) return;
        setDragMoved(true);
        if (!('touches' in e) && scale > 1) {
            setPosition({ x: e.clientX - lastPos.current.x, y: e.clientY - lastPos.current.y });
        }
    };

    const handleEnd = async (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        if (!dragMoved && imageRef.current) {
            const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;
            const rect = imageRef.current.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            
            if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
                const point = { x, y };
                setActivePoint(point);
                if (mode === 'audit') await runTechnicalAudit(point);
                else promptRef.current?.focus();
            }
        }
        setIsDragging(false);
    };

    const runTechnicalAudit = async (point: PrecisionPoint) => {
        setIsAnalyzing(true);
        setDiagnosis(null);
        try {
            const currentImg = editedImageSrc || imageSrc;
            const result = await analyzeTechnicalDetail(currentImg.split(',')[1], point);
            setDiagnosis(result as TechnicalDiagnosis);
            if (result.fixSuggestion) setPrompt(`[FIDELIDADE]: ${result.fixSuggestion}`);
        } catch (e) {
            showAlert("Erro na auditoria óptica.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRefineAction = async (overridePrompt?: string) => {
        const activePrompt = overridePrompt || prompt;
        if (!activePrompt.trim()) return;
        setIsEditing(true);
        try {
            const currentImg = editedImageSrc || imageSrc;
            const resultBase64 = await editImage([{ data: currentImg.split(',')[1], mimeType: 'image/png' }], activePrompt);
            if (resultBase64) {
                setEditedImageSrc(`data:image/png;base64,${resultBase64}`);
                setPrompt('');
                setActivePoint(null);
                setDiagnosis(null);
                resetView();
            }
        } catch (error) {
            showAlert('Falha ao processar refino.');
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#070505] z-[3000] flex flex-col animate-fadeIn overflow-hidden text-white">
            <header className="h-20 px-8 border-b border-white/5 flex justify-between items-center bg-[#0e0a0a] z-50 pt-safe">
                <div className="flex items-center gap-4">
                    <div className="bg-[#d4ac6e] p-2.5 rounded-2xl text-black shadow-lg"><WandIcon className="w-6 h-6" /></div>
                    <div>
                        <h2 className="text-lg font-black uppercase italic tracking-tighter">Studio <span className="text-[#d4ac6e]">Refine PhD</span></h2>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em]">Validador de Fidelidade v3.0</p>
                    </div>
                </div>
                
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                    <button onClick={() => { setMode('adjust'); setActivePoint(null); setDiagnosis(null); }} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'adjust' ? 'bg-[#d4ac6e] text-black shadow-lg' : 'text-white/40'}`}>Ajuste Manual</button>
                    <button onClick={() => { setMode('audit'); setActivePoint(null); setDiagnosis(null); }} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'audit' ? 'bg-emerald-500 text-black shadow-lg' : 'text-white/40'}`}>Auditoria de Rascunho</button>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-all text-3xl font-light">&times;</button>
                </div>
            </header>

            <div className="flex-grow flex overflow-hidden relative">
                {/* HUD de Controle Fantasma (Original vs Render) */}
                {originalSketch && (
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-6 bg-black/60 backdrop-blur-2xl p-4 py-8 rounded-full border border-white/10 shadow-3xl group">
                         <div className="flex flex-col items-center gap-2">
                             <div className="bg-[#d4ac6e] p-2 rounded-lg text-black"><SparklesIcon className="w-4 h-4" /></div>
                             <span className="text-[7px] font-black uppercase text-[#d4ac6e] tracking-widest">Render</span>
                         </div>
                         <div className="h-48 flex items-center justify-center">
                            <input 
                                type="range" min="0" max="1" step="0.01" 
                                value={ghostOpacity} 
                                onChange={(e) => setGhostOpacity(parseFloat(e.target.value))}
                                className="h-1.5 w-40 bg-white/10 rounded-full appearance-none accent-[#d4ac6e] cursor-pointer -rotate-90 origin-center"
                            />
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest">Sketch</span>
                             <div className="bg-white/5 p-2 rounded-lg text-gray-400 border border-white/5"><PencilIcon className="w-4 h-4" /></div>
                         </div>
                    </div>
                )}

                {diagnosis && (
                    <div className="absolute top-6 right-6 z-[100] w-80 animate-slideInRight">
                        <div className={`bg-[#1a1a1a] border-l-4 p-8 rounded-[2.5rem] shadow-3xl backdrop-blur-3xl ${diagnosis.severity === 'high' ? 'border-red-500' : 'border-emerald-500'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <ShieldCheckIcon className={`w-5 h-5 ${diagnosis.severity === 'high' ? 'text-red-500' : 'text-emerald-500'}`} />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Análise de Fidelidade</h4>
                                </div>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-gray-200 italic mb-6">"{diagnosis.observation}"</p>
                            <button onClick={() => handleRefineAction()} className="w-full bg-emerald-600 text-white py-4 rounded-xl text-[9px] font-black uppercase active:scale-95 shadow-xl">Corrigir Iara</button>
                        </div>
                    </div>
                )}

                <div 
                    ref={containerRef}
                    className="flex-grow relative flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
                    onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
                    onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
                    style={{ touchAction: 'none' }}
                >
                    {(isEditing || isAnalyzing) && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                             <Spinner size="lg" />
                             <p className="mt-8 text-xl font-black italic tracking-tighter uppercase text-[#d4ac6e] animate-pulse">Sincronizando milímetros...</p>
                        </div>
                    )}

                    <div 
                        className={`relative transition-all duration-700 h-full flex flex-col justify-center cursor-crosshair ${isEditing || isAnalyzing ? 'opacity-20 blur-xl scale-95' : 'opacity-100'}`}
                        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`, transformOrigin: 'center center' }}
                    >
                         {/* Camada do Rascunho Original (Ghost) */}
                         {originalSketch && (
                            <img 
                                src={originalSketch} 
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                                style={{ opacity: ghostOpacity, mixBlendMode: 'screen' }} 
                            />
                         )}

                         <img 
                            ref={imageRef}
                            src={editedImageSrc || imageSrc} 
                            className="max-w-[95vw] max-h-[80vh] object-contain shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 rounded-lg select-none pointer-events-none" 
                            draggable={false}
                            style={{ opacity: 1 - (ghostOpacity * 0.3) }}
                        />

                        {activePoint && (
                            <div className="absolute pointer-events-none z-20" style={{ left: `${activePoint.x}%`, top: `${activePoint.y}%`, transform: `translate(-50%, -50%) scale(${1/scale})` }}>
                                <div className={`w-16 h-16 border-2 rounded-full shadow-2xl flex items-center justify-center animate-scaleIn transition-all duration-700 ${mode === 'audit' ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#d4ac6e] bg-[#d4ac6e]/10'}`}>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="bg-[#0e0a0a] border-t border-white/5 p-6 pb-safe z-[60] shadow-2xl">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <div className="flex-grow relative">
                        <textarea
                            ref={promptRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={1}
                            placeholder={mode === 'audit' ? "Auditando fidelidade do rascunho..." : "Descreva ajustes de acabamento..."}
                            className="w-full bg-black border-2 border-white/10 rounded-2xl p-5 text-sm font-medium text-white outline-none focus:border-[#d4ac6e]/50 transition-all shadow-inner resize-none overflow-hidden"
                            onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefineAction(); } }}
                        />
                    </div>
                    {editedImageSrc ? (
                        <button onClick={() => { onSave(editedImageSrc.split(',')[1]); onClose(); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                            <CheckIcon className="w-5 h-5" /> Salvar Projeto
                        </button>
                    ) : (
                        <button onClick={() => handleRefineAction()} disabled={isEditing || isAnalyzing || !prompt.trim()} className="bg-[#3e3535] text-[#d4ac6e] px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-[#d4ac6e]/30 shadow-xl flex items-center gap-3 active:scale-95 transition-all disabled:opacity-20">
                            {isEditing ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                            <span>Materializar Refino</span>
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
};
