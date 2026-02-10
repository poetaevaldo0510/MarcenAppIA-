
import React, { useState, useRef, useEffect } from 'react';
import { Spinner, ARIcon, CheckIcon, LogoIcon } from './Shared';

interface ARViewerProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
    projectName: string;
}

export const ARViewer: React.FC<ARViewerProps> = ({ isOpen, imageSrc, onClose, projectName }) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isCalibrating, setIsCalibrating] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsStreaming(true);
            
            // Simula calibração espacial de IA
            setTimeout(() => setIsCalibrating(false), 3000);
        } catch (err) {
            console.error("Camera access error:", err);
            setIsStreaming(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col overflow-hidden animate-fadeIn">
            {/* Feed da Câmera Principal */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-90"
            />

            {/* Render Overlay (Holograma AR) */}
            {!isCalibrating && (
                <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300"
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    }}
                >
                    <div className="relative group/ar">
                         {/* Glow de profundidade */}
                        <div className="absolute inset-0 blur-3xl bg-[#d4ac6e]/10 rounded-full animate-pulse"></div>
                        <img 
                            src={imageSrc} 
                            alt="AR Project View" 
                            className="relative max-w-[85vw] max-h-[75vh] object-contain drop-shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-4 border-white/10 rounded-2xl brightness-110"
                        />
                    </div>
                </div>
            )}

            {/* Interface de Controle (Glassmorphism) */}
            <div className="relative z-10 flex flex-col h-full pointer-events-none">
                <header className="p-6 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-start pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#d4ac6e] p-3 rounded-2xl text-[#3e3535] shadow-2xl animate-pulse">
                            <ARIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-white font-black uppercase tracking-tighter italic text-2xl drop-shadow-lg">Iara Vision AR</h2>
                            <p className="text-[#d4ac6e] text-[9px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded w-fit">Modo Bancada Virtual Ativo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 backdrop-blur-2xl text-white w-12 h-12 rounded-2xl flex items-center justify-center text-4xl hover:bg-white/20 transition-all border border-white/10 shadow-2xl">&times;</button>
                </header>

                {isCalibrating && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center px-10">
                        <div className="bg-black/40 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                            <Spinner size="lg" />
                            <h3 className="text-white font-black uppercase italic tracking-tighter mt-8 text-2xl">Mapeando Ambiente...</h3>
                            <p className="text-[#d4ac6e] text-[10px] font-black uppercase tracking-[0.3em] mt-4 max-w-xs leading-relaxed">Mova a câmera lateralmente para encontrar os planos de instalação.</p>
                        </div>
                    </div>
                )}

                {!isCalibrating && (
                    <footer className="mt-auto p-10 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-8 pointer-events-auto">
                        <div className="flex items-center gap-10 bg-black/50 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escala Real</span>
                                <input 
                                    type="range" min="0.3" max="2.5" step="0.01" value={scale} 
                                    onChange={(e) => setScale(Number(e.target.value))}
                                    className="w-48 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d4ac6e]"
                                />
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="flex gap-4">
                                <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[#d4ac6e] hover:bg-[#d4ac6e] hover:text-[#3e3535] transition-all">
                                    <LogoIcon className="w-6 h-6" />
                                </button>
                                <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all">
                                    <ARIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mb-6 animate-pulse">Toque e arraste para posicionar o móvel</p>
                            <button 
                                onClick={onClose}
                                className="bg-[#d4ac6e] text-[#3e3535] font-black py-5 px-16 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs"
                            >
                                <CheckIcon className="w-6 h-6" /> Confirmar Instalação
                            </button>
                        </div>
                    </footer>
                )}
            </div>

            {/* Grid de Alinhamento Minimalista */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
                <div className="absolute top-0 left-1/2 w-px h-full bg-white"></div>
            </div>
        </div>
    );
};
