
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { createRoot } from "react-dom/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GoogleGenAI } from "@google/genai";
import {
  Wrench,
  DollarSign,
  X,
  Mic,
  TrendingUp,
  ShieldCheck,
  Plus,
  Package,
  ArrowUpRight,
  Menu,
  AlertTriangle,
  Image as LucideImage,
  Camera,
  Send,
  Loader2,
  Sparkles,
  Lock,
  Maximize,
  Truck,
  MapPin,
  WifiOff,
  Layers,
  CheckCircle2,
  ChevronRight,
  Layout,
  Scissors,
  Download,
  Share2,
  Cpu,
  RotateCcw,
  Users,
  Box,
  Zap,
  Settings,
  Award,
  CheckCheck,
  FileJson
} from "lucide-react";

import { Attachment, ProjectData, Module } from './types';
import { IARA_SYSTEM_PROMPT, LABOR_RATE_M2, MDF_SHEET_AREA } from './constants';

// ============================================================================
// [1. ESTADO GLOBAL (COCKPIT MASTER)]
// ============================================================================

interface MarcenaState {
  isReady: boolean;
  isAdminLoggedIn: boolean;
  activeModal: string | null;
  activeClientId: string | null;
  clients: any[];
  messages: any[];
  industrialRates: { mdf: number; markup: number };
  ambientes: Record<string, { pecas: any[] }>;
  activeAmbiente: string;
  selectedImage: string | null;
  loadingAI: boolean;

  setReady: (val: boolean) => void;
  setAdmin: (val: boolean) => void;
  setModal: (id: string | null) => void;
  setClient: (id: string | null) => void;
  addClient: (name: string) => void;
  addMessage: (msg: any) => void;
  updateMessage: (id: string, payload: any) => void;
  updateRates: (rates: { mdf?: number; markup?: number }) => void;
  setPreview: (url: string | null) => void;
  setLoadingAI: (val: boolean) => void;
  updateAmbientes: (ambientes: any) => void;
  setActiveAmbiente: (name: string) => void;
}

const useStore = create<MarcenaState>()(
  persist(
    (set) => ({
      isReady: false,
      isAdminLoggedIn: false,
      activeModal: null,
      activeClientId: '1',
      clients: [{ id: '1', name: 'Evaldo Master Pro' }],
      messages: [{ 
        id: 'initial', 
        from: 'iara', 
        text: 'HUB MASTER EVALDO v3.70 ONLINE. Hardware industrial pronto. Cockpit liberado.', 
        timestamp: new Date().toISOString() 
      }],
      industrialRates: { mdf: 440, markup: 2.2 },
      ambientes: { "Geral": { pecas: [] } },
      activeAmbiente: "Geral",
      selectedImage: null,
      loadingAI: false,

      setReady: (val) => set({ isReady: val }),
      setAdmin: (val) => set({ isAdminLoggedIn: val }),
      setModal: (id) => set({ activeModal: id }),
      setClient: (id) => set({ activeClientId: id }),
      addClient: (name) => set((state) => {
        const id = Date.now().toString();
        return { clients: [...state.clients, { id, name }], activeClientId: id };
      }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      updateMessage: (id, payload) => set((state) => ({
        messages: state.messages.map((m) => m.id === id ? { ...m, ...payload } : m)
      })),
      updateRates: (rates) => set((state) => ({ industrialRates: { ...state.industrialRates, ...rates } })),
      setPreview: (url) => set({ selectedImage: url }),
      setLoadingAI: (val) => set({ loadingAI: val }),
      updateAmbientes: (ambientes) => set({ ambientes }),
      setActiveAmbiente: (activeAmbiente) => set({ activeAmbiente }),
    }),
    { name: 'marcenapp-supreme-v383-persistence' }
  )
);

// ============================================================================
// [2. MOTORES YARA (ENGENHARIA)]
// ============================================================================

const PricingEngine = {
  calculate: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    const mdfCost = (totalArea * (rates.mdf / 5)) || 0;
    const labor = totalArea * LABOR_RATE_M2;
    const total = (mdfCost + labor) * 1.35; 
    return {
      status: 'done' as const,
      materials: [
        { name: 'MDF Estrutural (Chapas)', cost: mdfCost },
        { name: 'Ferragens & Acessórios', cost: total * 0.15 },
        { name: 'Acabamentos & Fitas', cost: total * 0.05 }
      ],
      total,
      labor,
      finalPrice: total * rates.markup,
      chapas: Math.ceil(totalArea / 4.3)
    };
  }
};

const YaraEngine = {
  getAi: () => new GoogleGenAI({ apiKey: process.env.API_KEY }),

  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    const ai = YaraEngine.getAi();
    const parts: any[] = [{ text: text || "Analise este rascunho tecnicamente." }];
    if (attachment?.data) parts.push({ inlineData: { mimeType: 'image/jpeg', data: attachment.data } });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: { systemInstruction: IARA_SYSTEM_PROMPT, responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "{}");
      const project = parsed.project || parsed;
      return {
        ...project,
        projectId: project.projectId || `P-${Date.now()}`,
        render: { status: 'pending' },
        pricing: { status: 'pending' },
        cutPlan: { status: 'pending' }
      } as ProjectData;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  generateRender: async (project: ProjectData, sketchData?: string): Promise<{ faithful: string, decorated: string }> => {
    const ai = YaraEngine.getAi();
    
    // Extração aprofundada de metadados para orientar a geração
    const materialsList = project.modules?.map(m => `${m.material} (${m.finish})`).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "Madeira MDF Premium";
    const modulesStructure = project.modules?.map(m => `${m.type}: ${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm`).join(", ");

    const gen = async (prompt: string, ref?: string) => {
      const parts: any[] = [];
      if (ref) {
        // A imagem de rascunho entra como o primeiro e mais importante part para ancoragem visual
        parts.push({ 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: ref.replace(/^data:image\/[a-z]+;base64,/, '') 
          } 
        });
      }
      parts.push({ text: prompt });

      try {
        const res = await ai.models.generateContent({ 
          model: 'gemini-3-pro-image-preview', 
          contents: { parts },
          config: { 
            imageConfig: { 
              aspectRatio: "1:1", 
              imageSize: "1K" 
            } 
          }
        });
        
        if (res.candidates && res.candidates[0]?.content?.parts) {
          for (const part of res.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        return '';
      } catch (err) {
        console.error("Yara Render Engine Critical Failure:", err);
        return '';
      }
    };

    // Prompt Fiel: Engenharia e precisão geométrica baseada no rascunho
    const faithfulPrompt = `ACT AS A PROFESSIONAL INDUSTRIAL 3D DESIGNER. 
    TASK: Generate a faithful 3D rendering of the provided sketch.
    GEOMETRIC FIDELITY IS PARAMOUNT: Replicate the exact proportions, placement, and volume shown in the attached image.
    Subject: ${project.title}. 
    Technical Structure: ${modulesStructure}. 
    Environment: Clean minimalist white studio, sharp shadows, technical lighting. 
    Perspective: Orthographic/straight-on viewpoint. No background clutter. 8K High precision.`;

    // Prompt Decorado: Estilo Architectural Digest, luz suave e composição premium
    const decoratedPrompt = `ARCHITECTURAL DIGEST LUXURY INTERIOR PHOTOGRAPHY. 
    Transform the geometric skeleton of the attached sketch into a finished luxury furniture masterpiece.
    Atmosphere: Modern high-end minimalist apartment. 
    Materiality: Premium finishes like ${materialsList}.
    Lighting: Soft natural daylight from a side window, warm diffused ambient light, cinematic depth of field. 
    Composition: Professional architectural framing, symmetrical and balanced layout. 
    Quality: Fotorrealista 8K, magazine-cover quality, elegant and professional interior design styling.`;

    // Execução assíncrona paralela para eficiência máxima
    const [faithful, decorated] = await Promise.all([
      gen(faithfulPrompt, sketchData),
      gen(decoratedPrompt, sketchData)
    ]);

    return { faithful, decorated };
  }
};

// ============================================================================
// [3. UI COMPONENTS (ESTÉTICA v383)]
// ============================================================================

const LogoSVG = memo(({ size = 48, animated = false }: any) => (
  <div className={`relative flex items-center justify-center ${animated ? "animate-pulse" : ""}`} style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#09090b" />
      <path d="M25 75V25H45L50 40L55 25H75V75H62V40L50 65L38 40V75H25Z" fill="white" />
      <circle cx="50" cy="15" r="4" fill="#D97706" />
    </svg>
    {animated && <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-[24px] animate-spin" style={{ margin: "-4px" }} />}
  </div>
));

const BrandHeading = () => (
  <div className="flex flex-col text-left justify-center ml-1">
    <h1 className="text-xl font-black uppercase tracking-tighter text-white leading-none">MARCENAPP</h1>
    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none mt-1">MARCENARIA DIGITAL</p>
  </div>
);

const ProgressStep = memo(({ label, status }: { label: string, status: 'active' | 'done' | false }) => (
  <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 ${status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : status === 'active' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
    {status === 'done' ? <CheckCircle2 size={14} /> : status === 'active' ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </div>
));

const Drawer = memo(({ id, title, color, icon: Icon, children }: any) => {
  const { activeModal, setModal } = useStore();
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setModal(null)} />
      <div className="relative w-full max-w-lg bg-white h-[100dvh] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        <header className={`${color} p-6 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-4">{Icon && <Icon size={24} />}<h2 className="text-lg font-black uppercase tracking-tight font-mono">{title}</h2></div>
          <button onClick={() => setModal(null)} className="p-2 bg-white/20 rounded-full active:scale-95 text-white"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar text-zinc-900 text-left">{children}</div>
      </div>
    </div>
  );
});

// ============================================================================
// [4. WORKSHOP & COCKPIT MASTER]
// ============================================================================

const Workshop = () => {
  const store = useStore();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const galInputRef = useRef<HTMLInputElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [store.messages, store.loadingAI]);

  const handleVox = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Navegador não suporta reconhecimento de voz.");
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => setInput(prev => (prev ? prev + " " : "") + e.results[0][0].transcript);
    rec.start();
  };

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!store.activeClientId) return alert("Selecione um cliente ou projeto.");
    const userMsgId = `user-${Date.now()}`;
    const iaraId = `iara-${Date.now()}`;
    
    store.addMessage({ id: userMsgId, from: "user", text: txt || "Iniciando materialização...", src: img, timestamp: new Date().toISOString() });
    store.addMessage({ 
      id: iaraId, 
      from: "iara", 
      text: "Ativando núcleo de renderização Yara v3.83...", 
      timestamp: new Date().toISOString(), 
      status: 'processing',
      progressiveSteps: { parsed: 'active', pricing: false, cutPlan: false, render: false } 
    });
    
    setInput(""); setPreview(null);
    store.setLoadingAI(true);

    try {
      const project = await YaraEngine.processInput(txt, img ? { type: 'image', url: img, data: img.split(',')[1] } : undefined);
      if (!project) throw new Error();
      
      const pricing = PricingEngine.calculate(project, store.industrialRates);
      
      store.updateMessage(iaraId, { 
        project: { ...project, pricing }, 
        progressiveSteps: { parsed: 'done', pricing: 'active', cutPlan: false, render: false } 
      });

      // Passo rápido de precificação
      setTimeout(() => store.updateMessage(iaraId, { progressiveSteps: { parsed: 'done', pricing: 'done', cutPlan: 'active', render: false } }), 600);
      
      // Chamada assíncrona para o motor de render
      const renders = await YaraEngine.generateRender(project, img || undefined);
      
      store.updateMessage(iaraId, { 
        text: "Sincronia completa. Renders fotorrealistas e orçamentos integrados estão prontos.",
        project: { ...project, pricing, render: { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated } }, 
        progressiveSteps: { parsed: 'done', pricing: 'done', cutPlan: 'done', render: 'done' },
        status: 'done'
      });
    } catch (e) {
      console.error(e);
      store.updateMessage(iaraId, { text: "Falha na sincronização dos motores de render. Verifique sua conexão.", status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  };

  const financeiroTotal = useMemo(() => {
    return store.messages.find(m => m.project)?.project?.pricing || { finalPrice: 0, chapas: 0 };
  }, [store.messages]);

  return (
    <div className="flex h-[100dvh] bg-[#09090b] font-sans overflow-hidden">
      {/* SIDEBAR TÉCNICA */}
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white text-left">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500"><X /></button></div>
          <button onClick={() => { const n = prompt("Nome do Cliente:"); if(n) store.addClient(n); }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-8 flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all hover:bg-zinc-200"><Plus size={16} /> Novo Projeto</button>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-2">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4 flex items-center gap-2"><Users size={12}/> Leads Hub</h3>
            {store.clients.map(c => (
              <button key={c.id} onClick={() => { store.setClient(c.id); setSidebar(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${store.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-lg" : "bg-zinc-900 border-white/5 text-zinc-500 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${store.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>M</div>
                <p className="font-black text-[11px] uppercase truncate tracking-tight">{c.name}</p>
              </button>
            ))}
          </div>
          <button onClick={() => store.setModal('ADMIN')} className="mt-8 p-4 flex items-center gap-3 text-zinc-600 hover:text-white transition-colors border-t border-white/5 pt-8">
            <Settings size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Painel Admin</span>
          </button>
        </div>
      </nav>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col relative h-[100dvh] bg-white lg:rounded-l-[3.5rem] shadow-2xl overflow-hidden">
        <header className="bg-[#09090b] py-3 px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-4 text-left">
            {!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500 active:scale-90"><Menu size={32} /></button>}
            <LogoSVG size={45} /><BrandHeading />
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => store.setModal('ADMIN')} className="p-2 bg-white/5 rounded-xl text-emerald-500 active:scale-90 transition-all border border-emerald-500/10"><ShieldCheck size={24} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-12 bg-[#f8fafc] custom-scrollbar pb-40 relative text-left">
          {store.messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 text-center grayscale">
              <LogoSVG size={180} animated={store.loadingAI}/><p className="mt-8 font-black uppercase tracking-[0.4em] text-xs px-10 text-center text-zinc-900 leading-relaxed">Mestre, oficina aberta e resiliente.</p>
            </div>
          )}
          {store.messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[90%] sm:max-w-[80%] flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-6 sm:p-8 rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-lg border ${m.from === "user" ? "bg-zinc-900 text-white rounded-tr-none border-zinc-900" : "bg-white text-slate-700 rounded-tl-none border-slate-100"}`}>
                  {m.src && <div className="relative group mb-6"><img src={m.src} className="rounded-2xl w-full h-auto border-4 border-white shadow-xl" alt="Scan" /><button onClick={() => store.setPreview(m.src)} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"><Maximize size={24} className="text-white"/></button></div>}
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
                      <div className="p-8 space-y-10">
                        {m.project.render?.status === 'done' ? (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="relative group cursor-pointer" onClick={() => store.setPreview(m.project.render.faithfulUrl)}>
                              <img src={m.project.render.faithfulUrl} className="aspect-square object-cover rounded-[2rem] border-4 border-white shadow-xl transition-transform group-hover:scale-105" />
                              <span className="absolute bottom-4 left-4 bg-black/80 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase">Técnico</span>
                            </div>
                            <div className="relative group cursor-pointer" onClick={() => store.setPreview(m.project.render.decoratedUrl)}>
                              <img src={m.project.render.decoratedUrl} className="aspect-square object-cover rounded-[2rem] border-4 border-white shadow-xl transition-transform group-hover:scale-105" />
                              <span className="absolute bottom-4 left-4 bg-amber-600/90 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase">AD Style</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-40 bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center animate-pulse gap-3">
                            <RotateCcw className="animate-spin text-amber-500" size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yara Renderizando...</span>
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
          ))}
          {store.loadingAI && <div className="flex items-center gap-3 bg-white w-fit p-4 rounded-3xl shadow-lg border border-slate-100 animate-pulse"><Loader2 size={16} className="animate-spin text-amber-600" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Hardware...</span></div>}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <div className="max-w-3xl mx-auto">
            {preview && (
              <div className="flex items-center gap-5 bg-slate-50 p-4 rounded-[2rem] mb-6 border border-slate-200 shadow-xl animate-in slide-in-from-bottom-5">
                <img src={preview} className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md" alt="Preview" />
                <div className="flex-1 text-left"><p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Maximize size={10}/> Iara Scan</p><p className="text-[11px] text-slate-500 font-bold uppercase truncate">Geometria detectada. Processar?</p></div>
                <button onClick={() => setPreview(null)} className="p-3 bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm"><X size={18}/></button>
              </div>
            )}
            <div className="flex gap-4 items-end">
              <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-xl transition-all border active:scale-90 ${isToolsOpen ? "bg-red-500 border-red-500 text-white" : "bg-[#09090b] border-white/5 text-amber-500"}`}><Plus size={28} className={`${isToolsOpen ? "rotate-45" : ""} transition-transform`} /></button>
              <div className="flex-1 bg-slate-100 rounded-[1.5rem] flex items-center px-4 py-1 border border-slate-200 shadow-inner group focus-within:bg-white focus-within:ring-4 ring-amber-500/10 transition-all">
                <div className="flex gap-1 text-slate-400">
                  <button onClick={() => galInputRef.current?.click()} className="p-3 hover:text-amber-500 transition-colors"><LucideImage size={24}/></button>
                  <button onClick={() => camInputRef.current?.click()} className="p-3 hover:text-amber-500 transition-colors"><Camera size={24}/></button>
                </div>
                <input placeholder={preview ? "Descreva o projeto..." : "Falar com Yara Hub..."} className="flex-1 bg-transparent px-4 py-4 text-base font-bold outline-none placeholder-slate-400 text-zinc-900" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} />
              </div>
              <button onClick={input.trim() || preview ? () => handlePipeline(input, preview) : handleVox} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-2xl transition-all active:scale-90 ${input.trim() || preview ? "bg-amber-600 text-black" : isListening ? "bg-red-500 text-white animate-pulse" : "bg-zinc-900 text-white"}`}>
                {input.trim() || preview ? <Send size={28} /> : <Mic size={28} />}
              </button>
            </div>
          </div>
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={(e: any) => { const f = e.target.files[0]; if(f){ const r = new FileReader(); r.onloadend = () => setPreview(r.result as string); r.readAsDataURL(f); } }} />
        <input type="file" ref={camInputRef} hidden accept="image/*" capture="environment" onChange={(e: any) => { const f = e.target.files[0]; if(f){ const r = new FileReader(); r.onloadend = () => setPreview(r.result as string); r.readAsDataURL(f); } }} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000] pointer-events-none text-left">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-32 left-8 w-72 bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl p-4 flex flex-col gap-2 pointer-events-auto animate-in slide-in-from-bottom-5">
              {[
                { id: 'BENTO', label: 'Engenharia Bento', icon: Wrench, color: 'bg-amber-600', desc: 'Módulos & Medidas' },
                { id: 'ESTELA', label: 'Financeiro Estela', icon: DollarSign, color: 'bg-emerald-600', desc: 'Preços & Lucro' },
                { id: 'CNC', label: 'Otimização CNC', icon: Scissors, color: 'bg-blue-600', desc: 'Plano de Corte' },
                { id: 'DISTRIBUIDOR', label: 'Onde Comprar', icon: MapPin, color: 'bg-pink-600', desc: 'MDF regional' },
                { id: 'ADMIN', label: 'Admin Master', icon: ShieldCheck, color: 'bg-slate-700', desc: 'Hardware Hub' },
              ].map(tool => (
                <button key={tool.id} onClick={() => { store.setModal(tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.8rem] transition-all text-left text-white group">
                  <div className={`p-3 rounded-2xl ${tool.color} group-hover:scale-110 transition-transform shadow-lg`}><tool.icon size={20} /></div>
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-white tracking-widest leading-none mb-1">{tool.label}</span><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight italic">{tool.desc}</span></div>
                </button>
              ))}
            </div>
          </div>
        )}

        <Drawer id="BENTO" title="Engenharia Bento" color="bg-amber-600" icon={Wrench}>
           <div className="space-y-8">
             <div className="p-6 bg-slate-100 rounded-3xl border flex justify-between items-center shadow-inner">
               <div><p className="text-[10px] font-black text-slate-400 uppercase">Estimativa MDF</p><p className="text-2xl font-black text-slate-800">{financeiroTotal.chapas || 0} Chapas</p></div>
               <Package className="text-amber-600" />
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2"><Layers size={14}/> Setores da Obra</h3>
                  <button onClick={() => { const n = prompt("Ambiente:"); if(n) store.setActiveAmbiente(n); }} className="text-[10px] font-black text-amber-600 uppercase">+ NOVO</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {Object.keys(store.ambientes).map(a => (
                    <button key={a} onClick={() => store.setActiveAmbiente(a)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all shrink-0 ${store.activeAmbiente === a ? "bg-amber-600 border-amber-600 text-white shadow-md" : "bg-white border-slate-100 text-slate-400"}`}>{a}</button>
                  ))}
                </div>
             </div>
             <div className="p-6 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black uppercase text-slate-300 mb-2">Lista de Peças Industrial</p>
                <div className="w-full space-y-2">
                  {store.ambientes[store.activeAmbiente]?.pecas.map((p, i) => (
                    <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-xs font-bold uppercase">{p.n}</span><span className="text-xs font-black">{p.w}x{p.h}mm</span></div>
                  ))}
                  <button onClick={() => { 
                    const n = prompt("Descrição:");
                    const w = prompt("Largura (mm):");
                    const h = prompt("Altura (mm):");
                    if(n && w && h) {
                      const updated = { ...store.ambientes };
                      updated[store.activeAmbiente].pecas.push({ n, w, h });
                      store.updateAmbientes(updated);
                    }
                  }} className="w-full py-4 text-[10px] font-black uppercase text-amber-600 border border-amber-600/20 rounded-xl mt-4">Adicionar Item Manual</button>
                </div>
             </div>
           </div>
        </Drawer>

        <Drawer id="ESTELA" title="Financeiro Estela" color="bg-emerald-600" icon={DollarSign}>
           <div className="space-y-6">
              <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <TrendingUp size={100} className="absolute -bottom-4 -right-4 opacity-10" />
                <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-2 block">Venda Sugerida Master</span>
                <h3 className="text-4xl font-black italic">R$ {financeiroTotal.finalPrice.toLocaleString('pt-BR')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-100 rounded-[2rem] flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Custo Estimado</span>
                  <span className="text-xl font-black text-slate-800 italic">R$ {(financeiroTotal.finalPrice / 2.2).toLocaleString('pt-BR')}</span>
                </div>
                <div className="p-6 bg-slate-100 rounded-[2rem] flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Mão de Obra Hub</span>
                  <span className="text-xl font-black text-emerald-600 italic">R$ {(financeiroTotal.finalPrice * 0.3).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <button className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"><Download size={20}/> Gerar PDF Proposta</button>
           </div>
        </Drawer>

        <Drawer id="CNC" title="Otimização CNC" color="bg-blue-600" icon={Scissors}>
           <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-100 rounded-[2.5rem] flex flex-col gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eficiência</span><h4 className="text-3xl font-black text-emerald-500 italic">82.4%</h4></div>
                <div className="p-6 bg-slate-100 rounded-[2.5rem] flex flex-col gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapas</span><h4 className="text-3xl font-black text-slate-800 italic">{financeiroTotal.chapas || 2} UN</h4></div>
              </div>
              <div className="w-full aspect-video bg-zinc-900 rounded-[2.5rem] border-4 border-white shadow-2xl relative overflow-hidden flex items-center justify-center p-6">
                 <div className="w-full h-full bg-zinc-800 rounded-2xl border border-white/5 flex flex-wrap gap-2 p-4">
                    {Array(8).fill(0).map((_, i) => <div key={i} className="w-12 h-20 bg-zinc-700/50 rounded-lg border border-white/5 opacity-50" />)}
                 </div>
              </div>
              <button className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><FileJson size={20}/> Gerar G-CODE Industrial</button>
           </div>
        </Drawer>

        <Drawer id="DISTRIBUIDOR" title="Onde Comprar" color="bg-pink-600" icon={MapPin}>
           <div className="space-y-4">
             {[
               { nome: "Leo Madeiras", km: "2.4", status: "Estoque Alto" },
               { nome: "Madeireira Central", km: "5.1", status: "Preço Master" },
               { nome: "GMAD Master", km: "7.8", status: "Parceiro Evaldo" },
             ].map((d, i) => (
               <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex justify-between items-center group hover:border-pink-500 transition-all cursor-pointer">
                 <div className="flex flex-col"><span className="text-[10px] font-black text-pink-600 uppercase mb-1">{d.km} km de distância</span><h4 className="text-sm font-black uppercase text-slate-800">{d.nome}</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{d.status}</p></div>
                 <ChevronRight size={20} className="text-slate-200 group-hover:text-pink-500 transition-colors" />
               </div>
             ))}
           </div>
        </Drawer>

        <Drawer id="ADMIN" title="Admin Hub Master" color="bg-slate-900" icon={ShieldCheck}>
           <div className="space-y-8">
             <div className="p-8 bg-slate-100 rounded-[2.5rem] space-y-6">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hardware Industrial v3.83</h3>
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MDF Chapa (Preço Base)</span>
                      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200"><span className="text-slate-400 font-black">R$</span><input type="number" className="bg-transparent font-black text-zinc-900 text-lg outline-none w-full" value={store.industrialRates.mdf} onChange={e => store.updateRates({ mdf: Number(e.target.value) })} /></div>
                   </div>
                   <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Markup Master Hub</span>
                      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200"><input type="number" step="0.1" className="bg-transparent font-black text-amber-600 text-lg outline-none w-full" value={store.industrialRates.markup} onChange={e => store.updateRates({ markup: Number(e.target.value) })} /></div>
                   </div>
                </div>
             </div>
             <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center gap-5">
                <Zap className="text-emerald-500" size={32} />
                <div className="flex flex-col"><span className="text-[10px] font-black text-emerald-600 uppercase">Engine Operacional</span><span className="text-[9px] font-bold text-slate-500 uppercase italic">Gemini 3 Pro + Yara Pipeline Sync</span></div>
             </div>
           </div>
        </Drawer>
      </div>

      {/* FULL IMAGE PREVIEW */}
      {store.selectedImage && (
        <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in" onClick={() => store.setPreview(null)}>
          <img src={store.selectedImage} className="max-w-full max-h-[85vh] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 select-none cursor-zoom-out" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-10 right-10 p-6 bg-white/5 text-white rounded-full border border-white/10 backdrop-blur-2xl hover:bg-white/10 transition-all active:scale-90" onClick={() => store.setPreview(null)}><X size={40}/></button>
          <div className="mt-8 flex gap-4"><button className="px-8 py-4 bg-white/5 text-white rounded-full font-black uppercase text-[10px] tracking-widest border border-white/10 flex items-center gap-3"><Download size={18}/> Baixar Render 8K</button><button className="px-8 py-4 bg-amber-600 text-black rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3"><Share2 size={18}/> Compartilhar</button></div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0; display: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { overscroll-behavior-y: contain; position: fixed; width: 100%; height: 100%; overflow: hidden; background: #09090b; }
        #root { height: 100%; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

// ============================================================================
// [5. BOOTSTRAP MASTER HUB]
// ============================================================================

function App() {
  const { isReady, setReady } = useStore();

  useEffect(() => {
    // Sincronia Master em 1.5s
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, [setReady]);

  if (!isReady) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-12 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#D9770615_0%,_transparent_75%)]" />
      <LogoSVG size={140} />
      <div className="mt-20 text-center space-y-10 relative">
        <h2 className="text-[13px] font-black uppercase tracking-[1em] animate-pulse text-amber-500 italic">SINCRO HUB SUPREME...</h2>
        <div className="flex gap-4 justify-center">
           {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
        </div>
        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.6em] pt-12 leading-relaxed">Hardware Industrial Engine v3.83 Operacional</p>
      </div>
    </div>
  );
  
  return <Workshop />;
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
