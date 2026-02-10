
import React, { useState } from 'react';
import { ShareIcon, WhatsappIcon, EmailIcon, CopyIcon, CheckIcon, LogoIcon, DownloadIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';
import { PDFExport } from '../utils/helpers';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, project }) => {
    const [copyFeedback, setCopyFeedback] = useState(false);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}/share/${project.id}`;
    const shareText = `Confira este projeto de marcenaria: "${project.name}" gerado na Oficina Digital Iara!`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const handleExportPDF = () => {
        // Tenta exportar o elemento de dossiê público se disponível ou o próprio chat
        const element = document.getElementById('project-share-content') || document.body;
        PDFExport(element, `projeto-${project.name.replace(/\s+/g, '_')}.pdf`);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Projeto: ${project.name}`,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Erro ao compartilhar:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-slideInUp sm:animate-scaleIn" 
                onClick={e => e.stopPropagation()}
            >
                <header className="p-8 text-center bg-[#f8f9fa] border-b border-gray-100">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#1a1a1a] p-4 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <ShareIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-[#1a1a1a] uppercase italic tracking-tighter">Compartilhar Projeto</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Dossiê Digital do Mestre Evaldo</p>
                </header>

                <main className="p-8 space-y-6">
                    {/* Grid de Ações */}
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={shareWhatsApp}
                            className="flex flex-col items-center gap-3 p-4 bg-green-50 rounded-[2rem] border border-green-100 active:scale-95 transition-all group hover:scale-[1.05]"
                        >
                            <div className="bg-[#25D366] text-white p-3 rounded-2xl shadow-[0_8px_16px_rgba(37,211,102,0.3)] group-hover:shadow-[0_12px_24px_rgba(37,211,102,0.4)] transition-all">
                                <WhatsappIcon className="w-6 h-6" />
                            </div>
                            <span className="text-[8px] font-black uppercase text-green-700">WhatsApp</span>
                        </button>

                        <button 
                            onClick={handleExportPDF}
                            className="flex flex-col items-center gap-3 p-4 bg-red-50 rounded-[2rem] border border-red-100 active:scale-95 transition-all group"
                        >
                            <div className="bg-red-500 text-white p-3 rounded-2xl shadow-md group-hover:shadow-lg transition-all">
                                <DownloadIcon className="w-6 h-6" />
                            </div>
                            <span className="text-[8px] font-black uppercase text-red-700">Exportar PDF</span>
                        </button>

                        <button 
                            onClick={handleCopyLink}
                            className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border active:scale-95 transition-all group ${copyFeedback ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <div className={`p-3 rounded-2xl shadow-md group-hover:shadow-lg transition-all ${copyFeedback ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}`}>
                                {copyFeedback ? <CheckIcon className="w-6 h-6" /> : <CopyIcon className="w-6 h-6" />}
                            </div>
                            <span className={`text-[8px] font-black uppercase ${copyFeedback ? 'text-blue-700' : 'text-gray-700'}`}>
                                {copyFeedback ? 'Copiado!' : 'Copiar Link'}
                            </span>
                        </button>
                    </div>

                    <button 
                        onClick={handleNativeShare}
                        className="w-full bg-[#1a1a1a] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                    >
                        <ShareIcon className="w-4 h-4 text-[#d4ac6e]" /> Outros Aplicativos
                    </button>

                    {/* Link Direto */}
                    <div className="space-y-2 pt-2">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">URL de Visualização do Cliente</label>
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 overflow-hidden">
                            <input 
                                readOnly 
                                value={shareUrl} 
                                className="flex-grow bg-transparent text-[10px] font-medium text-gray-400 px-3 outline-none overflow-hidden text-ellipsis whitespace-nowrap" 
                            />
                        </div>
                    </div>
                </main>

                <footer className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <button 
                        onClick={onClose}
                        className="text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-[#1a1a1a] transition-colors"
                    >
                        Fechar Janela
                    </button>
                </footer>
            </div>
        </div>
    );
};
