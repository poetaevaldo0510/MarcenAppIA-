import React, { useState } from 'react';
import { 
  Instagram, Share2, Sparkles, Layout, MessageSquare, 
  Hash, Copy, Check, Image as ImageIcon, Smartphone,
  Zap, TrendingUp, Heart, Users
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { GoogleGenAI } from '@google/genai';

export const MarketingHub: React.FC = () => {
  const { projects, activeProjectId, activeEnvironmentId } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeEnv = activeProject?.environments.find(e => e.id === activeEnvironmentId);
  const dna = activeEnv?.dna || { width: 0, height: 0, depth: 0, drawers: 0, doors: 0, externalMaterial: 'mdf18_wood' } as any;
  const history = activeEnv?.renders || [];
  
  const [loading, setLoading] = useState(false);
  const [activePost, setActivePost] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const latestRender = history.length > 0 ? history[history.length - 1]?.url : null;

  const generateCopy = async () => {
    if (!dna) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Atue como um Social Media de luxo especializado em marcenaria. 
      Crie uma legenda para Instagram para este projeto: ${dna.width}x${dna.height}m, material ${dna.externalMaterial}.
      O tom deve ser elegante, focado em exclusividade e durabilidade. 
      Inclua 10 hashtags estratégicas e uma Call to Action (CTA) forte.
      Formate como JSON: {"caption": "...", "hashtags": "..."}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      setActivePost(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: any) => {
    const val = typeof text === 'string' ? text : JSON.stringify(text);
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">Expansão</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Marketing digital e portfólio de alta conversão.</p>
        </div>
        <div className="flex gap-4 bg-[#1c1917] p-2 rounded-2xl border border-white/5">
           <div className="flex items-center gap-3 px-6 py-2">
              <Instagram className="text-pink-500" size={18}/>
              <span className="text-[10px] font-black text-amber-50 uppercase tracking-widest">Connect: @workshop_os</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <Card className="p-0 border-white/5 overflow-hidden bg-black aspect-video relative group">
            {latestRender ? (
              <img src={latestRender} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-700 p-12 text-center">
                <ImageIcon size={64} className="mb-6 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest italic leading-relaxed">Gere um render no Studio para começar sua campanha digital.</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
              <div>
                <Badge variant="info">Ambiente Ativo</Badge>
                <h3 className="text-2xl font-black text-white italic uppercase mt-3 tracking-tighter">{activeEnv?.name || 'Obra Premium'}</h3>
              </div>
              <Button variant="magic" icon={Sparkles} onClick={generateCopy} disabled={loading || !latestRender}>
                {loading ? 'Redigindo...' : 'Gerar Post IA'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-6">
             <Card className="p-8 border-indigo-500/10 bg-indigo-500/5">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
                   <TrendingUp size={24}/>
                </div>
                <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-4">Alcance Digital</h4>
                <p className="text-2xl font-black text-indigo-400 tracking-tighter italic">12.4k <span className="text-[10px] text-stone-500">Impressões</span></p>
             </Card>
             <Card className="p-8 border-pink-500/10 bg-pink-500/5">
                <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6">
                   <Heart size={24}/>
                </div>
                <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-4">Engajamento</h4>
                <p className="text-2xl font-black text-pink-400 tracking-tighter italic">8.2% <span className="text-[10px] text-stone-500">Taxa Média</span></p>
             </Card>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
           {activePost ? (
             <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <Card className="p-8 border-amber-500/20">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black italic uppercase text-amber-50 flex items-center gap-3">
                        <MessageSquare className="text-amber-500" /> Legenda Persuasiva
                      </h3>
                      <button onClick={() => copyToClipboard(activePost.caption)} className="p-2 hover:bg-white/5 rounded-lg text-stone-500 hover:text-amber-500">
                        {copied ? <Check size={18}/> : <Copy size={18}/>}
                      </button>
                   </div>
                   <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-sm text-stone-300 leading-relaxed italic">
                      {typeof activePost.caption === 'string' ? activePost.caption : JSON.stringify(activePost.caption)}
                   </div>
                </Card>

                <Card className="p-8">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black italic uppercase text-amber-50 flex items-center gap-3">
                        <Hash className="text-amber-500" /> Hashtags do Nicho
                      </h3>
                      <button onClick={() => copyToClipboard(activePost.hashtags)} className="p-2 hover:bg-white/5 rounded-lg text-stone-500 hover:text-amber-500">
                        <Copy size={18}/>
                      </button>
                   </div>
                   <div className="text-[10px] font-bold text-amber-500 tracking-[0.2em] leading-loose uppercase">
                      {typeof activePost.hashtags === 'string' ? activePost.hashtags : JSON.stringify(activePost.hashtags)}
                   </div>
                </Card>

                <Button variant="primary" className="w-full h-16 rounded-2xl" icon={Instagram}>Publicar no Instagram</Button>
             </div>
           ) : (
             <Card className="p-12 text-center h-full flex flex-col items-center justify-center bg-[#1c1917] border-dashed border-2 border-stone-800">
                <Zap className="text-stone-800 mb-6" size={64}/>
                <h3 className="text-xl font-black italic uppercase text-stone-600 tracking-tighter">Marketing IARA Ativo</h3>
                <p className="text-[10px] text-stone-700 font-black uppercase tracking-[0.3em] mt-4 leading-relaxed max-w-xs">
                  Selecione um render no Studio e clique em "Gerar Post IA" para criar seu conteúdo de vendas.
                </p>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
};