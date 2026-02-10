import React, { useState, useEffect } from 'react';
import { Copy, Image as ImageIcon, Edit3, CheckCircle, RefreshCw } from 'lucide-react';

interface RenderConsoleProps {
  initialPrompt: string;
  onGenerate: (finalPrompt: string) => void;
  isGenerating?: boolean;
}

export const RenderCommandConsole: React.FC<RenderConsoleProps> = ({ 
  initialPrompt, 
  onGenerate,
  isGenerating = false
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 bg-[#0a0a0a] border border-[#d4ac6e]/30 rounded-2xl overflow-hidden shadow-2xl animate-fadeInUp">
      <div className="bg-black px-4 py-3 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="bg-[#d4ac6e] p-1.5 rounded-lg text-black">
            <ImageIcon size={14} />
          </div>
          <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
            Iara Render Core
          </span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[8px] font-black text-green-500/80 uppercase tracking-widest">
            Ready
          </span>
        </div>
      </div>

      <div className="p-4">
        <label className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-2 block flex items-center gap-2">
          <Edit3 size={10} /> Script de Imagem (8K Engine):
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-28 bg-white/5 text-[#d4ac6e] font-mono text-[11px] p-4 rounded-xl border border-white/10 focus:border-[#d4ac6e]/50 focus:outline-none resize-none leading-relaxed"
          spellCheck={false}
        />
        
        <p className="text-[8px] text-gray-500 mt-2 uppercase font-bold tracking-tighter">
          * Mestre, o script em inglês garante maior realismo nos nós da madeira e reflexos do tampo.
        </p>
      </div>

      <div className="bg-white/5 px-4 py-4 flex gap-3 justify-end items-center">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-400 transition-all active:scale-95 border border-white/5"
        >
          {copied ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>

        <button
          onClick={() => onGenerate(prompt)}
          disabled={isGenerating}
          className={`
            flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black text-black uppercase tracking-[0.2em] transition-all active:scale-95
            ${isGenerating 
              ? 'bg-gray-700 cursor-not-allowed opacity-50' 
              : 'bg-[#d4ac6e] shadow-xl shadow-[#d4ac6e]/10 hover:brightness-110'}
          `}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Processando...
            </>
          ) : (
            <>
              <ImageIcon size={14} /> Disparar Render
            </>
          )}
        </button>
      </div>
    </div>
  );
};