
import React, { useRef, useState, useEffect } from 'react';
/* Added missing LogoIcon to imports from Shared */
import { CheckIcon, TrashIcon, ToolsIcon, Spinner, UndoIcon, SunIcon, PencilIcon, LogoIcon } from './Shared';

interface ImageSketcherProps {
    isOpen: boolean;
    imageSrc: string;
    onSave: (finalImageBase64: string) => void;
    onClose: () => void;
}

export const ImageSketcher: React.FC<ImageSketcherProps> = ({ isOpen, imageSrc, onSave, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [color, setColor] = useState('#d4ac6e');
    const [brushSize, setBrushSize] = useState(3);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (isOpen && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                const containerWidth = containerRef.current!.clientWidth;
                const containerHeight = containerRef.current!.clientHeight;
                const imgRatio = img.width / img.height;
                const containerRatio = containerWidth / containerHeight;

                if (imgRatio > containerRatio) {
                    canvas.width = containerWidth;
                    canvas.height = containerWidth / imgRatio;
                } else {
                    canvas.height = containerHeight;
                    canvas.width = containerHeight * imgRatio;
                }

                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
                }
            };
        }
    }, [isOpen, imageSrc]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            const { x, y } = getCoordinates(e);
            ctx.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const { x, y } = getCoordinates(e);
            ctx.lineTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing && canvasRef.current) {
            setIsDrawing(false);
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const newState = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
                setHistory(prev => [...prev, newState]);
            }
        }
    };

    const handleUndo = () => {
        if (history.length <= 1) return;
        const newHistory = [...history];
        newHistory.pop();
        const prevState = newHistory[newHistory.length - 1];
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && prevState) {
            ctx.putImageData(prevState, 0, 0);
            setHistory(newHistory);
        }
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                setHistory([ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)]);
            };
        }
    };

    const handleFinalize = () => {
        setIsProcessing(true);
        if (canvasRef.current) {
            setTimeout(() => {
                const dataUrl = canvasRef.current!.toDataURL('image/jpeg', 0.9);
                onSave(dataUrl.split(',')[1]);
                setIsProcessing(false);
            }, 800);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/98 z-[700] flex flex-col animate-fadeIn overflow-hidden font-sans">
            <header className="h-16 flex-shrink-0 bg-[#0e0a0a] border-b border-white/5 px-6 flex justify-between items-center z-[80] pt-safe">
                <div className="flex items-center gap-3">
                    <div className="bg-[#d4ac6e] p-2 rounded-xl text-black shadow-lg">
                        <PencilIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase italic tracking-tighter text-sm leading-none">Mesa Técnica</h2>
                        <p className="text-[8px] text-[#d4ac6e] font-black uppercase tracking-[0.3em] mt-1">Visão Computacional Ativa</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all">&times;</button>
            </header>

            <main ref={containerRef} className="flex-grow relative flex items-center justify-center bg-[#050505] p-4 cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    className="max-w-full max-h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 rounded-lg touch-none bg-black"
                />
                
                {/* Janela de Configurações de Ferramentas (Floating Panel) */}
                {showSettings && (
                    <div className="absolute bottom-10 right-10 w-64 bg-[#1a1414]/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] shadow-3xl animate-scaleIn z-[100]">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase text-[#d4ac6e] tracking-widest">Ferramentas</span>
                            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white text-lg">&times;</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                    <span>Ponta do Lápis</span>
                                    <span className="text-[#d4ac6e]">{brushSize}px</span>
                                </label>
                                <input type="range" min="1" max="25" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-full appearance-none accent-[#d4ac6e] cursor-pointer" />
                            </div>

                            <div>
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Cor de Marcação</label>
                                <div className="flex flex-wrap gap-2">
                                    {['#d4ac6e', '#ffffff', '#ff0000', '#00ff00', '#00aaff'].map(c => (
                                        <button 
                                            key={c} 
                                            onClick={() => setColor(c)} 
                                            className={`w-10 h-10 rounded-xl border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-[150]">
                        <Spinner size="lg" />
                        <p className="mt-6 text-[#d4ac6e] font-black uppercase tracking-[0.4em] italic text-xs animate-pulse">Codificando Geometria...</p>
                    </div>
                )}
            </main>

            <footer className="bg-[#0e0a0a] border-t border-white/5 p-6 pb-safe z-[90] shadow-[0_-20px_40px_rgba(0,0,0,0.2)]">
                <div className="max-w-xl mx-auto flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button onClick={() => setShowSettings(!showSettings)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${showSettings ? 'bg-[#d4ac6e] text-black border-[#d4ac6e]' : 'bg-white/5 text-[#d4ac6e] border-white/5 hover:bg-white/10'}`} title="Configurações de Pincel">
                                <ToolsIcon className="w-6 h-6" />
                            </button>
                            <button onClick={handleUndo} disabled={history.length <= 1} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${history.length <= 1 ? 'opacity-20 border-white/5 text-gray-500' : 'bg-white/5 text-[#d4ac6e] border-white/5 hover:bg-white/10'}`} title="Desfazer">
                                <UndoIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <button onClick={clearCanvas} className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 hover:bg-red-500/20 transition-all" title="Limpar Área">
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
                        <LogoIcon className="w-24 h-24" />
                    </div>

                    <button 
                        onClick={handleFinalize}
                        disabled={isProcessing}
                        className="w-full bg-[#d4ac6e] text-black font-black py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[10px]"
                    >
                        {isProcessing ? <Spinner size="sm" /> : <CheckIcon className="w-5 h-5" />}
                        Aplicar às Medidas Técnicas
                    </button>
                </div>
            </footer>
        </div>
    );
};
