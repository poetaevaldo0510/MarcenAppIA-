
import React, { memo, useState } from "react";
import { 
  CheckCheck, Maximize, Award, DollarSign, Wrench, Loader2, Share2, 
  ChevronLeft, ChevronRight, FileJson, ShieldAlert, Key, Download 
} from "lucide-react";
import { useStore } from "../../store/yaraStore";
import { ProgressStep } from "./ProgressStep";

export const MessageBubble = memo(({ message: m, onPreview }: { message: any, onPreview: (src: string) => void }) => {
  const store = useStore();
  const [slide, setSlide] = useState(0);
  
  const handleShare = async () => {
    if (!m.project) return;
    try {
      const shareText = `MarcenApp Hub: ${m.project.title}\nOrçamento: R$ ${m.project.pricing?.finalPrice.toLocaleString('pt-BR')}\nGerado pela Yara v3.85`;
      if (navigator.share) {
        await navigator.share({
          title: `Projeto ${m.project.title}`,
          text: shareText,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Resumo do projeto copiado!");
      }
    } catch (e) { console.error(e); }
  };

  if (m.type === 'typing') {
    return (
      <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{m.text || "Yara processando..."}</span>
        </div>
      </div>
    );
  }

  const isUser = m.from === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300 w-full`}>
      <div className={`max-w-[95%] sm:max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`p-4 sm:p-8 rounded-[1.8rem] sm:rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-lg border transition-all ${isUser ? "bg-zinc-900 text-white rounded-tr-none border-zinc-900" : "bg-white text-slate-700 rounded-tl-none border-slate-100"}`}>
          {m.src && (
            <div className="relative group mb-4 overflow-hidden rounded-2xl shadow-xl border-2 border-white cursor-pointer" onClick={() => onPreview(m.src)}>
              <img src={m.src} loading="lazy" className="w-full h-auto object-cover max-h-[300px] sm:max-h-[500px] transition-transform group-hover:scale-105" alt="Sketch" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize size={32} className="text-white"/>
              </div>
            </div>
          )}
          
          {m.text && <p className="whitespace-pre-line text-left font-bold italic text-xs sm:text-sm">{m.text}</p>}
          
          {m.progressiveSteps && (
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-2">
              <ProgressStep label="DNA TÉCNICO" status={m.progressiveSteps.parsed} />
              <ProgressStep label="ORÇAMENTO" status={m.progressiveSteps.pricing} />
              <ProgressStep label="CORTE CNC" status={m.progressiveSteps.cutPlan} />
              <ProgressStep label="RENDER 8K" status={m.progressiveSteps.render === 'done' ? 'done' : m.project?.render?.status === 'error' ? 'error' : m.progressiveSteps.render} />
            </div>
          )}

          {m.project && (
            <div className="mt-8 bg-slate-50/50 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border border-slate-200 shadow-inner animate-in zoom-in-95 duration-500">
              <div className="bg-amber-600 p-5 sm:p-7 text-black flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] italic truncate pr-4">{m.project.title}</span>
                  <span className="text-[8px] font-bold uppercase opacity-60 tracking-widest mt-0.5">Hardware Supreme v3.85</span>
                </div>
                <Award size={24} className="shrink-0" />
              </div>

              <div className="p-5 sm:p-9 space-y-8 text-left">
                {m.project.render?.status === 'done' ? (
                  <div className="relative group">
                    <div className="overflow-hidden rounded-[2rem] sm:rounded-[2.8rem] border-4 sm:border-8 border-white shadow-2xl aspect-square relative bg-zinc-100">
                      <img 
                        src={slide === 0 ? m.project.render.faithfulUrl : m.project.render.decoratedUrl} 
                        loading="lazy"
                        className="w-full h-full object-cover transition-all duration-700 animate-in fade-in" 
                        alt="Render"
                      />
                      
                      <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
                        <button onClick={(e) => { e.stopPropagation(); setSlide(s => s === 0 ? 1 : 0); }} className="p-4 bg-black/50 text-white rounded-full pointer-events-auto active:scale-90 transition-transform shadow-lg hover:bg-black/70">
                          <ChevronLeft size={24} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSlide(s => s === 0 ? 1 : 0); }} className="p-4 bg-black/50 text-white rounded-full pointer-events-auto active:scale-90 transition-transform shadow-lg hover:bg-black/70">
                          <ChevronRight size={24} />
                        </button>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                        <span className="bg-black/80 backdrop-blur-md text-white text-[9px] px-4 py-1.5 rounded-full font-black uppercase shadow-xl border border-white/10">
                          {slide === 0 ? 'Técnico Industrial' : 'Architectural Digest Style'}
                        </span>
                        <div className="flex gap-1.5">
                           {[0, 1].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${slide === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />)}
                        </div>
                      </div>
                      
                      <button onClick={() => onPreview(slide === 0 ? m.project.render.faithfulUrl : m.project.render.decoratedUrl)} className="absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl pointer-events-auto active:scale-90 transition-all">
                        <Maximize size={20} />
                      </button>
                    </div>
                  </div>
                ) : m.project.render?.status === 'error' ? (
                  <div className="p-10 bg-red-50 rounded-[2.5rem] border border-red-100 flex flex-col items-center gap-5 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center"><ShieldAlert size={36} /></div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase text-red-600">Erro de Permissão (403)</p>
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">O motor de render 8K está bloqueado.</p>
                    </div>
                    <button onClick={() => store.setModal('ADMIN')} className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                      <Key size={18} /> Ativar Chave Master
                    </button>
                  </div>
                ) : (
                  <div className="h-64 sm:h-80 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#D9770608_0%,_transparent_70%)] animate-pulse" />
                    <Loader2 className="animate-spin text-amber-500" size={40} />
                    <div className="text-center space-y-1">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Materializando 8K...</span>
                       <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Aguarde o processamento industrial</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-8 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1 block">Venda Sugerida Hub</span>
                      <span className="text-3xl sm:text-4xl font-black italic text-zinc-900 tabular-nums">R$ {m.project.pricing?.finalPrice?.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleShare} className="flex-1 sm:flex-none p-5 bg-blue-50 text-blue-600 rounded-[1.5rem] active:scale-90 transition-all border border-blue-100 shadow-sm">
                        <Share2 size={24} />
                      </button>
                      <button onClick={() => store.setModal('ESTELA')} className="flex-1 sm:flex-none px-8 p-5 bg-zinc-900 text-white rounded-[1.5rem] active:scale-90 transition-all shadow-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
                        <FileJson size={20} /> Dashboard
                      </button>
                    </div>
                  </div>
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
