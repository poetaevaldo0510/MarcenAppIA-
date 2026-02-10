
import React from 'react';
import { Maximize2, Sparkles } from 'lucide-react';

interface RenderBubbleProps {
  renderedUrl: string;
  onExpand?: () => void;
}

export const RenderResultBubble: React.FC<RenderBubbleProps> = ({ 
  renderedUrl, onExpand 
}) => {
  return (
    <div 
      onClick={onExpand}
      className="w-full bg-[#202c33] rounded-3xl overflow-hidden border border-white/5 shadow-2xl my-3 animate-fadeInUp cursor-pointer group active:scale-[0.99] transition-all"
    >
      <div className="bg-[#d4ac6e]/10 px-5 py-3 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
           <Sparkles size={16} className="text-[#d4ac6e] animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4ac6e]">Materialização PhD 1:1</span>
        </div>
        <Maximize2 size={16} className="text-slate-400 group-hover:text-white transition-colors" />
      </div>

      <div className="relative aspect-video w-full bg-black overflow-hidden">
        <img src={renderedUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Render Iara" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
            <span className="text-xs font-black uppercase text-white bg-[#00a884] px-8 py-3 rounded-full shadow-2xl tracking-widest border border-white/20">Inspecionar Projeto</span>
        </div>
      </div>

      <div className="p-4 bg-[#2a3942] flex justify-center border-t border-white/5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">Toque para abrir mesa de luz HD</p>
      </div>
    </div>
  );
};
