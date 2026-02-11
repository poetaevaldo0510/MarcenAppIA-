
import React, { memo } from "react";
import { CheckCheck, Maximize, RotateCcw, Award, DollarSign, Wrench, Loader2, Sparkles, Box } from "lucide-react";
import { useStore } from "../../store/yaraStore";
import { ProgressStep } from "./ProgressStep";

export const MessageBubble = memo(({ message: m, onPreview }: { message: any, onPreview: (src: string) => void }) => {
  const store = useStore();
  
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

  return (
    <div className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[90%] sm:max-w-[80%] flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}>
        <div className={`p-6 sm:p-8 rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-lg border ${m.from === "user" ? "bg-zinc-900 text-white rounded-tr-none border-zinc-900" : "bg-white text-slate-700 rounded-tl-none border-slate-100"}`}>
          {m.src && (
            <div className="relative group mb-6">
              <img src={m.src} className="rounded-2xl w-full h-auto border-4 border-white shadow-xl" alt="Scan" />
              <button onClick={() => onPreview(m.src)} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"><Maximize size={24} className="text-white"/></button>
            </div>
          )}
          {m.text && <p className="whitespace-pre-line text-left font-bold italic">{m.text}</p>}
          
          {m.progressiveSteps && (
            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProgressStep label="DNA TÉCNICO" status={m.progressiveSteps.parsed} />
              <ProgressStep label="HUB PRICING" status={m.progressiveSteps.pricing} />
              <ProgressStep label="CORTE CNC" status={m.progressiveSteps.cutPlan} />
              <ProgressStep label="RENDER 8K" status={m.progressiveSteps.render} />
            </div>
          )}

          {m.project && (
            <div className="mt-10 bg-slate-50/50 rounded-[3rem] overflow-hidden border border-slate-200 shadow-inner animate-in zoom-in-95 duration-500">
              <div className="bg-amber-600 p-6 text-black flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-[0.2em] italic">{m.project.title}</span><Award size={24} /></div>
              <div className="p-8 space-y-10 text-left">
                {m.project.render?.status === 'done' ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="relative group cursor-pointer" onClick={() => onPreview(m.project.render.faithfulUrl)}>
                      <img src={m.project.render.faithfulUrl} className="aspect-square object-cover rounded-[2rem] border-4 border-white shadow-xl transition-transform group-hover:scale-105" />
                      <span className="absolute bottom-4 left-4 bg-black/80 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase">Técnico</span>
                    </div>
                    <div className="relative group cursor-pointer" onClick={() => onPreview(m.project.render.decoratedUrl)}>
                      <img src={m.project.render.decoratedUrl} className="aspect-square object-cover rounded-[2rem] border-4 border-white shadow-xl transition-transform group-hover:scale-105" />
                      <span className="absolute bottom-4 left-4 bg-amber-600/90 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase">AD Style</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-6 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#D9770608_0%,_transparent_70%)] animate-pulse" />
                    <div className="relative">
                       <Loader2 className="animate-spin text-amber-500" size={48} />
                       <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-bounce" size={16} />
                    </div>
                    <div className="text-center space-y-2 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Materializando Render 8K</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-8 leading-relaxed">Sincronizando luz Architectural Digest e volumes técnicos...</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest leading-none">Venda Estimada Hub</span>
                    <span className="text-3xl font-black italic text-zinc-900">R$ {m.project.pricing?.finalPrice?.toLocaleString('pt-BR') || '---'}</span>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => store.setModal('ESTELA')} className="p-5 bg-white text-emerald-600 rounded-[1.5rem] border border-slate-100 shadow-md hover:shadow-lg transition-all active:scale-90"><DollarSign size={24}/></button>
                    <button onClick={() => store.setModal('BENTO')} className="p-5 bg-white text-amber-600 rounded-[1.5rem] border border-slate-100 shadow-md hover:shadow-lg transition-all active:scale-90"><Wrench size={24}/></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4 opacity-40 text-[9px] font-black uppercase tracking-widest gap-2 items-center">
            {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {m.from === 'user' && <CheckCheck size={14} className="text-emerald-500" />}
          </div>
        </div>
      </div>
    </div>
  );
});
