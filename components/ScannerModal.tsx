
import React, { useState, useRef, useEffect } from 'react';
import { Spinner, CameraIcon, X } from './Shared';

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: { data: string, mimeType: string }) => void;
    title?: string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onCapture, title = "Lente de Oficina Iara" }) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    const startCamera = async () => {
        stopCamera();
        setErrorMsg(null);
        setIsCalibrating(true);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Navegador não suporta câmera.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsStreaming(true);
                    setTimeout(() => setIsCalibrating(false), 500);
                };
            }
        } catch (err: any) {
            setErrorMsg("Câmera bloqueada ou não encontrada. Verifique as permissões.");
            setIsStreaming(false);
        }
    };

    useEffect(() => {
        if (isOpen) startCamera();
        else stopCamera();
        return () => stopCamera();
    }, [isOpen]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && isStreaming && !isCapturing) {
            setIsCapturing(true);
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            if (context && canvas.width > 0) {
                try {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                    
                    // Validação de byte-size para evitar frames pretos/vazios
                    if (dataUrl.length < 1000) {
                        throw new Error("Falha na captura ótica.");
                    }

                    if (window.navigator.vibrate) window.navigator.vibrate([40, 30, 40]);
                    
                    onCapture({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
                    
                    setTimeout(() => {
                        setIsCapturing(false);
                        onClose();
                    }, 400);
                } catch (e) {
                    console.error("Capture failure", e);
                    setIsCapturing(false);
                }
            } else {
                setIsCapturing(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] bg-black flex flex-col overflow-hidden animate-fadeIn">
            <div className="flex-1 relative bg-black flex items-center justify-center">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-0'}`} 
                />
                
                {isStreaming && !isCalibrating && (
                    <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center transition-all ${isCapturing ? 'bg-white opacity-100' : 'opacity-100'}`}>
                        <div className="w-[85vw] h-[60vh] border border-white/20 rounded-[3rem] shadow-[0_0_0_100vw_rgba(0,0,0,0.6)] relative">
                             <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#d4ac6e] rounded-tl-[2.5rem]"></div>
                             <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#d4ac6e] rounded-tr-[2.5rem]"></div>
                             <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#d4ac6e] rounded-bl-[2.5rem]"></div>
                             <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#d4ac6e] rounded-br-[2.5rem]"></div>
                        </div>
                    </div>
                )}

                {(isCalibrating || isCapturing) && !errorMsg && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20">
                        <Spinner size="lg" />
                        <p className="mt-4 text-[#d4ac6e] font-black uppercase text-[10px] tracking-widest animate-pulse">
                            {isCapturing ? "Sincronizando Foto..." : "Lente Técnica Ativada..."}
                        </p>
                    </div>
                )}

                {errorMsg && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/95 z-50 text-center">
                        <div className="space-y-6">
                            <p className="text-red-400 font-bold uppercase text-[11px] tracking-widest">{errorMsg}</p>
                            <button onClick={onClose} className="bg-white/10 text-white px-8 py-4 rounded-2xl uppercase text-[10px] font-black border border-white/10 active:scale-95 transition-all">Voltar</button>
                        </div>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90 transition-all text-2xl">&times;</button>
                    <button 
                        onClick={handleCapture} 
                        disabled={!isStreaming || isCalibrating || isCapturing}
                        className="w-24 h-24 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all border-[8px] border-white/20 shadow-2xl disabled:opacity-30"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#d4ac6e] flex items-center justify-center">
                            <CameraIcon className="w-8 h-8 text-black" />
                        </div>
                    </button>
                    <div className="w-14 h-14" /> 
                </div>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.5em]">{title}</p>
            </div>
        </div>
    );
};
