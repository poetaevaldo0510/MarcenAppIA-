import React, { useState, useEffect } from 'react';
import { 
  Play, Film, Sparkles, Download, Share2, 
  Settings2, Loader2, Lock, ExternalLink, 
  Clapperboard, Camera, Eye, ChevronRight, AlertCircle, RefreshCw, Zap, Video
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { GoogleGenAI } from '@google/genai';

export const VideoShowroom: React.FC = () => {
  const { projects, activeProjectId, activeEnvironmentId } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeEnv = activeProject?.environments.find(e => e.id === activeEnvironmentId);
  const dna = activeEnv?.dna;
  const history = activeEnv?.renders || [];
  
  const [hasKey, setHasKey] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  const latestRender = history.length > 0 ? history[history.length - 1]?.url : null;

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const active = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(active);
    } catch (e) {
      setHasKey(false);
    }
  };

  const handleKeySelection = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasKey(true);
  };

  const generateVideo = async () => {
    if (!latestRender || !dna) return;
    setGenerating(true);
    
    const messages = [
      'Configurando iluminação volumétrica...',
      'Simulando reflexos no MDF ' + dna.externalMaterial.split('_')[1] + '...',
      'Ajustando câmera cinematográfica de trilho...',
      'IARA está polindo os veios da madeira...',
      'Renderizando partículas de luz natural...',
      'Consolidando materialização em 4K UHD...'
    ];

    let msgIdx = 0;
    const interval = setInterval(() => {
      setLoadingMsg(messages[msgIdx % messages.length]);
      msgIdx++;
    }, 5000);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = latestRender.split(',')[1];

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A smooth, cinematic drone shot zooming into a high-end custom wood furniture. Material: high resolution ${dna.externalMaterial} with visible wood texture. Architectural lighting, studio background, professional interior design photography, ultra realistic 4k.`,
        image: {
          imageBytes: base64Data,
          mimeType: 'image/png'
        },
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        alert("Sua chave de API expirou ou o projeto GCP não tem faturamento. Verifique sua conta Google Cloud.");
      } else {
        alert('O motor Veo está com alta demanda. Tente novamente em alguns instantes.');
      }
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <Badge variant="info">Cine Showroom v5.0</Badge>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Rec 4K Live</span>
             </div>
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">Cinema</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Materialização de projetos em vídeo fotorrealista de alto padrão.</p>
        </div>
        {!hasKey && (
          <Button variant="magic" icon={Lock} onClick={handleKeySelection} className="h-16 px-10 rounded-3xl">Vincular Motor Industrial</Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card className="p-0 border-white/5 overflow-hidden bg-black aspect-video relative group flex items-center justify-center shadow-[0_50px_100px_rgba(0,0,0,0.9)] ring-1 ring-white/5">
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover animate-in zoom-in duration-1000" />
            ) : generating ? (
              <div className="text-center p-20 space-y-12 max-w-lg">
                <div className="relative">
                  <div className="w-32 h-32 border-t-4 border-amber-500 rounded-full animate-spin mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-50" size={40}/>
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-amber-50 italic uppercase tracking-tighter leading-none">{loadingMsg}</h3>
                  <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.4em] animate-pulse">Aguardando Processamento Google Veo 3.1</p>
                </div>
              </div>
            ) : latestRender ? (
              <div className="relative w-full h-full overflow-hidden">
                <img src={latestRender} className="w-full h-full object-cover opacity-30 scale-110 blur-xl" />
                <img src={latestRender} className="absolute inset-0 w-full h-full object-contain opacity-60 transition-transform duration-[10s] hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 pointer-events-none">
                   <div className="bg-black/60 backdrop-blur-2xl p-10 rounded-full border border-white/10 shadow-2xl pointer-events-auto hover:scale-110 active:scale-95 transition-all group">
                      <button 
                        onClick={generateVideo}
                        disabled={!hasKey}
                        className="w-24 h-24 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)] disabled:bg-stone-800 disabled:text-stone-500"
                      >
                         <Play size={48} fill="currentColor" className="ml-2" />
                      </button>
                   </div>
                   <div className="text-center space-y-3">
                      <p className="text-[13px] font-black text-amber-50 uppercase tracking-[0.6em] drop-shadow-2xl">Materializar Experiência de Luxo</p>
                      {!hasKey ? (
                        <Badge variant="warning">Requer Chave de API Google Cloud Faturada</Badge>
                      ) : (
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Motor Veo 3.1 Pro Online</p>
                      )}
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-20 opacity-20">
                <Video size={100} className="mx-auto mb-10 text-stone-800" />
                <h3 className="text-2xl font-black uppercase italic text-stone-600 tracking-tighter">Cine Engine Standby</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] mt-4">Gere um render no IARA STUDIO para começar.</p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <Card className="p-8 bg-white/5 border-white/5 hover:bg-white/10 transition-all group">
                <Camera className="text-amber-500 mb-6 group-hover:scale-110 transition-transform" size={28}/>
                <h4 className="text-[11px] font-black text-amber-50 uppercase tracking-widest">Movimento Cinematic</h4>
                <p className="text-[9px] text-stone-500 font-bold uppercase mt-3 leading-relaxed">Transições suaves que revelam o design milímetro a milímetro.</p>
             </Card>
             <Card className="p-8 bg-white/5 border-white/5 hover:bg-white/10 transition-all group">
                <Clapperboard className="text-amber-500 mb-6 group-hover:scale-110 transition-transform" size={28}/>
                <h4 className="text-[11px] font-black text-amber-50 uppercase tracking-widest">Pós-Produção IA</h4>
                <p className="text-[9px] text-stone-500 font-bold uppercase mt-3 leading-relaxed">Correção de cor e balanço de brancos automático para showroom.</p>
             </Card>
             <Card className="p-8 bg-white/5 border-white/5 hover:bg-white/10 transition-all group">
                <Eye className="text-amber-500 mb-6 group-hover:scale-110 transition-transform" size={28}/>
                <h4 className="text-[11px] font-black text-amber-50 uppercase tracking-widest">Textura 8K</h4>
                <p className="text-[9px] text-stone-500 font-bold uppercase mt-3 leading-relaxed">Nitidez extrema nos veios do MDF e acabamentos de ferragens.</p>
             </Card>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 border-indigo-500/20 bg-indigo-600/5 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Settings2 size={64}/></div>
              <h3 className="text-xl font-black italic uppercase text-amber-50 mb-10 tracking-tighter">Status do Motor</h3>
              <div className="space-y-8">
                 <div className={`p-6 rounded-[2.5rem] border ${hasKey ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    <div className="flex items-center gap-4">
                       <div className={`w-3 h-3 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-red-500'}`}></div>
                       <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                         {hasKey ? 'VEÓ 3.1 ATIVO' : 'CHAVE PENDENTE'}
                       </span>
                    </div>
                 </div>
                 
                 <p className="text-[10px] text-stone-500 font-bold leading-relaxed uppercase tracking-widest border-l-2 border-stone-800 pl-6">
                   A geração de vídeo de alta fidelidade consome recursos de computação pesada da Google Cloud AI.
                 </p>
                 
                 <div className="space-y-4">
                    <Button variant="primary" className="w-full h-16 rounded-2xl" onClick={handleKeySelection} icon={RefreshCw}>
                       {hasKey ? 'Trocar Chave Corporativa' : 'Ativar Agora'}
                    </Button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="flex items-center justify-center gap-3 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">
                      Tutorial de Faturamento <ExternalLink size={14}/>
                    </a>
                 </div>
              </div>
           </Card>

           <Card className="p-10 bg-gradient-to-br from-[#1c1917] to-black border-white/5 shadow-2xl">
              <h3 className="text-xl font-black italic uppercase text-amber-50 mb-8 flex items-center gap-3"><Zap className="text-amber-500" size={20}/> Entrega de Valor</h3>
              <div className="space-y-6">
                 <Button variant="magic" className="w-full h-20 rounded-[2rem] text-sm" icon={Download} disabled={!videoUrl}>Baixar p/ Instagram</Button>
                 <Button variant="secondary" className="w-full h-16 rounded-2xl" icon={Share2} disabled={!videoUrl}>Enviar ao Cliente</Button>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                    <AlertCircle size={20} className="text-amber-500/50 shrink-0"/>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 leading-relaxed">O link de vídeo é temporário e será deletado do cache industrial em 24 horas.</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};