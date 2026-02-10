
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightIcon, Spinner, DownloadIcon, WhatsappIcon, CheckIcon, LogoIcon, SparklesIcon, X, ShareIcon } from './Shared';
import { copyImageToClipboard, downloadBase64File } from '../utils/helpers';
import { Share2, CheckCircle, Download, Wand2 } from 'lucide-react';

interface ProjectImageGalleryProps {
    isOpen: boolean;
    images: string[];
    onClose: () => void;
    initialIndex?: number;
    projectName?: string;
    showAlert?: (msg: string, title?: string) => void;
    onOpenStudio?: () => void;
}

export const ProjectImageGallery: React.FC<ProjectImageGalleryProps> = ({ 
    isOpen, images, onClose, initialIndex = 0, projectName = "Projeto", showAlert, onOpenStudio
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLoading, setIsLoading] = useState(true);
    const [shareLoading, setShareLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setIsLoading(true);
        }
    }, [isOpen, initialIndex]);

    const handleSharePhoto = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShareLoading(true);
        try {
            const imageUrl = images[currentIndex];
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `${projectName}.png`, { type: 'image/png' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: `Aprovação: ${projectName}` });
            } else {
                await copyImageToClipboard(imageUrl);
                showAlert?.("Imagem copiada! Cole no WhatsApp.", "Sucesso");
            }
        } catch (err) {
            showAlert?.("Erro ao compartilhar.");
        } finally {
            setShareLoading(false);
        }
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const fileName = `MarcenaPP_${projectName.replace(/\s+/g, '_')}_v${currentIndex + 1}.png`;
        downloadBase64File(images[currentIndex], fileName);
        showAlert?.("Download iniciado.", "Arquivo");
    };

    if (!isOpen || !images.length) return null;

    return (
        <div className="fixed inset-0 z-[5000] bg-black flex flex-col animate-fadeIn select-none overflow-hidden" onClick={onClose}>
            {/* Background blur estético */}
            <div className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-1000">
                <img src={images[currentIndex]} className="w-full h-full object-cover blur-[120px] scale-150" alt="bg" />
            </div>

            <header className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pt-safe" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col">
                    <h3 className="text-[#d4ac6e] text-[10px] font-black uppercase tracking-[0.4em] italic">Mesa de Aprovação</h3>
                    <p className="text-white font-black text-sm uppercase tracking-tighter truncate max-w-[200px]">{projectName}</p>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center text-3xl font-light active:scale-90 transition-all">&times;</button>
            </header>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
                {isLoading && <div className="absolute inset-0 flex items-center justify-center z-20"><Spinner size="lg" /></div>}
                <img 
                    src={images[currentIndex]} 
                    onLoad={() => setIsLoading(false)}
                    className={`max-w-[95vw] max-h-[75vh] object-contain transition-all duration-500 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5 rounded-2xl ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                />
                
                {images.length > 1 && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); setIsLoading(true); }} className="absolute left-4 w-12 h-12 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white active:scale-75 transition-all shadow-2xl"><ArrowRightIcon className="w-5 h-5 rotate-180" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); setIsLoading(true); }} className="absolute right-4 w-12 h-12 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white active:scale-75 transition-all shadow-2xl"><ArrowRightIcon className="w-5 h-5" /></button>
                    </>
                )}
            </div>

            {/* BARRA DE AÇÕES INFERIOR */}
            <footer className="relative z-10 px-6 py-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center gap-6 pb-safe" onClick={e => e.stopPropagation()}>
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
                    <button 
                        onClick={() => { showAlert?.("Projeto confirmado e enviado para produção!", "Mestre Evaldo"); onClose(); }}
                        className="flex-1 min-w-[140px] bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} /> Confirmar
                    </button>
                    
                    <button 
                        onClick={handleSharePhoto}
                        disabled={shareLoading}
                        className="flex-1 min-w-[140px] bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        {shareLoading ? <Spinner size="sm" /> : <><Share2 size={18} /> Compartilhar</>}
                    </button>

                    <button 
                        onClick={handleDownload}
                        className="w-14 h-14 bg-white/10 text-white rounded-2xl border border-white/10 active:scale-95 flex items-center justify-center transition-all shadow-xl"
                        title="Baixar Imagem"
                    >
                        <Download size={20} />
                    </button>

                    <button 
                        onClick={onOpenStudio}
                        className="flex-1 min-w-[140px] bg-[#d4ac6e] text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Wand2 size={18} /> Pedir Alteração
                    </button>
                </div>
                
                <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.6em] animate-pulse">Padrão Digital Dynamics 8K Render</p>
            </footer>
        </div>
    );
};
