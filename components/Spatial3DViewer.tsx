
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Spinner, ArrowsExpandIcon, GridIcon, SawIcon, SparklesIcon, CameraIcon, CubeIcon, WandIcon, LogoIcon, ARIcon, RefreshCcw, ShareIcon, ArrowLeftIcon } from './Shared';
import { Interactive3DModel } from './Interactive3DModel';
import { InteractiveImageViewer } from './InteractiveImageViewer';
import type { IaraDesignOutput } from '../types';

interface Spatial3DViewerProps {
  sources: string[];
  projectName: string;
  projectId?: string;
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  onOpenGallery?: () => void;
  onOpenEditor?: () => void;
  onOpenAudit?: () => void;
  onOpenShare?: () => void;
  onBackToChat?: () => void;
  isProcessing?: boolean;
  spec?: IaraDesignOutput;
}

export const Spatial3DViewer: React.FC<Spatial3DViewerProps> = ({ 
  sources, projectName, activeIdx, setActiveIdx, onOpenGallery, onOpenEditor, onOpenAudit, onOpenShare, onBackToChat, isProcessing = false, spec
}) => {
  const [viewMode, setViewMode] = useState<'render' | 'technical'>('render');
  const validSources = useMemo(() => (sources || []).filter(s => s && s.length > 5), [sources]);

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-[#050505]">
      
      {/* CABEÇALHO WHATSAPP INTEGRADO NO 3D */}
      <header className="h-[65px] bg-[#202c33] flex items-center justify-between px-4 z-[1200] border-b border-white/5 flex-shrink-0 absolute top-0 left-0 right-0">
          <div className="flex items-center gap-3">
              <button 
                onClick={onBackToChat}
                className="p-1 text-[#8696a0] hover:text-white transition-all active:scale-90"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 bg-[#d4ac6e] rounded-full flex items-center justify-center text-black border border-white/10 overflow-hidden">
                  <LogoIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                  <h1 className="text-[#e9edef] font-bold text-[15px] leading-tight">Dra. Iara Fox PhD</h1>
                  <p className="text-[10px] text-[#25d366] font-medium">inspecionando projeto...</p>
              </div>
          </div>
          <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest leading-none">{projectName}</span>
          </div>
      </header>

      <div className="flex-grow flex items-center justify-center z-0 p-0 relative overflow-hidden h-full w-full pt-[65px]">
        <div className={`w-full h-full transition-all duration-1000 ease-in-out ${viewMode === 'technical' ? 'opacity-0 invisible scale-90 blur-2xl' : 'opacity-100 visible scale-100 blur-0'}`}>
            {validSources.length > 0 ? (
                <InteractiveImageViewer 
                  src={validSources[activeIdx]} 
                  alt={projectName} 
                  projectName={projectName} 
                  allVersions={validSources}
                  activeVersionIdx={activeIdx}
                  onVersionChange={setActiveIdx}
                  isProcessing={isProcessing}
                />
            ) : !isProcessing && (
                <div className="h-full flex flex-col items-center justify-center gap-8 animate-fadeIn">
                     <div className="bg-[#111] p-16 rounded-[4rem] border border-white/5 shadow-3xl text-center">
                        <LogoIcon className="w-32 h-32 text-[#d4ac6e]/10 mx-auto mb-8 animate-pulse" />
                        <h3 className="text-white font-black uppercase italic tracking-tighter text-4xl mb-4">Pronta p/ <span className="text-[#d4ac6e]">Obra</span></h3>
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed">Aguardando rascunho técnico do Mestre Evaldo.</p>
                     </div>
                </div>
            )}
        </div>

        <div className={`absolute inset-0 pt-[65px] transition-all duration-1000 ease-in-out ${viewMode === 'render' ? 'opacity-0 invisible scale-110 blur-2xl' : 'opacity-100 visible scale-100 blur-0'}`}>
            <Interactive3DModel spec={spec} isProcessing={isProcessing} />
        </div>
      </div>

      {/* SELETOR DE MODO (HUD SUPERIOR) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1100] flex items-center bg-black/60 backdrop-blur-2xl p-1.5 rounded-full border border-white/10 shadow-3xl">
          <button 
            onClick={() => setViewMode('render')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'render' ? 'bg-[#d4ac6e] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <CameraIcon className="w-4 h-4" /> Render 8K
          </button>
          <button 
            onClick={() => setViewMode('technical')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'technical' ? 'bg-[#d4ac6e] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <CubeIcon className="w-4 h-4" /> 3D Técnico
          </button>
      </div>

      {/* BOTÕES DE AÇÃO LATERAIS */}
      <div className="absolute top-20 right-8 z-[1100] flex flex-col gap-3">
          <button 
              onClick={() => onOpenShare?.()} 
              className="w-14 h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#53bdeb] shadow-2xl active:scale-90 transition-all hover:bg-white/5"
              title="Compartilhar Projeto"
          >
              <ShareIcon className="w-6 h-6" />
          </button>
          
          <button 
              onClick={() => onOpenEditor?.()} 
              className="w-14 h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#d4ac6e] shadow-2xl active:scale-90 transition-all hover:bg-white/5"
              title="Ajustar Render"
          >
              <WandIcon className="w-6 h-6" />
          </button>
          
          {spec?.architecturalAudit && (
              <button 
                  onClick={() => onOpenAudit?.()} 
                  className="w-14 h-14 bg-[#25d366]/10 backdrop-blur-xl border border-[#25d366]/20 rounded-2xl flex items-center justify-center text-[#25d366] shadow-2xl active:scale-90 transition-all hover:bg-[#25d366]/20"
                  title="Auditoria Técnica"
              >
                  <ARIcon className="w-6 h-6" />
              </button>
          )}
      </div>
      
    </div>
  );
};
