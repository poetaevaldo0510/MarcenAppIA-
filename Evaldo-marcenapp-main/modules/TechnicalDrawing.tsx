
import React, { useState, useEffect } from 'react';
import { Ruler, FileCode, Download, Loader2, Sparkles, ArrowRight, RefreshCw, Layers, Box, Info } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { ProjectData } from '../types';
import { generateTechnicalDrawing } from '../geminiService';

interface Props {
  project: ProjectData;
  onNavigate: (m: any) => void;
}

export const TechnicalDrawing: React.FC<Props> = ({ project, onNavigate }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchDrawing = async () => {
    setLoading(true);
    try {
      const svg = await generateTechnicalDrawing(project);
      const cleanSvg = svg.replace(/```svg/g, '').replace(/```/g, '').trim();
      setSvgContent(cleanSvg);
    } catch (err) {
      console.error("Erro ao gerar desenho técnico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawing();
  }, [project]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Industrial.<span className="text-amber-500">Blueprint</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Elevação técnica e detalhamento de cotas para fabricação.</p>
        </div>
        <div className="flex gap-4">
           <Badge variant="info">CAD Engine v2.0</Badge>
           <Button variant="secondary" icon={RefreshCw} onClick={fetchDrawing} disabled={loading}>Regerar</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-8 border-white/5 bg-[#141210]">
            <h2 className="text-lg font-black italic text-amber-50 mb-8 uppercase flex items-center gap-3 border-b border-white/5 pb-4">
              <Box className="text-amber-500" size={20} /> Legenda
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-bold uppercase">Portas</span>
                <span className="font-black text-amber-50">{project.doors} unidades</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-bold uppercase">Gavetas</span>
                <span className="font-black text-amber-50">{project.drawers} unidades</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-bold uppercase">Largura</span>
                <span className="font-black text-amber-50">{project.width}m</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-bold uppercase">Altura</span>
                <span className="font-black text-amber-50">{project.height}m</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-bold uppercase">Profund.</span>
                <span className="font-black text-amber-50">{project.depth}m</span>
              </div>
            </div>
            <div className="pt-10">
               <Button variant="primary" className="w-full h-14 rounded-2xl" onClick={() => onNavigate('budget')} icon={ArrowRight}>Ir para Orçamento</Button>
            </div>
          </Card>

          <Card className="p-6 border-indigo-500/10 bg-indigo-500/5">
             <div className="flex gap-4">
                <Info size={20} className="text-indigo-400 shrink-0" />
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed">
                  Utilize este desenho para validar as folgas de portas (4mm) e alinhamento de frentes antes do corte.
                </p>
             </div>
          </Card>
        </div>

        <div className="lg:col-span-9">
          <Card className="bg-[#0c1015] border-white/10 min-h-[600px] relative overflow-hidden flex flex-col p-4 shadow-3xl ring-1 ring-white/5">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#2a3441 1px, transparent 1px), linear-gradient(90deg, #2a3441 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <header className="relative z-10 flex justify-between items-center mb-6 px-6 pt-4">
               <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Blueprint Ativo: Escala 1:20</span>
               </div>
               <div className="flex gap-3">
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-stone-400" onClick={() => {
                    const blob = new Blob([svgContent], {type: 'image/svg+xml'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `blueprint-${Date.now()}.svg`; a.click();
                  }}><Download size={18}/></button>
               </div>
            </header>

            <div className="flex-1 relative z-10 flex items-center justify-center p-12 overflow-hidden">
               {loading ? (
                 <div className="text-center space-y-6">
                    <Loader2 className="animate-spin text-cyan-400 mx-auto" size={48}/>
                    <p className="text-[10px] font-black uppercase text-stone-500 tracking-[0.4em] animate-pulse">Calculando Projeções...</p>
                 </div>
               ) : svgContent ? (
                 <div 
                   className="w-full h-full flex items-center justify-center blueprint-svg-container drop-shadow-[0_0_30px_rgba(0,255,255,0.05)]"
                   dangerouslySetInnerHTML={{ __html: svgContent }}
                 />
               ) : (
                 <div className="text-center opacity-20">
                    <FileCode size={80} className="mx-auto mb-6" />
                    <h3 className="text-xl font-black uppercase italic">Nenhum Desenho</h3>
                 </div>
               )}
            </div>
            
            <footer className="relative z-10 border-t border-white/5 p-6 bg-black/40 backdrop-blur-md grid grid-cols-3 text-center">
               <div>
                  <p className="text-[8px] font-black text-stone-600 uppercase">Projetista</p>
                  <p className="text-[10px] font-bold text-amber-50">YARA IA Engine</p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-stone-600 uppercase">Revisão</p>
                  <p className="text-[10px] font-bold text-amber-50">Mestre Workshop</p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-stone-600 uppercase">Data</p>
                  <p className="text-[10px] font-bold text-amber-50">{new Date().toLocaleDateString()}</p>
               </div>
            </footer>
          </Card>
        </div>
      </div>

      <style>{`
        .blueprint-svg-container svg {
          width: 100%;
          height: auto;
          max-height: 500px;
        }
        .blueprint-svg-container svg text {
          font-family: 'Inter', sans-serif !important;
          font-weight: 800 !important;
        }
      `}</style>
    </div>
  );
};
