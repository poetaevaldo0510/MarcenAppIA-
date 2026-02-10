
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GoogleGenAI } from "@google/genai";
import {
  Wrench, DollarSign, X, Mic, TrendingUp, ShieldCheck, CheckCircle2,
  Plus, ArrowUpRight, Menu, Award, Truck, MapPin, Image as LucideImage,
  Camera, Send, Maximize, CheckCheck, Scissors, Download, Share2, Cpu,
  RotateCcw, FileJson, ChevronDown, ChevronUp, AlertCircle, Key, Lock,
  Unlock, Loader2, Sparkles, Settings, Info, Box, Layers, BarChart3, Users,
  HardHat, Hammer, Ruler
} from "lucide-react";

import { Attachment, ProjectData } from './types';
import { IARA_SYSTEM_PROMPT, LABOR_RATE_M2, MDF_SHEET_AREA } from './constants';

// ============================================================================
// [1. GERENCIAMENTO DE ESTADO GLOBAL (ZUSTAND)]
// ============================================================================

interface MarcenaState {
  isReady: boolean;
  isAdminLoggedIn: boolean;
  activeModal: string | null;
  activeClientId: string;
  clients: any[];
  messages: any[];
  industrialRates: { mdf: number; markup: number };
  selectedImage: string | null;
  
  setReady: (val: boolean) => void;
  setAdmin: (val: boolean) => void;
  setModal: (id: string | null) => void;
  setClient: (id: string) => void;
  addClient: (client: any) => void;
  addMessage: (msg: any) => void;
  updateMessage: (id: string, payload: any) => void;
  progressUpdate: (id: string, project?: any, stepUpdate?: any, status?: string) => void;
  setPreview: (url: string | null) => void;
  updateRates: (rates: { mdf?: number; markup?: number }) => void;
}

const useStore = create<MarcenaState>()(
  persist(
    (set) => ({
      isReady: false,
      isAdminLoggedIn: false,
      activeModal: null,
      activeClientId: '1',
      clients: [{ id: '1', name: 'Lead Master Pro' }],
      messages: [{ 
        id: 'initial', 
        from: 'iara', 
        text: 'YARA v370 ONLINE. Mestre, pronto para materializar seus projetos em fotorrealismo industrial. Envie um rascunho ou descreva o plano.', 
        timestamp: new Date().toISOString() 
      }],
      industrialRates: { mdf: 440, markup: 2.2 },
      selectedImage: null,

      setReady: (val) => set({ isReady: val }),
      setAdmin: (val) => set({ isAdminLoggedIn: val }),
      setModal: (id) => set({ activeModal: id }),
      setClient: (id) => set({ activeClientId: id }),
      addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      updateMessage: (id, payload) => set((state) => ({
        messages: state.messages.map((m) => m.id === id ? { ...m, ...payload } : m)
      })),
      progressUpdate: (id, project, stepUpdate, status) => set((state) => ({
        messages: state.messages.map((m) => m.id === id ? {
          ...m,
          project: project !== undefined ? { ...(m.project || {}), ...project } : m.project,
          progressiveSteps: stepUpdate !== undefined ? { ...(m.progressiveSteps || {}), ...stepUpdate } : m.progressiveSteps,
          status: status || m.status
        } : m)
      })),
      setPreview: (url) => set({ selectedImage: url }),
      updateRates: (rates) => set((state) => ({ industrialRates: { ...state.industrialRates, ...rates } })),
    }),
    {
      name: 'marcenapp-storage-v2',
      partialize: (state) => ({ 
        clients: state.clients, 
        messages: state.messages, 
        industrialRates: state.industrialRates,
        activeClientId: state.activeClientId 
      }),
    }
  )
);

// ============================================================================
// [2. MOTORES DE ENGENHARIA E RENDER]
// ============================================================================

const PricingEngine = {
  calculate: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    const mdfCost = (totalArea * (rates.mdf / 5)) || 0;
    const labor = totalArea * LABOR_RATE_M2;
    const total = (mdfCost + labor) * 1.35; 
    return {
      status: 'done' as const,
      materials: [{ name: 'MDF Estrutural', cost: mdfCost }, { name: 'Ferragens e Insumos', cost: total * 0.15 }],
      total,
      labor,
      finalPrice: total * rates.markup,
    };
  }
};

const CNCOptimizer = {
  optimize: (project: ProjectData) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    const boardsNeeded = Math.ceil(totalArea / (MDF_SHEET_AREA * 0.85)) || 1;
    return {
      status: 'done' as const,
      boards: Array(boardsNeeded).fill(0).map((_, i) => ({ 
        id: i + 1,
        efficiency: 0.85 + (Math.random() * 0.1),
        parts: project.modules.length 
      })),
      optimizationScore: 85 + (Math.random() * 10)
    };
  }
};

const YaraEngine = {
  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const promptText = text || (attachment ? "Analise este rascunho técnico e extraia o DNA industrial." : "Descreva um projeto de marcenaria.");
    const parts: any[] = [{ text: promptText }];
    if (attachment?.data) parts.push({ inlineData: { mimeType: 'image/jpeg', data: attachment.data } });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts }],
        config: { systemInstruction: IARA_SYSTEM_PROMPT, responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "{}");
      const project = parsed.project || parsed;
      return {
        projectId: `YARA-${Date.now()}`,
        title: project.title || "Projeto MarcenApp",
        description: project.description || "",
        environment: project.environment || { width: 0, height: 0, depth: 0 },
        modules: (project.modules || []).map((m: any, idx: number) => ({ ...m, id: m.id || `m${idx + 1}` })),
        complexity: project.complexity || 1,
        render: { status: 'pending' },
        pricing: { status: 'pending' },
        cutPlan: { status: 'pending' }
      } as any;
    } catch (e) { return null; }
  },

  generateRender: async (project: ProjectData, sketchData?: string): Promise<{ faithful: string, decorated: string }> => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) await (window as any).aistudio.openSelectKey();
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const gen = async (prompt: string, ref?: string) => {
      const parts: any[] = [];
      if (ref) parts.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
      parts.push({ text: prompt });
      try {
        const res = await ai.models.generateContent({ 
          model: 'gemini-3-pro-image-preview', 
          contents: [{ role: 'user', parts }],
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
        });
        const candidate = res.candidates?.[0];
        if (candidate) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        return '';
      } catch (e) { return ''; }
    };

    const modulesSummary = project.modules?.map(m => `${m.type} (${m.dimensions.w}x${m.dimensions.h}mm)`).join(', ') || "";
    const faithfulPrompt = `ULTRA-REALISTIC 3D FURNITURE RENDER. FIDELITY TO SKETCH blueprint geometry. Project: ${project.title}. Modules: ${modulesSummary}. Material: Premium MDF. Environment: Neutral studio. 8K sharp details.`;
    const decoratedPrompt = `HIGH-END ARCHITECTURAL DIGEST STYLE. Customize furniture: ${project.title}. Setting: Luxurious contemporary living space. Natural Golden Hour lighting. Refined staging. 8K Photorealistic.`;

    const [faithful, decorated] = await Promise.all([
      gen(faithfulPrompt, sketchData),
      gen(decoratedPrompt, sketchData)
    ]);
    return { faithful, decorated };
  }
};

// ============================================================================
// [3. COMPONENTES UI (OPTIMIZED)]
// ============================================================================

const ProgressStep = memo(({ label, active, icon: Icon }: any) => (
  <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-500 ${active ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-sm' : 'bg-zinc-800/30 border-white/5 text-zinc-700'}`}>
    {active ? (
      <CheckCircle2 size={10} className="text-emerald-500 animate-in zoom-in" />
    ) : (
      <div className="w-2.5 h-2.5 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
    )}
    <Icon size={10} />
    <span className="text-[8px] font-black uppercase tracking-widest truncate">{label}</span>
  </div>
));

const LogoSVG = memo(({ size = 48, animated = false }: any) => (
  <div className={`relative flex items-center justify-center ${animated ? "animate-pulse" : ""}`} style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#09090b" />
      <path d="M25 75V25H45L50 40L55 25H75V75H62V40L50 65L38 40V75H25Z" fill="white" />
      <circle cx="50" cy="15" r="4" fill="#D97706" />
    </svg>
    {animated && (
      <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-[24px] animate-spin" style={{ margin: "-4px" }} />
    )}
  </div>
));

const Drawer = memo(({ id, title, icon: Icon, children }: any) => {
  const { activeModal, setModal } = useStore();
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setModal(null)} />
      <div className="relative w-full sm:max-w-xl bg-[#09090b] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-white/5">
        <header className={`p-4 sm:p-6 border-b border-white/5 flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3 text-white">
            {Icon && <Icon size={18} className="text-amber-500" />}
            <h2 className="text-xs font-black uppercase tracking-widest">{title}</h2>
          </div>
          <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-all"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar text-zinc-300">{children}</div>
      </div>
    </div>
  );
});

// ============================================================================
// [CONTEÚDOS DOS MODAIS EXPANDIDOS]
// ============================================================================

const AdminPanel = () => {
  const { isAdminLoggedIn, setAdmin, industrialRates, updateRates } = useStore();
  const [loginForm, setLoginForm] = useState({ user: "", pass: "" });

  if (!isAdminLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center pt-10 sm:pt-20 space-y-8 animate-in fade-in">
        <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-amber-500 shadow-2xl relative border border-white/5">
          <Lock size={30} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-black uppercase tracking-widest text-white italic">Hardware Master</h3>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Acesso Restrito ao Painel Master</p>
        </div>
        <div className="w-full max-w-sm space-y-4 px-4">
          <input placeholder="Usuário (E-mail)" className="w-full p-4 bg-zinc-900 border border-white/5 rounded-2xl font-bold text-center outline-none text-white focus:border-amber-500 text-sm" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
          <input type="password" placeholder="••••••" className="w-full p-4 bg-zinc-900 border border-white/5 rounded-2xl font-bold text-center outline-none text-white focus:border-amber-500 text-sm" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
          <button onClick={() => (loginForm.user === "Evaldo@marcenapp.com.br" && loginForm.pass === "123456") ? setAdmin(true) : alert("Acesso Negado")} className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Autenticar Sistema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left pb-10">
      <div className="space-y-4">
        <h4 className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Configuração Industrial</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-zinc-900 rounded-3xl border border-white/5 flex flex-col gap-1">
            <span className="text-[8px] font-black text-zinc-500 uppercase">MDF Chapa (R$)</span>
            <input type="number" className="bg-transparent text-xl font-black text-white outline-none italic" value={industrialRates.mdf} onChange={e => updateRates({ mdf: Number(e.target.value) })} />
          </div>
          <div className="p-5 bg-zinc-900 rounded-3xl border border-white/5 flex flex-col gap-1">
            <span className="text-[8px] font-black text-zinc-500 uppercase">Markup Global</span>
            <input type="number" step="0.1" className="bg-transparent text-xl font-black text-amber-500 outline-none italic" value={industrialRates.markup} onChange={e => updateRates({ markup: Number(e.target.value) })} />
          </div>
        </div>
      </div>
      <div className="p-6 bg-zinc-900 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg"><Key size={20} /></div>
            <h4 className="text-sm font-black uppercase tracking-tight text-white italic">Hardware Key</h4>
          </div>
          <button onClick={async () => (window as any).aistudio?.openSelectKey()} className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl">Gerenciar Chaves de API</button>
        </div>
      </div>
      <div className="pt-6 border-t border-white/5 flex flex-col items-center"><button onClick={() => setAdmin(false)} className="px-8 py-3 bg-zinc-900 text-zinc-600 font-black text-[9px] uppercase tracking-widest rounded-full border border-white/5 flex items-center gap-2"><Unlock size={14} /> Logout</button></div>
    </div>
  );
};

const FinancePanel = () => {
  const { messages } = useStore();
  const lastProject = [...messages].reverse().find(m => m.project)?.project;
  if (!lastProject) return <div className="p-10 text-center uppercase font-black text-zinc-600 text-[10px] tracking-widest">Nenhum projeto ativo.</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="p-6 sm:p-8 bg-zinc-900 rounded-[2.5rem] border border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div className="flex flex-col"><span className="text-[9px] font-black uppercase text-zinc-500">Total Venda</span><h3 className="text-3xl font-black text-white italic">R$ {lastProject.pricing.finalPrice.toLocaleString('pt-BR')}</h3></div>
          <div className="flex flex-col sm:text-right"><span className="text-[9px] font-black uppercase text-zinc-500">Módulos</span><span className="text-xl font-black text-amber-500 italic">{lastProject.modules.length} UN</span></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5"><span className="text-[10px] font-bold uppercase">Custo Industrial</span><span className="text-[10px] font-black">R$ {lastProject.pricing.total.toLocaleString('pt-BR')}</span></div>
          <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5"><span className="text-[10px] font-bold uppercase">Mão de Obra</span><span className="text-[10px] font-black">R$ {lastProject.pricing.labor.toLocaleString('pt-BR')}</span></div>
          <div className="flex justify-between p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500"><span className="text-[10px] font-bold uppercase">Taxas Est.</span><span className="text-[10px] font-black">R$ {(lastProject.pricing.finalPrice * 0.1).toLocaleString('pt-BR')}</span></div>
        </div>
      </div>
      <button className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Download size={16}/> Baixar Proposta PDF</button>
    </div>
  );
};

const MaterialsPanel = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {['Branco TX', 'Carvalho Malva', 'Grafite Chess', 'Freijó Puro', 'Preto Silk', 'Nude Matt'].map(mat => (
      <div key={mat} className="group relative aspect-square bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-amber-500 transition-all">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
        <div className="absolute bottom-3 left-3 flex flex-col"><span className="text-[7px] font-black text-zinc-500 uppercase">MDF 18MM</span><span className="text-[9px] font-black text-white uppercase">{mat}</span></div>
        <div className="absolute top-3 right-3 w-6 h-6 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><CheckCircle2 size={12}/></div>
      </div>
    ))}
  </div>
);

const CutPlanPanel = () => {
  const { messages } = useStore();
  const lastProject = [...messages].reverse().find(m => m.project)?.project;
  if (!lastProject || !lastProject.cutPlan) return <div className="p-10 text-center uppercase font-black text-zinc-600 text-[10px] tracking-widest">Aguardando geração de plano.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col gap-1"><span className="text-[8px] font-black text-zinc-500 uppercase">Eficiência</span><h4 className="text-lg font-black text-emerald-500 italic">{lastProject.cutPlan.optimizationScore.toFixed(1)}%</h4></div>
        <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col gap-1"><span className="text-[8px] font-black text-zinc-500 uppercase">Chapas</span><h4 className="text-lg font-black text-white italic">{lastProject.cutPlan.boards.length} UN</h4></div>
      </div>
      <div className="space-y-3">
        {lastProject.cutPlan.boards.map((b: any) => (
          <div key={b.id} className="p-5 bg-zinc-900 rounded-[2rem] border border-white/5 flex flex-col gap-3">
            <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-white">CHAPA #0{b.id}</span><span className="text-[8px] font-bold text-zinc-600 uppercase">2750x1840mm</span></div>
            <div className="w-full h-24 bg-black rounded-xl border border-white/5 relative flex flex-wrap gap-0.5 p-1 overflow-hidden">
               {Array(b.parts).fill(0).map((_, i) => <div key={i} className="bg-zinc-800 border border-white/5 rounded min-w-[20px] h-full opacity-40 flex items-center justify-center text-[7px] font-black">P{i+1}</div>)}
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase text-zinc-700"><span>Cortes: {b.parts}</span><span>Aprovado</span></div>
          </div>
        ))}
      </div>
      <button className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><FileJson size={16}/> Exportar CNC .gcode</button>
    </div>
  );
};

// ============================================================================
// [WORKSHOP PRINCIPAL]
// ============================================================================

const Workshop = () => {
  const store = useStore();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const galInputRef = useRef<HTMLInputElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [store.messages]);

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!store.activeClientId) return;
    const userMsgId = `user-${Date.now()}`;
    store.addMessage({ id: userMsgId, from: "user", text: txt || "Iniciando materialização industrial...", src: img, timestamp: new Date().toISOString() });
    setInput(""); setPreview(null);
    const iaraId = `iara-${Date.now()}`;
    store.addMessage({ id: iaraId, from: "iara", text: "Iniciando orquestração industrial YARA v370...", timestamp: new Date().toISOString(), status: 'processing', progressiveSteps: { parsed: false, pricing: false, cutPlan: false, render: false } });

    try {
      const project = await YaraEngine.processInput(txt, img ? { type: 'image', url: img, data: img.split(',')[1] } : undefined);
      if (!project) throw new Error("DNA Error");
      store.progressUpdate(iaraId, project, { parsed: true });
      const pricing = PricingEngine.calculate(project, store.industrialRates);
      const cutPlan = CNCOptimizer.optimize(project);
      store.progressUpdate(iaraId, { pricing, cutPlan }, { pricing: true, cutPlan: true });
      const renders = await YaraEngine.generateRender(project, img?.split(',')[1]);
      store.progressUpdate(iaraId, { render: { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated } }, { render: true }, 'done');
      store.updateMessage(iaraId, { text: "Orquestração completa. Visualizações 8K e engenharia industrial carregadas." });
    } catch (e) { store.updateMessage(iaraId, { text: "Erro técnico na orquestração.", status: 'error' }); }
  };

  const onFileChange = useCallback((e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#09090b] font-sans overflow-hidden text-zinc-100 selection:bg-amber-500 selection:text-black">
      {/* SIDEBAR */}
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 sm:w-80 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-6 sm:p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-600 p-2"><X size={24} /></button></div>
          <button onClick={() => { const n = prompt("Nome do Cliente:"); if(n) store.addClient({id: Date.now().toString(), name: n}); }} className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-8 flex items-center justify-center gap-2 active:scale-95 shadow-2xl transition-all"><Plus size={16} /> Novo Lead Master</button>
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar custom-scrollbar pr-1">
            {store.clients.map((c: any) => (
              <button key={c.id} onClick={() => { store.setClient(c.id); setSidebar(false); }} className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${store.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-xl scale-[1.02]" : "bg-zinc-900/40 border-white/5 text-zinc-500 hover:bg-zinc-900"}`}><div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-black ${store.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>M</div><p className="font-black text-[11px] uppercase truncate tracking-tight">{c.name}</p></button>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between opacity-50"><button onClick={() => {store.setModal('ADMIN'); setSidebar(false);}} className="p-2 text-zinc-500 hover:text-white transition-all"><Settings size={20}/></button><span className="text-[8px] font-black uppercase text-amber-600 tracking-[0.4em] italic">YARA v370</span></div>
        </div>
      </nav>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative h-screen bg-[#09090b]">
        <header className="bg-zinc-950/80 backdrop-blur-3xl border-b border-white/5 py-3 sm:py-4 px-4 sm:px-8 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-3 sm:gap-6">{!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500 active:scale-90"><Menu size={28} /></button>}<LogoSVG size={42} /><div className="flex flex-col text-left"><h1 className="text-lg sm:text-2xl font-black uppercase tracking-tighter leading-none italic text-white">MARCENAPP</h1><span className="text-[8px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em] mt-1">Industrial Intelligence</span></div></div>
          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => store.setModal('MATERIAIS')} className="p-2.5 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"><Layers size={18} /></button>
             <button onClick={() => store.setModal('ORCAMENTO')} className="p-2.5 bg-white/5 rounded-xl text-emerald-500 hover:bg-white/10 transition-all"><DollarSign size={18} /></button>
             <button onClick={() => store.setModal('ADMIN')} className="p-2.5 bg-white/5 rounded-xl text-amber-500 hover:bg-white/10 transition-all"><ShieldCheck size={18} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-10 sm:space-y-16 custom-scrollbar pb-48 sm:pb-52 relative">
          {store.messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-5 duration-500`}>
              <div className={`max-w-[95%] sm:max-w-[80%] flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] text-xs sm:text-sm font-medium leading-relaxed shadow-2xl border ${m.from === "user" ? "bg-white text-black rounded-tr-none border-white" : "bg-zinc-900 text-zinc-300 rounded-tl-none border-white/5"}`}>
                  {m.src && <img src={m.src} className="rounded-2xl sm:rounded-[2.5rem] mb-4 sm:mb-6 w-full h-auto border-2 sm:border-4 border-white shadow-2xl cursor-pointer hover:scale-[1.01] transition-transform" alt="Ref" onClick={() => store.setPreview(m.src)} />}
                  <p className="whitespace-pre-line text-left leading-relaxed font-semibold">{m.text}</p>
                  {m.progressiveSteps && <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-3"><ProgressStep label="DNA TÉCNICO" active={m.progressiveSteps.parsed} icon={Cpu} /><ProgressStep label="PRICING" active={m.progressiveSteps.pricing} icon={DollarSign} /><ProgressStep label="CORTE CNC" active={m.progressiveSteps.cutPlan} icon={Scissors} /><ProgressStep label="RENDER 8K" active={m.progressiveSteps.render} icon={RotateCcw} /></div>}
                  {m.project && (
                    <div className="mt-8 bg-black rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl animate-in zoom-in-95">
                      <div className="bg-amber-500 p-4 sm:p-6 text-black flex justify-between items-center"><span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] italic">{m.project.title}</span><Award size={20} /></div>
                      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {m.project.render?.status === 'done' ? <div className="grid grid-cols-2 gap-3 sm:gap-5"><div className="relative group cursor-pointer" onClick={() => store.setPreview(m.project.render.faithfulUrl)}><img src={m.project.render.faithfulUrl} className="aspect-square object-cover rounded-xl sm:rounded-[2rem] transition-all group-hover:scale-105" /><span className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/80 text-white text-[7px] sm:text-[9px] px-2 sm:px-4 py-1 sm:py-1.5 rounded-full font-black">DNA FIEL</span></div><div className="relative group cursor-pointer" onClick={() => store.setPreview(m.project.render.decoratedUrl)}><img src={m.project.render.decoratedUrl} className="aspect-square object-cover rounded-xl sm:rounded-[2rem] transition-all group-hover:scale-105" /><span className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-amber-600/90 text-white text-[7px] sm:text-[9px] px-2 sm:px-4 py-1 sm:py-1.5 rounded-full font-black">AD STYLE</span></div></div> : m.status === 'processing' ? <div className="aspect-video bg-zinc-900/50 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center animate-pulse"><Loader2 className="animate-spin text-amber-500 mb-2 sm:mb-4" size={32}/><span className="text-[9px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em]">Materializando...</span></div> : null}
                        <div className="flex justify-between items-center pt-4 sm:pt-6 border-t border-white/5"><div className="flex flex-col text-left"><span className="text-[8px] sm:text-[10px] font-black uppercase text-zinc-600 leading-none mb-1 sm:mb-2">Orçamento Sugerido</span><span className="text-xl sm:text-3xl font-black text-white italic">R$ {m.project.pricing?.finalPrice?.toLocaleString('pt-BR') || '---'}</span></div><div className="flex gap-2 sm:gap-3"><button onClick={() => store.setModal('PLANO_CORTE')} className="p-3 sm:p-4 bg-zinc-900 text-emerald-500 rounded-xl sm:rounded-2xl hover:bg-zinc-800 border border-white/5 active:scale-90 transition-transform"><Scissors size={20}/></button><button onClick={() => store.setModal('ORCAMENTO')} className="p-3 sm:p-4 bg-amber-600 text-black rounded-xl sm:rounded-2xl hover:bg-amber-500 shadow-2xl active:scale-90 transition-transform"><DollarSign size={20}/></button></div></div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-4 sm:mt-5 opacity-40 text-[9px] sm:text-[10px] font-black gap-2 items-center">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}{m.from === 'user' && <CheckCheck size={14} className="text-emerald-500" />}</div>
                </div>
              </div>
            </div>
          ))}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5 z-50">
          <div className="max-w-5xl mx-auto">
            {preview && <div className="flex items-center gap-4 sm:gap-6 bg-zinc-900 p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] mb-4 sm:mb-6 border border-white/10 shadow-2xl relative animate-in slide-in-from-bottom-8"><img src={preview} className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover border-2 sm:border-4 border-white/10 shadow-2xl" alt="Preview" /><div className="flex-1 text-left"><p className="text-[9px] sm:text-[11px] font-black text-amber-500 uppercase mb-1 sm:mb-2 tracking-[0.2em]">YARA STUDIO SCAN</p><p className="text-[10px] sm:text-sm text-zinc-400 font-bold uppercase truncate">Hardware pronto para materialização.</p></div><button onClick={() => setPreview(null)} className="p-2 sm:p-3 bg-zinc-800 rounded-full text-zinc-500 active:scale-90 transition-transform"><X size={20}/></button></div>}
            <div className="flex items-center gap-2 sm:gap-5">
              <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-2xl transition-all border active:scale-90 ${isToolsOpen ? "bg-red-500 border-red-500 text-white" : "bg-zinc-900 border-white/5 text-amber-500 hover:bg-zinc-800"}`}><Plus size={24} className={`${isToolsOpen ? "rotate-45" : ""} transition-transform duration-300`} /></button>
              <div className="flex-1 bg-zinc-900/60 rounded-xl sm:rounded-3xl flex items-center px-4 sm:px-8 py-1 sm:py-3 border border-white/5 focus-within:bg-zinc-900 ring-amber-500/10 focus-within:ring-4 transition-all">
                <input placeholder={preview ? "Legenda..." : "Falar com Yara v370..."} className="flex-1 bg-transparent py-4 sm:py-5 text-sm sm:text-base outline-none font-bold text-white placeholder-zinc-700" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} />
                <div className="flex gap-2 sm:gap-4 text-zinc-600">
                  <button onClick={() => galInputRef.current?.click()} className="p-2 sm:p-3 hover:text-amber-500 active:scale-90 transition-transform"><LucideImage size={22}/></button>
                  <button onClick={() => camInputRef.current?.click()} className="p-2 sm:p-3 hover:text-amber-500 active:scale-90 transition-transform"><Camera size={22}/></button>
                </div>
              </div>
              <button onClick={() => handlePipeline(input, preview)} className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-2xl transition-all active:scale-90 ${input.trim() || preview ? "bg-amber-600 text-black shadow-amber-600/30" : "bg-zinc-900 text-zinc-800"}`} disabled={!input.trim() && !preview}><Send size={24} /></button>
            </div>
          </div>
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={onFileChange} />
        <input type="file" ref={camInputRef} hidden accept="image/*" capture="environment" onChange={onFileChange} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-28 sm:bottom-36 left-4 sm:left-10 w-[90%] sm:w-80 bg-[#09090b] border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 animate-in slide-in-from-bottom-10 duration-500">
              {[
                { id: 'ADMIN', label: 'Hardware Master', icon: ShieldCheck, color: 'text-emerald-500', desc: 'Configuração Industrial' },
                { id: 'ORCAMENTO', label: 'Pricing Master', icon: DollarSign, color: 'text-amber-500', desc: 'Engenharia de Custos' },
                { id: 'PLANO_CORTE', label: 'CNC Optimizer', icon: Scissors, color: 'text-blue-500', desc: 'Plano de Produção' },
                { id: 'MATERIAIS', label: 'MDF Library', icon: Layers, color: 'text-pink-500', desc: 'Biblioteca Pro' },
                { id: 'DISTRIBUIDOR', label: 'Logística', icon: Truck, color: 'text-orange-500', desc: 'Cadeia de Suprimentos' },
              ].map(tool => (
                <button key={tool.id} onClick={() => { store.setModal(tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 sm:gap-5 p-3 sm:p-5 hover:bg-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all text-left group">
                  <div className={`p-2.5 sm:p-3 rounded-2xl bg-zinc-800 ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon size={20} /></div>
                  <div><span className="text-[10px] sm:text-[11px] font-black uppercase text-white block leading-tight">{tool.label}</span><span className="text-[8px] sm:text-[9px] font-bold text-zinc-600 uppercase tracking-tight">{tool.desc}</span></div>
                </button>
              ))}
            </div>
          </div>
        )}

        <Drawer id="ADMIN" title="Admin Industrial" icon={ShieldCheck}><AdminPanel /></Drawer>
        <Drawer id="ORCAMENTO" title="Pricing Engine" icon={DollarSign}><FinancePanel /></Drawer>
        <Drawer id="PLANO_CORTE" title="CNC Optimization" icon={Scissors}><CutPlanPanel /></Drawer>
        <Drawer id="MATERIAIS" title="MDF Library v370" icon={Layers}><MaterialsPanel /></Drawer>
        <Drawer id="DISTRIBUIDOR" title="Logística Master" icon={Truck}>
          <div className="p-6 sm:p-10 bg-zinc-900 rounded-[2rem] sm:rounded-[3rem] border border-white/5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left"><div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500"><MapPin size={24} /></div><div><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 sm:mb-2">Radar Industrial</p><p className="text-xs sm:text-sm font-bold text-zinc-500 leading-relaxed">Mapeando serrarias e centros de distribuição próximos em tempo real...</p></div></div>
        </Drawer>

        {store.selectedImage && (
          <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in" onClick={() => store.setPreview(null)}>
            <img src={store.selectedImage} className="max-w-full max-h-[75vh] sm:max-h-[85vh] rounded-[2rem] sm:rounded-[4rem] shadow-2xl border border-white/10 select-none" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-6 sm:top-12 right-6 sm:right-12 flex gap-4"><button className="p-4 bg-white/5 text-white rounded-full backdrop-blur-3xl border border-white/10 active:scale-90" onClick={() => store.setPreview(null)}><X size={24} className="sm:hidden"/><X size={32} className="hidden sm:block"/></button></div>
            <div className="absolute bottom-8 sm:bottom-16 flex flex-col sm:flex-row gap-4 sm:gap-8 w-full px-6 sm:w-auto"><button className="w-full sm:w-auto px-8 sm:px-14 py-4 sm:py-6 bg-white/10 text-white rounded-full font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] border border-white/10 flex items-center justify-center gap-3 backdrop-blur-2xl hover:bg-white/20 active:scale-95 transition-all"><Download size={18}/> Salvar</button><button className="w-full sm:w-auto px-8 sm:px-14 py-4 sm:py-6 bg-amber-600 text-black rounded-full font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"><Share2 size={18}/> Compartilhar</button></div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f23; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar { width: 0; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// [BOOTSTRAP]
// ============================================================================

function App() {
  const { isReady, setReady } = useStore();
  useEffect(() => { const timer = setTimeout(() => setReady(true), 3200); return () => clearTimeout(timer); }, [setReady]);
  if (!isReady) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_75%)] from-amber-500/10" />
      <LogoSVG size={100} animated={true} />
      <div className="mt-16 text-center space-y-4 relative"><h2 className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse text-amber-500 italic">CARREGANDO HARDWARE YARA...</h2><div className="flex gap-2 justify-center"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.4s]" /><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.2s]" /><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" /></div><p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] pt-4 leading-relaxed">Industrial Intelligence Engine v3.70 Active</p></div>
    </div>
  );
  return <Workshop />;
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
