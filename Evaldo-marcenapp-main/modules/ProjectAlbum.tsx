import React from 'react';
import { Image as ImageIcon, Camera, Download, Share2, Ruler, Box, Layers, Zap, Info, Bot } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';
import { Logo } from '../components/Logo';

export const ProjectAlbum: React.FC = () => {
  const { projects, activeProjectId, activeEnvironmentId } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeEnv = activeProject?.environments.find(e => e.id === activeEnvironmentId);
  const dna = activeEnv?.dna;
  const history = activeEnv?.renders || [];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="flex items-center gap-6">
           <Logo size={60} />
           <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">Álbum.<span className="text-indigo-500">Mestre</span></h1>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Acervo Digital e Macerado Técnico PP.</p>
           </div>
        </div>
        <div className="flex gap-4">
           <Badge variant="info">Projeto: {activeProject?.projectName}</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Lado Esquerdo: Macerado PP (Resumo Técnico) */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 border-white/5 bg-[#141210] relative overflow-hidden ring-1 ring-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-5"><Zap size={80}/></div>
              <h3 className="text-xl font-black italic uppercase text-amber-50 mb-10 flex items-center gap-3">
                 <Bot size={22} className="text-indigo-400" /> Macerado PP
              </h3>
              
              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-stone-500 uppercase mb-1">Largura Total</p>
                       <p className="text-xl font-black text-white italic">{dna?.width}m</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-stone-500 uppercase mb-1">Altura Total</p>
                       <p className="text-xl font-black text-white italic">{dna?.height}m</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">Especificação Industrial</p>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-stone-500 font-bold uppercase">Portas</span>
                       <span className="text-white font-black">{dna?.doors} un</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-stone-500 font-bold uppercase">Gavetas</span>
                       <span className="text-white font-black">{dna?.drawers} un</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-stone-500 font-bold uppercase">Cor MDF</span>
                       <span className="text-amber-500 font-black italic">{dna?.externalMaterial.split('_')[1].toUpperCase()}</span>
                    </div>
                 </div>

                 <div className="pt-6">
                    <Button variant="magic" className="w-full h-14 rounded-xl text-[9px]" icon={Download}>Baixar Ficha Técnica</Button>
                 </div>
              </div>
           </Card>

           <Card className="p-8 border-indigo-500/10 bg-indigo-500/5">
              <div className="flex gap-4">
                 <Info className="text-indigo-400 shrink-0" size={20} />
                 <p className="text-[10px] text-stone-500 font-bold leading-relaxed uppercase tracking-widest">
                    O Macerado PP é o resumo destilado do DNA do projeto, otimizado para leitura rápida na bancada da oficina.
                 </p>
              </div>
           </Card>
        </div>

        {/* Lado Direito: Galeria de Fotos */}
        <div className="lg:col-span-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {history.length === 0 ? (
                <div className="col-span-2 py-40 text-center opacity-20 border-2 border-dashed border-stone-800 rounded-[3rem]">
                   <ImageIcon size={64} className="mx-auto mb-6" />
                   <p className="text-sm font-black uppercase tracking-[0.4em]">Álbum Vazio</p>
                   <p className="text-[10px] mt-2 font-bold uppercase">Gere imagens no Studio para popular o acervo.</p>
                </div>
              ) : history.map((render, i) => (
                <Card key={i} noPadding className="group hover:border-indigo-500/30 transition-all overflow-hidden bg-black shadow-2xl">
                   <div className="aspect-square relative overflow-hidden">
                      <img src={render.url} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                      
                      <div className="absolute top-6 right-6 flex flex-col gap-2">
                         <button className="p-3 bg-black/60 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-indigo-600 transition-all shadow-2xl">
                            <Download size={18} />
                         </button>
                         <button className="p-3 bg-black/60 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-emerald-600 transition-all shadow-2xl">
                            <Share2 size={18} />
                         </button>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6">
                         <div className="flex items-center gap-3 mb-2">
                            <Badge variant="success">YARA RENDER</Badge>
                            <span className="text-[8px] font-black text-white/40 uppercase">{new Date(render.timestamp).toLocaleDateString()}</span>
                         </div>
                         <h4 className="text-sm font-black text-white uppercase truncate">{activeEnv?.name} • Versão {history.length - i}</h4>
                      </div>
                   </div>
                </Card>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};