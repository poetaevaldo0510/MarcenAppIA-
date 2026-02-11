
import React, { memo, useState } from "react";
import { 
  CheckCheck, Maximize, Award, Loader2, Share2, 
  ChevronLeft, ChevronRight, FileJson, ShieldAlert, Key, 
  AlertTriangle, CheckCircle, Hammer, Ruler, Box, Package, X, RotateCcw, Clock, History
} from "lucide-react";
import { useStore } from "../../store/yaraStore";
import { ProgressStep } from "./ProgressStep";
import { ChatFlowService } from "../../services/chatFlow";

export const MessageBubble = memo(({ message: m, onPreview }: { message: any, onPreview: (src: string) => void }) => {
  const store = useStore();
  const [viewMode, setViewMode] = useState(0); // 0: Faithful, 1: Decorated
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const handleConfirmProduction = async () => {
    setIsActionLoading(true);
    await ChatFlowService.confirmAndProduce(m.id);
    setIsActionLoading(false);
  };

  const handleReRender = async () => {
    setIsActionLoading(true);
    await ChatFlowService.reRenderLocked(m.id);
    setIsActionLoading(false);
  };

  const handleSwitchVersion = (versionNum: number) => {
    const version = m.project.renderHistory.find((v: any) => v.version === versionNum);
    if (version) {
      store.updateMessage(m.id, {
        project: {
          ...m.project,
          currentVersion: versionNum,
          render: {
            ...m.project.render,
            faithfulUrl: version.faithfulUrl,
            decoratedUrl: version.decoratedUrl
          }
        }
      });
    }
  };

  if (m.type === 'typing') {
    return (
      <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{m.text}</span>
        </div>
      </div>
    );
  }

  const isUser = m.from === "user";
  const isWaiting = m.status === 'waiting_confirmation';
  const isLocked = m.project?.status === 'LOCKED';
  const isError = m.status === 'error';

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300 w-full`}>
      <div className={`max-w-[95%] sm:max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`p-4 sm:p-8 rounded-[1.8rem] sm:rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-lg border transition-all ${isUser ? "bg-zinc-900 text-white rounded-tr-none border-zinc-900" : "bg-white text-slate-700 rounded-tl-none border-slate-100"}`}>
          {m.src && (
            <div className="relative group mb-4 overflow-hidden rounded-2xl shadow-xl border-2 border-white cursor-pointer" onClick={() => onPreview(m.src)}>
              <img src={m.src} loading="lazy" className="w-full h-auto object-cover max-h-[300px] sm:max-h-[500px]" alt="Source DNA" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize size={32} className="text-white"/>
              </div>
            </div>
          )}
          
          {m.text && <p className={`whitespace-pre-line text-left font-bold italic text-xs sm:text-sm ${isError ? 'text-red-500' : ''}`}>{m.text}</p>}
          
          {m.project && !isUser && (
            <div className="mt-6 space-y-4">
              {/* PAINEL TÉCNICO DE DNA */}
              <div className={`p-5 rounded-[2rem] border-2 text-left transition-all ${isLocked ? 'bg-zinc-900 text-white border-white/10' : (m.project.validation?.isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100')} shadow-xl`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Ruler size={16} className={isLocked ? 'text-amber-500' : (m.project.validation?.isValid ? 'text-emerald-600' : 'text-red-600')} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">DNA Estrutural Master (mm)</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-2 ${isLocked ? 'bg-amber-600 text-black' : (m.project.validation?.isValid ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}`}>
                    {isLocked && <ShieldAlert size={10} />}
                    {isLocked ? 'DNA LOCKED' : (m.project.validation?.isValid ? 'VALIDADO 1:1' : 'ERRO TÉCNICO')}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-tighter">Largura Ambiente</span>
                    <p className="text-sm font-black">{m.project.environment.width}mm</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-tighter">Altura Ambiente</span>
                    <p className="text-sm font-black">{m.project.environment.height}mm</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                  {m.project.modules.map((mod: any, idx: number) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isLocked ? 'bg-white/5 border-white/5' : 'bg-white/50 border-white shadow-sm'}`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Box size={14} className="opacity-40 shrink-0" />
                        <span className="text-[10px] font-bold uppercase truncate">{mod.type}</span>
                      </div>
                      <span className="text-[10px] font-black tabular-nums shrink-0">{mod.dimensions.w}x{mod.dimensions.h}mm</span>
                    </div>
                  ))}
                </div>

                {m.project.validation?.alerts.length > 0 && (
                  <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={12}/> Alertas de Engenharia:</p>
                    <ul className="mt-1 space-y-1">
                      {m.project.validation.alerts.map((alert: string, idx: number) => (
                        <li key={idx} className="text-[10px] font-bold text-red-400">• {alert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* AÇÃO DE BLOQUEIO (LOCK) */}
              {isWaiting && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 delay-200">
                  <button 
                    onClick={handleConfirmProduction}
                    disabled={isActionLoading || !m.project.validation?.isValid}
                    className={`flex-1 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all ${
                      !m.project.validation?.isValid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    {isActionLoading ? <Loader2 className="animate-spin" size={20}/> : <Hammer size={20}/>}
                    Confirmar Produção (LOCK)
                  </button>
                  <button onClick={() => store.deleteMessage(m.id)} className="p-5 bg-zinc-100 text-zinc-400 rounded-[1.5rem] hover:bg-zinc-200 transition-all active:scale-95">
                    <X size={20}/>
                  </button>
                </div>
              )}
            </div>
          )}

          {m.progressiveSteps && (
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-2">
              <ProgressStep label="DNA TÉCNICO" status={m.progressiveSteps.parsed} />
              <ProgressStep label="ORÇAMENTO" status={m.progressiveSteps.pricing} />
              <ProgressStep label="CORTE CNC" status={m.progressiveSteps.cutPlan} />
              <ProgressStep label="RENDER MASTER" status={m.progressiveSteps.render} />
            </div>
          )}

          {m.project && isLocked && (
            <div className="mt-8 bg-white rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95">
              <div className="bg-[#09090b] p-5 sm:p-7 text-white flex justify-between items-center">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] italic truncate pr-4 text-amber-500">DNA LOCKED • {m.project.title}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] font-bold uppercase opacity-60 tracking-widest leading-none">ESTRUTURA IMUTÁVEL • VERSÃO {m.project.currentVersion}</span>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {m.project.renderHistory?.length > 1 && (
                     <div className="flex bg-white/10 rounded-full p-1 border border-white/5 mr-2">
                        {m.project.renderHistory.map((v: any) => (
                          <button 
                            key={v.version} 
                            onClick={() => handleSwitchVersion(v.version)}
                            className={`w-6 h-6 rounded-full text-[9px] font-black transition-all ${m.project.currentVersion === v.version ? 'bg-amber-600 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-white'}`}
                          >
                            {v.version}
                          </button>
                        ))}
                     </div>
                   )}
                   <CheckCircle size={24} className="text-amber-500 shrink-0" />
                </div>
              </div>

              <div className="p-5 sm:p-9 space-y-8 text-left">
                {m.project.render?.status === 'done' && (
                  <div className="relative group">
                    <div className="overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl aspect-square relative bg-zinc-100">
                      <img 
                        src={viewMode === 0 ? m.project.render.faithfulUrl : m.project.render.decoratedUrl} 
                        className="w-full h-full object-cover transition-all duration-700" 
                        alt="Render Industrial Version"
                      />
                      <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setViewMode(v => v === 0 ? 1 : 0); }} className="p-4 bg-black/60 text-white rounded-full pointer-events-auto shadow-lg backdrop-blur-md active:scale-90"><ChevronLeft size={24} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setViewMode(v => v === 0 ? 1 : 0); }} className="p-4 bg-black/60 text-white rounded-full pointer-events-auto shadow-lg backdrop-blur-md active:scale-90"><ChevronRight size={24} /></button>
                      </div>
                      <div className="absolute bottom-6 left-6 flex gap-2">
                        <div className="bg-zinc-900/90 backdrop-blur-md text-white text-[9px] px-4 py-2 rounded-full font-black uppercase tracking-widest border border-white/10 shadow-2xl">
                          {viewMode === 0 ? 'PURISTA 1:1' : 'ARCHVIZ STYLE'}
                        </div>
                        <div className="bg-amber-600/90 backdrop-blur-md text-black text-[9px] px-4 py-2 rounded-full font-black uppercase tracking-widest border border-white/10 shadow-2xl">
                          v{m.project.currentVersion}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                   <button 
                     onClick={handleReRender}
                     disabled={isActionLoading}
                     className="py-5 bg-zinc-900 text-white rounded-[1.5rem] font-black uppercase text-[9px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-95 shadow-xl"
                   >
                     {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                     Re-renderizar (LOCK)
                   </button>
                   <button onClick={() => store.setModal('ESTELA')} className="py-5 bg-white border border-zinc-200 text-zinc-900 rounded-[1.5rem] font-black uppercase text-[9px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm">
                     <FileJson size={18} /> Painel Hub Financeiro
                   </button>
                </div>
              </div>
            </div>
          )}

          <div className={`flex items-center gap-2 mt-4 opacity-40 text-[9px] font-black uppercase tracking-widest ${isUser ? "justify-end" : "justify-start"}`}>
            {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {isUser && <CheckCheck size={14} className="text-emerald-500" />}
          </div>
        </div>
      </div>
    </div>
  );
});
