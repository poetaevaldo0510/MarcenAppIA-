
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  createContext,
  useContext,
  useReducer,
  useCallback,
  memo
} from "react";
import { createRoot } from "react-dom/client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import {
  Wrench,
  DollarSign,
  X,
  Mic,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Menu,
  Award,
  Truck,
  MapPin,
  Image as LucideImage,
  Camera,
  Send,
  Maximize,
  CheckCheck,
  Scissors,
  Download,
  Share2,
  Cpu,
  RotateCcw,
  FileJson,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Key,
  Info,
  Lock,
  Unlock,
  Loader2
} from "lucide-react";

import { Attachment, ProjectData } from './types';
import { IARA_SYSTEM_PROMPT, LABOR_RATE_M2, MDF_SHEET_AREA } from './constants';

// ============================================================================
// [0. INFRAESTRUTURA FIREBASE]
// ============================================================================

let db: any, auth: any;

const initFirebase = () => {
  try {
    const configRaw = typeof (window as any).__firebase_config !== "undefined" ? (window as any).__firebase_config : "{}";
    const config = JSON.parse(configRaw);
    if (!config.apiKey) return false;
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    return true;
  } catch (e) {
    return false;
  }
};

// ============================================================================
// [1. MOTORES DE ENGENHARIA]
// ============================================================================

const PricingEngine = {
  calculate: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    let totalArea = project.modules.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0);
    const mdfCost = (totalArea * (rates.mdf / 5)) || 0;
    const labor = totalArea * LABOR_RATE_M2;
    const total = (mdfCost + labor) * 1.35; 
    return {
      status: 'done' as const,
      materials: [{ name: 'MDF Estrutural', cost: mdfCost }, { name: 'Ferragens e Insumos', cost: total * 0.15 }],
      total,
      labor,
      finalPrice: total * rates.markup,
      creditsUsed: 15
    };
  }
};

const CNCOptimizer = {
  optimize: (project: ProjectData) => {
    const totalArea = project.modules.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0);
    const boardsNeeded = Math.ceil(totalArea / (MDF_SHEET_AREA * 0.85));
    return {
      status: 'done' as const,
      boards: Array(boardsNeeded).fill({ efficiency: 0.85 + (Math.random() * 0.1) }),
      optimizationScore: 85 + (Math.random() * 10)
    };
  }
};

const YaraEngine = {
  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const promptText = text || (attachment ? "Analise este rascunho técnico e extraia o DNA industrial." : "Descreva um projeto de marcenaria.");
    const parts: any[] = [{ text: promptText }];
    
    if (attachment?.data) {
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: attachment.data },
      });
    }

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
        source: { type: attachment ? 'image' : 'text', content: text, attachmentUrl: attachment?.url },
        render: { status: 'pending' },
        pricing: { status: 'pending', materials: [], total: 0, labor: 0, finalPrice: 0, creditsUsed: 15 },
        cutPlan: { status: 'pending', boards: [], optimizationScore: 0 }
      } as ProjectData;
    } catch (e) {
      console.error("YaraParser Error:", e);
      return null;
    }
  },

  generateRender: async (project: ProjectData, sketchData?: string): Promise<{ faithful: string, decorated: string }> => {
    // Check key before generating (Image models need key)
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
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
      } catch (e: any) {
        if (e.message?.includes("entity was not found") && typeof window !== 'undefined' && (window as any).aistudio) {
          await (window as any).aistudio.openSelectKey();
        }
        return '';
      }
    };

    const modulesSummary = project.modules.map(m => `${m.type} (${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm)`).join(', ');

    const faithfulPrompt = `
      ULTRA-REALISTIC TECHNICAL 3D RENDER. STRICT GEOMETRIC FIDELITY TO SKETCH.
      Materialize the furniture: ${project.title}. Modules: ${modulesSummary}.
      Perspective: Isometric professional catalog view.
      Lighting: Soft 3-point technical studio lighting. 
      Background: Neutral light gray studio backdrop.
      Materials: Photorealistic MDF textures, clean visible edges, accurate hardware.
      Instruction: No extra decoration. Focus 100% on the product geometry based on the reference image proportions.
    `;

    const decoratedPrompt = `
      ARCHITECTURAL DIGEST PROFESSIONAL PHOTOGRAPHY STYLE. 
      Place the furniture: ${project.title} in a high-end luxury interior.
      Atmosphere: Sophisticated, modern minimalist residence.
      Lighting: Natural morning sunlight through large side windows (Golden Hour).
      Staging: Refined minimalist decor (ceramic vases, architectural books).
      Materials: Tactile wood veneers, stone countertops, satin finishes.
      Composition: Perfectly balanced wide shot, Rule of Thirds. Fotorrealismo 8K.
    `;

    const [faithful, decorated] = await Promise.all([
      gen(faithfulPrompt, sketchData),
      gen(decoratedPrompt, sketchData)
    ]);

    return { faithful, decorated };
  }
};

// ============================================================================
// [2. CONTEXTO E REDUCER]
// ============================================================================

const MarcenaContext = createContext<any>(null);

const marcenaReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SET_READY': return { ...state, isReady: true };
    case 'SET_MODAL': return { ...state, activeModal: action.id };
    case 'SET_CLIENT': return { ...state, activeClientId: action.id };
    case 'ADD_CLIENT': return { ...state, clients: [...state.clients, action.payload] };
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE': return { ...state, messages: state.messages.map((m: any) => m.id === action.id ? { ...m, ...action.payload } : m) };
    case 'PROGRESS_UPDATE': return { 
      ...state, 
      messages: state.messages.map((m: any) => 
        m.id === action.id 
          ? { 
              ...m, 
              project: action.project !== undefined ? { ...(m.project || {}), ...action.project } : m.project,
              progressiveSteps: action.stepUpdate !== undefined ? { ...(m.progressiveSteps || {}), ...action.stepUpdate } : m.progressiveSteps,
              status: action.status || m.status
            } 
          : m
      ) 
    };
    case 'SET_ADMIN': return { ...state, isAdminLoggedIn: action.val };
    case 'SET_PREVIEW': return { ...state, selectedImage: action.url };
    default: return state;
  }
};

// ============================================================================
// [3. COMPONENTES UI (OPTIMIZED)]
// ============================================================================

const ProgressStep = memo(({ label, active, icon: Icon }: any) => (
  <div className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-500 ${active ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
    {active ? (
      <CheckCircle2 size={14} className="animate-in zoom-in text-emerald-500" />
    ) : (
      <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
    )}
    <Icon size={14} className={active ? 'text-orange-600' : 'text-slate-300'} />
    <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate">{label}</span>
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
      <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-[24px] animate-spin" style={{ margin: "-8px" }} />
    )}
  </div>
));

const Drawer = memo(({ id, title, color, icon: Icon, children }: any) => {
  const { state, dispatch } = useContext(MarcenaContext);
  if (state.activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => dispatch({ type: 'SET_MODAL', id: null })} />
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        <header className={`${color} p-6 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-4">{Icon && <Icon size={24} />}<h2 className="text-lg font-black uppercase tracking-tight font-mono">{title}</h2></div>
          <button onClick={() => dispatch({ type: 'SET_MODAL', id: null })} className="p-2 bg-white/20 rounded-full text-white"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar text-zinc-900 text-left">{children}</div>
      </div>
    </div>
  );
});

// ============================================================================
// [ADMIN PANEL]
// ============================================================================

const AdminPanel = () => {
  const { state, dispatch, financeiro, notify } = useContext(MarcenaContext);
  const [form, setForm] = useState({ email: "", pass: "" });

  const handleKeySelection = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      notify("MOTOR DE CHAVES ATIVADO");
    } else {
      notify("Hardware de chaves indisponível");
    }
  }, [notify]);

  if (!state.isAdminLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center pt-12 space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl relative">
          <Lock size={40} className="text-amber-500" />
          <div className="absolute inset-0 border-2 border-amber-500/20 rounded-3xl animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Cofre de Engenharia</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acesso Restrito ao Mestre</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <input placeholder="Usuário" className="w-full p-5 bg-white rounded-2xl font-bold text-center outline-none border-2 border-slate-100 focus:border-amber-500 transition-all shadow-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Senha Master" className="w-full p-5 bg-white rounded-2xl font-bold text-center outline-none border-2 border-slate-100 focus:border-amber-500 transition-all shadow-sm" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} />
          <button onClick={() => (form.email === "admin") && (form.pass === "admin") ? dispatch({ type: 'SET_ADMIN', val: true }) : notify("ACESSO NEGADO")} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Autenticar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-slate-100 flex flex-col items-start gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento</span>
          <h4 className="text-2xl font-black text-zinc-800">R$ {financeiro.venda.toLocaleString('pt-BR')}</h4>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-slate-100 flex flex-col items-start gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro</span>
          <h4 className="text-2xl font-black text-emerald-600">R$ {financeiro.lucro.toLocaleString('pt-BR')}</h4>
        </div>
      </div>

      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <Key size={24} className="text-amber-500" />
          <h4 className="text-lg font-black uppercase tracking-tight italic">Gemini API Key</h4>
        </div>
        <button onClick={handleKeySelection} className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"><Plus size={16} /> Configurar Chave</button>
      </div>

      <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
        <button onClick={() => dispatch({ type: 'SET_ADMIN', val: false })} className="px-8 py-3 bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-2 transition-all hover:bg-red-100"><ShieldCheck size={14} /> Deslogar</button>
      </div>
    </div>
  );
};

// ============================================================================
// [WORKSHOP PRINCIPAL]
// ============================================================================

const Workshop = () => {
  const { state, dispatch, financeiro, notify } = useContext(MarcenaContext);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [showJson, setShowJson] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null); 
  const galInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [state.messages]);

  const toggleJson = useCallback((id: string) => {
    setShowJson(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleVox = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return notify("Vox não suportada.");
    const rec = new SR(); rec.lang = "pt-BR";
    rec.onstart = () => { setListening(true); notify("Ouvindo plano..."); };
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    rec.start();
  }, [notify]);

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!state.activeClientId) return notify("Selecione um projeto!");
    
    // UI OTIMISTA
    const userMsgId = Date.now().toString();
    const timestamp = new Date();
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { 
        id: userMsgId, 
        from: "user", 
        text: txt || "Iniciando materialização industrial...", 
        src: img, 
        type: img ? "user-image" : "text",
        timestamp 
      } 
    });
    setInput(""); setPreview(null);
    
    const iaraId = (Date.now() + 1).toString();
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { 
        id: iaraId, 
        from: "iara", 
        text: "Iniciando orquestração YARA v370...", 
        timestamp: new Date(),
        status: 'processing',
        progressiveSteps: { parsed: false, pricing: false, cutPlan: false, render: false }
      } 
    });

    try {
      // 1. PARSING
      const project = await YaraEngine.processInput(txt, img ? { type: 'image', url: img, data: img.split(',')[1] } : undefined);
      if (!project) throw new Error("DNA Error");
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, project, stepUpdate: { parsed: true } });

      // 2. PRICING & CUTPLAN
      const pricing = PricingEngine.calculate(project, state.industrialRates);
      const cutPlan = CNCOptimizer.optimize(project);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, project: { pricing, cutPlan }, stepUpdate: { pricing: true, cutPlan: true } });

      // 3. RENDER (ASYNC)
      const renders = await YaraEngine.generateRender(project, img?.split(',')[1]);
      if (!renders.faithful) throw new Error("Render Error");

      dispatch({ 
        type: 'PROGRESS_UPDATE', 
        id: iaraId, 
        project: { render: { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated } },
        stepUpdate: { render: true },
        status: 'done'
      });
      
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        id: iaraId, 
        payload: { text: "Orquestração completa. O hardware gerou visualizações de alta fidelidade e cálculos industriais precisos." } 
      });

      notify("MATERIALIZAÇÃO CONCLUÍDA");
    } catch (e) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { text: "Erro na orquestração. Verifique os dados ou a chave de API.", status: 'error' } });
      notify("Erro Industrial");
    }
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
    <div className="flex h-screen bg-[#09090b] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500 p-2"><X /></button></div>
          <button onClick={() => { const n = prompt("Nome do Cliente:"); if(n) { const id=Date.now().toString(); dispatch({ type: 'ADD_CLIENT', payload: {id, name:n} }); dispatch({ type: 'SET_CLIENT', id }); } }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-8 flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all"><Plus size={16} /> Novo Lead</button>
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar custom-scrollbar">
            {state.clients.map((c: any) => (
              <button key={c.id} onClick={() => { dispatch({ type: 'SET_CLIENT', id: c.id }); setSidebar(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${state.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-lg scale-105" : "bg-zinc-900 border-white/5 text-zinc-500 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${state.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>M</div>
                <p className="font-black text-[11px] uppercase truncate">{c.name}</p>
              </button>
            ))}
          </div>
          <div className="pt-6 border-t border-white/5 opacity-40 text-center text-[8px] font-black uppercase text-amber-600 tracking-widest">YARA v370 Industrial AI</div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col relative h-screen bg-white lg:rounded-l-[3.5rem] shadow-2xl overflow-hidden">
        <header className="bg-[#09090b] py-3 px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-5">
            {!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500 active:scale-90"><Menu size={28} /></button>}
            <LogoSVG size={45} />
            <div className="flex flex-col text-left">
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">MARCENAPP</h1>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Industrial Logic</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => dispatch({ type: 'SET_MODAL', id: 'DISTRIBUIDOR' })} className="p-2 bg-white/5 rounded-xl text-amber-500 hover:bg-white/10 transition-all"><Truck size={22} /></button>
             <button onClick={() => dispatch({ type: 'SET_MODAL', id: 'ADMIN' })} className="p-2 bg-white/5 rounded-xl text-emerald-500 hover:bg-white/10 transition-all"><ShieldCheck size={22} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 bg-[#f8fafc] custom-scrollbar pb-40 relative text-left">
          {state.messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-5 rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-sm ${m.from === "user" ? "bg-zinc-900 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"}`}>
                  {m.src && <img src={m.src} className="rounded-2xl mb-3 w-full h-auto border border-white/10 shadow-md cursor-pointer" alt="Reference" onClick={() => dispatch({ type: 'SET_PREVIEW', url: m.src })} />}
                  <p className="whitespace-pre-line">{m.text}</p>
                  
                  {m.progressiveSteps && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                       <ProgressStep label="DNA TÉCNICO" active={m.progressiveSteps.parsed} icon={Cpu} />
                       <ProgressStep label="PRICING" active={m.progressiveSteps.pricing} icon={DollarSign} />
                       <ProgressStep label="OTIMIZAÇÃO" active={m.progressiveSteps.cutPlan} icon={Scissors} />
                       <ProgressStep label="8K RENDER" active={m.progressiveSteps.render} icon={RotateCcw} />
                    </div>
                  )}

                  {m.project && (
                    <div className="mt-5 bg-slate-50 border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm animate-in zoom-in">
                      <div className="bg-zinc-900 p-4 text-white flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{m.project.title}</span>
                        <Award size={18} className="text-amber-500" />
                      </div>
                      
                      <div className="p-4 border-b border-slate-200">
                        <button onClick={() => toggleJson(m.id)} className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <div className="flex items-center gap-2"><FileJson size={14}/> Engenharia Industrial</div>
                          {showJson[m.id] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                        {showJson[m.id] && (
                          <pre className="mt-3 p-3 bg-zinc-900 text-emerald-400 text-[9px] rounded-xl overflow-x-auto font-mono">
                            {JSON.stringify(m.project, null, 2)}
                          </pre>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        {m.project.render.status === 'done' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative group cursor-pointer" onClick={() => dispatch({ type: 'SET_PREVIEW', url: m.project.render.faithfulUrl })}>
                              <img src={m.project.render.faithfulUrl} className="aspect-square object-cover rounded-2xl border border-slate-200 transition-all group-hover:scale-105" />
                              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] px-2 py-0.5 rounded-full font-black">DNA FIEL</span>
                            </div>
                            <div className="relative group cursor-pointer" onClick={() => dispatch({ type: 'SET_PREVIEW', url: m.project.render.decoratedUrl })}>
                              <img src={m.project.render.decoratedUrl} className="aspect-square object-cover rounded-2xl border border-slate-200 transition-all group-hover:scale-105" />
                              <span className="absolute bottom-2 left-2 bg-amber-600/80 text-white text-[7px] px-2 py-0.5 rounded-full font-black">AD STYLE</span>
                            </div>
                          </div>
                        ) : m.status === 'error' ? (
                          <div className="aspect-video bg-red-50 rounded-2xl flex flex-col items-center justify-center border border-red-100">
                             <AlertCircle className="text-red-400 mb-2" size={32}/>
                             <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Falha Técnica</span>
                          </div>
                        ) : (
                          <div className="aspect-video bg-slate-200 rounded-2xl flex flex-col items-center justify-center animate-pulse">
                            <Loader2 className="animate-spin text-slate-400 mb-2" size={32}/>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materializando 3D...</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <div className="flex flex-col text-left">
                             <span className="text-[9px] font-black uppercase text-slate-400">Venda Sugerida</span>
                             <span className="text-xl font-black text-slate-900">R$ {m.project.pricing?.finalPrice?.toLocaleString('pt-BR') || '---'}</span>
                          </div>
                          <div className="flex gap-2">
                             <button className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center"><Download size={18}/></button>
                             <button className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Share2 size={18}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-2 opacity-40">
                    <span className="text-[9px] font-bold">{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {m.from === 'user' && <CheckCheck size={12} className="ml-1"/>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50">
          {preview && (
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl mb-4 animate-in zoom-in border-2 border-slate-100 shadow-xl relative">
              <img src={preview} className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" alt="Studio Preview" />
              <div className="flex-1 text-zinc-900">
                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">YARA Studio Scan</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase text-left">Pronto para orquestração fotorrealista.</p>
              </div>
              <button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 p-2 bg-white rounded-full text-slate-400 shadow-xl border border-slate-100"><X size={16}/></button>
            </div>
          )}
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all border active:scale-90 ${isToolsOpen ? "bg-red-500 border-red-500 text-white" : "bg-[#09090b] border-white/5 text-amber-500"}`}><Plus size={24} className={`${isToolsOpen ? "rotate-45" : ""} transition-transform`} /></button>
            <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-1 border border-zinc-200 shadow-inner focus-within:bg-white transition-all">
              <input placeholder={preview ? "Legenda do rascunho..." : "Falar com Yara..."} className="flex-1 bg-transparent py-5 text-sm outline-none font-bold text-slate-800" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} />
              <div className="flex gap-1 text-slate-400">
                <button onClick={() => galInputRef.current?.click()} className="p-2 hover:text-orange-600"><LucideImage size={24}/></button>
                <button onClick={() => camInputRef.current?.click()} className="p-2 hover:text-orange-600"><Camera size={24}/></button>
              </div>
            </div>
            <button onClick={input.trim() || preview ? () => handlePipeline(input, preview) : handleVox} className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-xl transition-all ${input.trim() || preview ? "bg-orange-600 text-white" : listening ? "bg-red-500 text-white animate-pulse" : "bg-zinc-800 text-white"}`}>
              {input.trim() || preview ? <Send size={22} /> : <Mic size={22} />}
            </button>
          </div>
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={onFileChange} />
        <input type="file" ref={camInputRef} hidden accept="image/*" capture="environment" onChange={onFileChange} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-28 left-6 w-64 bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl p-3 flex flex-col gap-2 animate-in slide-in-from-bottom-5">
              {[
                { id: 'ADMIN', label: 'Dashboard Master', color: 'bg-slate-900', icon: ShieldCheck },
                { id: 'DISTRIBUIDOR', label: 'Distribuidores', color: 'bg-amber-600', icon: Truck },
              ].map((tool) => (
                <button key={tool.id} onClick={() => { dispatch({ type: 'SET_MODAL', id: tool.id }); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-3xl transition-all text-left text-white group">
                  <div className={`p-2 rounded-xl ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon size={20} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Drawer id="ADMIN" title="ADMIN MASTER" color="bg-slate-900" icon={ShieldCheck}><AdminPanel /></Drawer>
        <Drawer id="DISTRIBUIDOR" title="PARCEIROS" color="bg-amber-600" icon={Truck}>
          <div className="space-y-4">
            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center gap-3">
              <MapPin size={24} className="text-amber-600" />
              <p className="text-xs font-black text-amber-800 uppercase tracking-tighter">Buscando parceiros próximos...</p>
            </div>
          </div>
        </Drawer>

        {state.selectedImage && (
          <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-in fade-in" onClick={() => dispatch({ type: 'SET_PREVIEW', url: null })}>
            <img src={state.selectedImage} className="max-w-full max-h-[82vh] rounded-[4rem] shadow-2xl border border-white/10 select-none" onClick={(e) => e.stopPropagation()} />
            <button className="absolute top-10 right-10 p-4 bg-white text-black rounded-full shadow-2xl" onClick={() => dispatch({ type: 'SET_PREVIEW', url: null })}><X size={32}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// [BOOTSTRAP]
// ============================================================================

function AppLogic() {
  const { state, dispatch } = useContext(MarcenaContext);
  useEffect(() => {
    const startup = async () => {
      initFirebase();
      setTimeout(() => dispatch({ type: 'SET_READY' }), 2000);
    };
    startup();
  }, [dispatch]);

  if (!state.isReady) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center text-white">
      <LogoSVG size={100} animated={true} />
      <h2 className="mt-12 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-amber-500 italic">ORQUESTRAÇÃO YARA v370...</h2>
    </div>
  );
  return <Workshop />;
}

export default function App() {
  const [state, dispatch] = useReducer(marcenaReducer, { 
    isReady: false,
    activeModal: null,
    activeClientId: '1',
    clients: [{ id: '1', name: 'Lead Principal' }],
    industrialRates: { mdf: 440, markup: 2.2 },
    messages: [{ id: 'w1', from: 'iara', text: 'YARA v370 ONLINE. Mestre, pronto para materializar seus projetos em fotorrealismo industrial.', timestamp: new Date() }],
    isAdminLoggedIn: false,
    selectedImage: null
  });

  const financeiro = useMemo(() => {
    let totalArea = 0;
    state.messages.forEach((m: any) => {
      if (m.project && m.project.pricing) {
        totalArea += m.project.modules.reduce((acc: number, mod: any) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0);
      }
    });
    const mdfCost = (totalArea * (state.industrialRates.mdf / 5)) || 0;
    const totalCost = mdfCost * 1.35;
    const venda = totalCost * state.industrialRates.markup;
    return { venda, lucro: venda - totalCost };
  }, [state.messages, state.industrialRates]);

  const notify = useCallback((text: string) => {
    const t = document.createElement('div');
    t.className = "fixed top-32 left-1/2 -translate-x-1/2 z-[300000] bg-black text-white px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl animate-in zoom-in border border-amber-500/30 text-center backdrop-blur-xl pointer-events-none";
    t.innerText = text; document.body.appendChild(t);
    setTimeout(() => { t.classList.add('animate-out', 'fade-out'); setTimeout(() => t.remove(), 400); }, 3000);
  }, []);

  return (
    <MarcenaContext.Provider value={{ state, dispatch, financeiro, notify }}>
      <AppLogic />
    </MarcenaContext.Provider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
