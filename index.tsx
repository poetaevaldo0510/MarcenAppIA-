
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import {
  Wrench,
  DollarSign,
  Eye,
  HardHat,
  X,
  Mic,
  Calendar,
  TrendingUp,
  Users,
  ShieldCheck,
  Zap,
  Save,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  LayoutDashboard,
  MessageSquare,
  RotateCcw,
  Rotate3d,
  Package,
  FileSignature,
  Hammer,
  CheckCircle2,
  Plus,
  Search,
  FileText,
  CheckCircle,
  ArrowUpRight,
  Cpu,
  Menu,
  Award,
  PlayCircle,
  ExternalLink,
  Handshake,
  ClipboardList,
  AlertTriangle,
  Filter,
  BarChart3,
  Image as LucideImage,
  Camera,
  Send,
  Wand2,
  UploadCloud,
  Loader2,
  Edit3,
  Sparkles,
  Lock,
  Unlock,
  Layers,
  Home,
  Maximize,
  Truck,
  MapPin,
  RefreshCw,
  WifiOff,
  Download,
  Share2,
  Scissors,
  // Fix: Added Key icon import
  Key
} from "lucide-react";

import { Attachment, ProjectData } from './types';
import { IARA_SYSTEM_PROMPT, LABOR_RATE_M2, MDF_SHEET_AREA } from './constants';

// ============================================================================
// [1. ENGENHARIA E CONTEXTO (IARA HUB CORE)]
// ============================================================================

const MarcenaContext = createContext<any>(null);

const PricingEngine = {
  calculate: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    const mdfCost = (totalArea * (rates.mdf / 5)) || 0;
    const labor = totalArea * LABOR_RATE_M2;
    const total = (mdfCost + labor) * 1.35; 
    return {
      // Fix: Cast status to literal and add missing creditsUsed
      status: 'done' as 'done',
      materials: [{ name: 'MDF Estrutural', cost: mdfCost }, { name: 'Ferragens e Insumos', cost: total * 0.15 }],
      total,
      labor,
      finalPrice: total * rates.markup,
      creditsUsed: 0,
    };
  }
};

const CNCOptimizer = {
  optimize: (project: ProjectData) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    const boardsNeeded = Math.ceil(totalArea / (MDF_SHEET_AREA * 0.85)) || 1;
    return {
      // Fix: Cast status to literal
      status: 'done' as 'done',
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
      // Fix: Ensure all ProjectData fields are present to prevent downstream assignment errors
      return {
        projectId: `YARA-${Date.now()}`,
        title: project.title || "Projeto MarcenApp",
        description: project.description || "Gerado por YARA AI",
        source: { type: 'hybrid', content: promptText },
        environment: project.environment || { width: 2000, height: 2600, depth: 600 },
        complexity: project.complexity || 2,
        modules: (project.modules || []).map((m: any, idx: number) => ({
          ...m,
          id: m.id || `m${idx + 1}`,
          type: m.type || 'modulo',
          dimensions: m.dimensions || { w: 0, h: 0, d: 0 },
          material: m.material || 'MDF 18mm',
          finish: m.finish || 'Standard'
        })),
        render: { status: 'pending' },
        pricing: { status: 'pending', materials: [], total: 0, labor: 0, finalPrice: 0, creditsUsed: 0 },
        cutPlan: { status: 'pending', boards: [], optimizationScore: 0 }
      } as ProjectData;
    } catch (e) { return null; }
  },

  generateRender: async (project: ProjectData, sketchData?: string): Promise<{ faithful: string, decorated: string }> => {
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

    const faithfulPrompt = `ULTRA-REALISTIC 3D FURNITURE RENDER. STAGE 1: GEOMETRIC FIDELITY. Project: ${project.title}. Material: Premium MDF. Environment: Neutral studio. 8K sharp details.`;
    const decoratedPrompt = `HIGH-END ARCHITECTURAL DIGEST STYLE. SUNLIGHT. Cinematic shadows. 8K Photorealistic. Premium staging.`;

    const [faithful, decorated] = await Promise.all([
      gen(faithfulPrompt, sketchData),
      gen(decoratedPrompt, sketchData)
    ]);
    return { faithful, decorated };
  }
};

// ============================================================================
// [2. PROVIDER E ESTADO]
// ============================================================================

export const MarcenaProvider = ({ children }: { children?: React.ReactNode }) => {
  const [state, setState] = useState({
    activeModal: null,
    activeClientId: '1',
    clients: [{ id: '1', name: 'Lead Master Pro' }],
    parts: [],
    ambientes: {},
    activeAmbiente: "Geral",
    industrialRates: { mdf: 440, markup: 2.2 },
    messages: [{ 
      id: 'initial', 
      from: 'iara', 
      text: 'YARA v374 ONLINE. Mestre Evaldo, pronto para materializar seus rascunhos em fotorrealismo industrial.', 
      timestamp: new Date().toISOString() 
    }],
    loadingAI: false,
    isAdminLoggedIn: false,
    isReady: false,
    selectedImage: null,
    distribuidores: [
      { id: 1, nome: "Madeireira Central", cidade: "Osasco", local: "Av. Industrial, 10" },
      { id: 2, nome: "GMAD - Revenda Master", cidade: "São Paulo", local: "Rua do MDF, 500" },
      { id: 3, nome: "Leo Madeiras", cidade: "Guarulhos", local: "Marginal, 22" }
    ]
  });

  const updateState = (key: string, val: any) => setState(prev => ({ ...prev, [key]: val }));

  return (
    <MarcenaContext.Provider value={{ ...state, updateState }}>
      {children}
    </MarcenaContext.Provider>
  );
};

// ============================================================================
// [3. COMPONENTES VISUAIS]
// ============================================================================

const LogoSVG = ({ size = 48, animated = false }: any) => (
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
);

const BrandHeading = () => (
  <div className="flex flex-col text-left justify-center ml-1">
    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white leading-none">MARCENAPP</h1>
    <p className="text-[8px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none mt-1">MARCENARIA DIGITAL</p>
  </div>
);

const ProgressStep = ({ label, active, icon: Icon }: any) => (
  <div className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${active ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
    {active ? <CheckCircle2 size={10} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin" />}
    <Icon size={10} />
    <span className="text-[8px] font-black uppercase truncate">{label}</span>
  </div>
);

const Drawer = ({ id, title, color, icon: Icon, children }: any) => {
  const { activeModal, updateState } = useContext(MarcenaContext);
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => updateState("activeModal", null)} />
      <div className="relative w-full max-w-lg bg-white h-[100dvh] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className={`${color} p-4 sm:p-6 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-4">{Icon && <Icon size={20} />}<h2 className="text-sm font-black uppercase tracking-tight">{title}</h2></div>
          <button onClick={() => updateState("activeModal", null)} className="p-2 bg-white/20 rounded-full active:scale-95"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 custom-scrollbar text-zinc-900 text-left">{children}</div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group transition-all active:scale-95">
    <div className="text-left text-zinc-900">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-2 shadow-lg group-hover:scale-110 transition-transform`}>{Icon && <Icon size={20} />}</div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <h4 className="text-xl font-black text-slate-800 tracking-tighter">{value}</h4>
    </div>
    <ArrowUpRight size={18} className="text-slate-200 group-hover:text-amber-500 transition-colors" />
  </div>
);

// ============================================================================
// [4. BANCADAS E ADMIN (CREDENCIAIS ATUALIZADAS)]
// ============================================================================

const AdminPanel = () => {
  const { isAdminLoggedIn, updateState, industrialRates } = useContext(MarcenaContext);
  const [form, setForm] = useState({ email: "", pass: "" });

  if (!isAdminLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center pt-10 space-y-6 text-zinc-900">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
          <Lock size={32} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-black uppercase italic">Hardware Master</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Credenciais de Operação</p>
        </div>
        <div className="w-full space-y-3 px-2">
          <input 
            placeholder="Evaldo@marcenapp.com.br" 
            className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-center outline-none border border-transparent focus:border-amber-500 transition-all text-sm" 
            value={form.email} 
            onChange={e => setForm({ ...form, email: e.target.value })} 
          />
          <input 
            type="password" 
            placeholder="Senha" 
            className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-center outline-none border border-transparent focus:border-amber-500 transition-all text-sm" 
            value={form.pass} 
            onChange={e => setForm({ ...form, pass: e.target.value })} 
          />
          <button 
            onClick={() => (form.email === "Evaldo@marcenapp.com.br" && form.pass === "123456") ? updateState("isAdminLoggedIn", true) : alert("Credenciais Inválidas")} 
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all text-xs tracking-widest"
          >
            Autenticar Oficina
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <span className="text-[9px] font-black text-slate-400 uppercase">MDF Base</span>
          <h4 className="text-xl font-black italic">R$ {industrialRates.mdf}</h4>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <span className="text-[9px] font-black text-slate-400 uppercase">Markup</span>
          <h4 className="text-xl font-black italic text-amber-600">x{industrialRates.markup}</h4>
        </div>
      </div>
      <button onClick={async () => (window as any).aistudio?.openSelectKey()} className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
        <Key size={18}/> Gerenciar Chaves API
      </button>
      <button onClick={() => updateState("isAdminLoggedIn", false)} className="w-full py-3 text-red-500 font-bold text-[10px] uppercase mt-10 hover:underline">Sair do Painel</button>
    </div>
  );
};

// ============================================================================
// [5. WORKSHOP ENGINE (AÇÃO PRINCIPAL)]
// ============================================================================

const Workshop = () => {
  // Fix: Destructured selectedImage from MarcenaContext
  const { messages, loadingAI, activeClientId, clients, updateState, industrialRates, distribuidores, selectedImage } = useContext(MarcenaContext);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const scrollRef = useRef<any>();
  const camRef = useRef<any>(); 
  const galRef = useRef<any>();

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, loadingAI]);

  const handleVox = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    rec.start();
  };

  const handlePipeline = async (txt: string, img: string | null = null) => {
    const userMsgId = Date.now();
    const history = [...messages, { id: userMsgId, from: "user", text: txt, src: img, timestamp: new Date().toISOString() }];
    updateState("messages", history);
    setInput(""); setPreview(null);
    updateState("loadingAI", true);

    const iaraId = Date.now() + 1;
    const iaraInitialMsg = { 
      id: iaraId, from: "iara", 
      text: "Iniciando orquestração industrial...", 
      timestamp: new Date().toISOString(), 
      progressiveSteps: { parsed: false, pricing: false, cutPlan: false, render: false },
      // Fix: Added missing project property to message object
      project: null as ProjectData | null
    };
    updateState("messages", [...history, iaraInitialMsg]);

    try {
      const project = await YaraEngine.processInput(txt, img ? { type: 'image', url: img, data: img.split(',')[1] } : undefined);
      if (!project) throw new Error();
      
      const updateProg = (step: any, proj?: ProjectData) => {
        updateState("messages", history.concat([{ 
          ...iaraInitialMsg, 
          project: proj || iaraInitialMsg.project,
          progressiveSteps: { ...iaraInitialMsg.progressiveSteps, ...step }
        }]));
      };

      updateProg({ parsed: true }, project);

      const pricing = PricingEngine.calculate(project, industrialRates);
      const cutPlan = CNCOptimizer.optimize(project);
      
      const updatedProject = { ...project, pricing, cutPlan };
      updateProg({ parsed: true, pricing: true, cutPlan: true }, updatedProject);

      const renders = await YaraEngine.generateRender(updatedProject, img?.split(',')[1]);
      
      updateState("messages", history.concat([{ 
        ...iaraInitialMsg, 
        text: "Orquestração completa. Motor 8K carregado.",
        project: { ...updatedProject, render: { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated } },
        progressiveSteps: { parsed: true, pricing: true, cutPlan: true, render: true }
      }]));

    } catch (e) {
      updateState("messages", history.concat([{ id: iaraId, from: "iara", text: "Intercorrência no sinal industrial.", status: 'error' }]));
    } finally {
      updateState("loadingAI", false);
    }
  };

  const onFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#09090b] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500 p-2"><X size={24} /></button></div>
          <button onClick={() => { const n = prompt("Lead:"); if(n) { const id=Date.now().toString(); updateState("clients", [...clients, {id, name:n}]); updateState("activeClientId", id); } }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-8 flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all"><Plus size={16} /> Novo Projeto</button>
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar custom-scrollbar pr-1">
            {clients.map((c: any) => (
              <button key={c.id} onClick={() => { updateState("activeClientId", c.id); setSidebar(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-lg scale-105" : "bg-zinc-900 border-white/5 text-zinc-500 opacity-60 hover:opacity-100"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>M</div>
                <p className="font-black text-[11px] uppercase truncate">{c.name}</p>
              </button>
            ))}
          </div>
          <div className="pt-6 border-t border-white/5 opacity-40 text-center text-[8px] font-black uppercase text-amber-600">v374 Supreme Engine</div>
        </div>
      </nav>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col relative h-[100dvh] bg-white lg:rounded-l-[3.5rem] shadow-2xl overflow-hidden transition-all">
        <header className="bg-[#09090b] py-3 px-4 sm:px-6 flex items-center justify-between text-white shrink-0 z-40">
          <div className="flex items-center gap-3 sm:gap-4">
            {!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500 active:scale-90"><Menu size={28} /></button>}
            <LogoSVG size={45} /><BrandHeading />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
             <button onClick={() => updateState("activeModal", "DISTRIBUIDOR")} className="p-2.5 bg-white/5 rounded-xl text-amber-500 active:scale-90 transition-all"><Truck size={20} /></button>
             <button onClick={() => updateState("activeModal", "ADMIN")} className="p-2.5 bg-white/5 rounded-xl text-emerald-500 active:scale-90 transition-all"><ShieldCheck size={20} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-8 bg-[#f8fafc] custom-scrollbar pb-40 relative text-left">
          {messages.length === 1 && (
             <div className="h-full flex flex-col items-center justify-center opacity-10 text-center grayscale py-20">
                <LogoSVG size={140} animated={loadingAI}/>
                <p className="mt-8 font-black uppercase tracking-[0.4em] text-[10px] px-10 text-zinc-900">Oficina Resiliente v374</p>
             </div>
          )}
          {messages.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[92%] sm:max-w-[85%] p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] text-sm font-medium leading-relaxed ${m.from === "user" ? "bg-zinc-900 text-white rounded-tr-none shadow-xl" : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm"}`}>
                {m.src && <img src={m.src} className="rounded-2xl mb-4 w-full h-auto border-2 border-white shadow-md active:scale-[1.02] transition-transform cursor-pointer" alt="Scan" onClick={() => updateState("selectedImage", m.src)} />}
                <p className="whitespace-pre-line text-left font-semibold text-xs sm:text-sm">{String(m.text || "")}</p>
                
                {m.progressiveSteps && (
                  <div className="mt-5 pt-5 border-t border-slate-50 grid grid-cols-2 gap-2">
                    <ProgressStep label="DNA TÉCNICO" active={m.progressiveSteps.parsed} icon={Cpu} />
                    <ProgressStep label="PRICING" active={m.progressiveSteps.pricing} icon={DollarSign} />
                    <ProgressStep label="CORTE CNC" active={m.progressiveSteps.cutPlan} icon={Scissors} />
                    <ProgressStep label="RENDER 8K" active={m.progressiveSteps.render} icon={RotateCcw} />
                  </div>
                )}

                {m.project && m.progressiveSteps?.render && (
                  <div className="mt-6 bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner animate-in zoom-in-95">
                    <div className="bg-amber-500 p-4 text-black font-black uppercase text-[10px] italic flex justify-between"><span>{m.project.title}</span><Award size={14}/></div>
                    <div className="p-4 space-y-4">
                      {m.project.render?.faithfulUrl && (
                        <div className="grid grid-cols-2 gap-2">
                          <img src={m.project.render.faithfulUrl} className="aspect-square object-cover rounded-2xl border-2 border-white shadow-sm hover:scale-105 transition-transform" onClick={() => updateState("selectedImage", m.project.render.faithfulUrl)} />
                          <img src={m.project.render.decoratedUrl} className="aspect-square object-cover rounded-2xl border-2 border-white shadow-sm hover:scale-105 transition-transform" onClick={() => updateState("selectedImage", m.project.render.decoratedUrl)} />
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-2">
                        <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Cálculo Industrial</span><span className="text-lg font-black text-zinc-900 italic">R$ {m.project.pricing?.finalPrice?.toLocaleString('pt-BR')}</span></div>
                        <div className="flex gap-2">
                           <button className="p-2.5 bg-white rounded-xl shadow-sm text-amber-600 active:scale-90 transition-all border border-slate-100" onClick={() => alert("Plano Exportado")}><Download size={18}/></button>
                           <button className="p-2.5 bg-zinc-900 rounded-xl shadow-sm text-white active:scale-90 transition-all" onClick={() => alert("Compartilhado")}><Share2 size={18}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loadingAI && <div className="flex items-center gap-3 bg-white w-fit p-4 rounded-3xl shadow-sm border border-slate-100 animate-pulse"><Loader2 size={16} className="animate-spin text-amber-600" /><span className="text-[10px] font-black text-slate-400 uppercase">Processando Hardware...</span></div>}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-10 shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
          {preview && (
            <div className="flex items-center gap-4 bg-slate-100 p-3 rounded-2xl mb-4 animate-in slide-in-from-bottom-5 border-2 border-white shadow-xl max-w-lg mx-auto">
              <img src={preview} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white shadow-md" />
              <div className="flex-1 text-zinc-900"><p className="text-[10px] font-black text-amber-600 uppercase mb-1">Hardware Scan</p><p className="text-[10px] sm:text-xs text-slate-500 font-bold leading-tight uppercase">Rascunho detectado. Pronto para orquestração.</p></div>
              <button onClick={() => setPreview(null)} className="p-2 bg-white rounded-full text-slate-400 active:scale-90 shadow-sm"><X size={16}/></button>
            </div>
          )}
          <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all border active:scale-90 ${isToolsOpen ? "bg-red-500 border-red-500 text-white" : "bg-[#09090b] border-white/5 text-amber-500"}`}><Plus size={24} className={`${isToolsOpen ? "rotate-45" : ""} transition-transform duration-300`} /></button>
            <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-1 border border-zinc-200 shadow-inner group focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
              <input 
                placeholder={preview ? "Legenda técnica..." : "Falar com Yara v374..."} 
                className="flex-1 bg-transparent py-4 text-sm outline-none font-bold text-slate-800 placeholder-slate-400" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} 
              />
              <div className="flex gap-1.5 sm:gap-2 text-slate-400">
                <button onClick={() => galRef.current.click()} className="p-2 hover:text-amber-500 active:scale-90 transition-transform"><LucideImage size={24}/></button>
                <button onClick={() => camRef.current.click()} className="p-2 hover:text-amber-500 active:scale-90 transition-transform"><Camera size={24}/></button>
              </div>
            </div>
            <button 
                onClick={input.trim() || preview ? () => handlePipeline(input, preview) : handleVox} 
                className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-xl transition-all active:scale-90 ${input.trim() || preview ? "bg-orange-600 text-white shadow-orange-600/30" : isListening ? "bg-red-500 text-white animate-pulse" : "bg-zinc-800 text-white"}`}
            >
              {input.trim() || preview ? <Send size={22} /> : <Mic size={22} className={isListening ? "animate-spin" : ""} />}
            </button>
          </div>
        </footer>

        <input type="file" ref={galRef} hidden accept="image/*" onChange={onFileChange} />
        <input type="file" ref={camRef} hidden accept="image/*" capture="environment" onChange={onFileChange} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-28 left-4 sm:left-6 w-64 bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl p-3 flex flex-col gap-2 animate-in slide-in-from-bottom-5 duration-500">
              {[
                { id: 'ADMIN', label: 'Hardware Master', color: 'bg-slate-900', icon: ShieldCheck, desc: 'Gestão Master' },
                { id: 'DISTRIBUIDOR', label: 'Onde Comprar', color: 'bg-amber-600', icon: MapPin, desc: 'Radar Logístico' },
                { id: 'MATERIAIS', label: 'MDF Library', color: 'bg-pink-600', icon: Layers, desc: 'Catálogo Pro' },
                { id: 'ESTELA', label: 'Financeiro', color: 'bg-emerald-600', icon: DollarSign, desc: 'Pricing Detalhado' },
              ].map((tool) => (
                <button key={tool.id} onClick={() => { updateState("activeModal", tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-3xl transition-all text-left text-white group">
                  <div className={`p-2 rounded-xl ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon size={20} /></div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest">{tool.label}</span>
                     <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tight">{tool.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <Drawer id="ADMIN" title="Admin Industrial Master" color="bg-slate-900" icon={ShieldCheck}><AdminPanel /></Drawer>
        <Drawer id="ESTELA" title="Engenharia de Custos" color="bg-emerald-600" icon={DollarSign}>
           <div className="space-y-6">
              <MetricCard label="Faturamento Estimado" value={`R$ ${(industrialRates.mdf * 3.5).toLocaleString()}`} icon={DollarSign} color="bg-blue-600" />
              <MetricCard label="Margem Industrial" value="45.2%" icon={TrendingUp} color="bg-green-600" />
           </div>
        </Drawer>
        <Drawer id="MATERIAIS" title="MDF Library v374" color="bg-pink-600" icon={Layers}>
           <div className="grid grid-cols-2 gap-3">
             {['Branco TX', 'Carvalho Malva', 'Grafite Chess', 'Freijó Puro', 'Preto Silk', 'Nude Matt'].map(mat => (
               <div key={mat} className="aspect-square bg-slate-200 rounded-3xl relative overflow-hidden group border-2 border-transparent hover:border-amber-500 transition-all cursor-pointer">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-3 left-3 flex flex-col"><span className="text-[7px] font-black uppercase text-white/60">INDUSTRIAL</span><span className="text-[9px] font-black uppercase text-white">{mat}</span></div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"><CheckCircle size={16} className="text-white"/></div>
               </div>
             ))}
           </div>
        </Drawer>
        <Drawer id="DISTRIBUIDOR" title="Radar de Suprimentos" color="bg-amber-600" icon={Truck}>
          <div className="space-y-4">
             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 mb-2">
                <MapPin size={20} className="text-amber-600" />
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Estoque Parceiro Ativo</p>
             </div>
             {distribuidores.map((d: any) => (
               <div key={d.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm text-left hover:border-amber-500 transition-all">
                  <h4 className="font-black text-sm uppercase text-zinc-900">{d.nome}</h4>
                  <p className="text-[10px] text-zinc-600 font-bold mb-1">{d.local}</p>
                  <p className="text-[10px] text-slate-400">{d.cidade}</p>
                  <button className="w-full mt-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md">Consultar MDF</button>
               </div>
             ))}
          </div>
        </Drawer>

        {/* Fix: Replaced state.selectedImage with destructured selectedImage */}
        {selectedImage && (
          <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => updateState("selectedImage", null)}>
            <img src={selectedImage} className="max-w-full max-h-[75vh] sm:max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-8 right-8 flex gap-4">
               <button className="p-4 bg-white/5 text-white rounded-full backdrop-blur-3xl border border-white/10 active:scale-90" onClick={() => updateState("selectedImage", null)}><X size={32}/></button>
            </div>
            <div className="absolute bottom-10 flex gap-4 w-full px-10 max-w-lg">
               <button className="flex-1 py-5 bg-white/10 text-white rounded-full font-black uppercase text-[10px] tracking-widest border border-white/20 flex items-center justify-center gap-3 backdrop-blur-3xl"><Download size={20}/> Salvar</button>
               <button className="flex-1 py-5 bg-amber-600 text-black rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"><Share2 size={20}/> Compartilhar</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) { .custom-scrollbar::-webkit-scrollbar { width: 0; } }
      `}</style>
    </div>
  );
};

// ============================================================================
// [6. BOOT LOADER]
// ============================================================================

function AppLogic() {
  const { isReady, updateState } = useContext(MarcenaContext);

  useEffect(() => {
    const startup = setTimeout(() => updateState("isReady", true), 2800);
    return () => clearTimeout(startup);
  }, []);

  if (!isReady) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-10 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_75%)] from-amber-500/10" />
      <LogoSVG size={100} animated={true} />
      <h2 className="mt-12 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-amber-500 italic">IGNIÇÃO MARCENAPP v374...</h2>
      <div className="mt-6 flex gap-2">
         <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"/>
         <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"/>
         <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"/>
      </div>
    </div>
  );

  return <Workshop />;
}

export default function App() {
  return (
    <MarcenaProvider>
      <AppLogic />
    </MarcenaProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
