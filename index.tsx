
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  createContext,
  useContext,
  useReducer,
} from "react";
import { createRoot } from "react-dom/client";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import {
  Wrench,
  DollarSign,
  Eye,
  HardHat,
  X,
  Mic,
  TrendingUp,
  ShieldCheck,
  Zap,
  Trash2,
  ChevronLeft,
  LayoutDashboard,
  MessageSquare,
  Package,
  FileSignature,
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
  Loader2,
  Lock,
  Unlock,
  Layers,
  Home,
  Maximize,
  CheckCheck,
  Scissors
} from "lucide-react";

import { 
  MessageType, 
  Attachment 
} from './types';

import { 
  IARA_SYSTEM_PROMPT, 
  MDF_SHEET_PRICE, 
  LABOR_RATE_M2, 
  MDF_SHEET_AREA 
} from './constants';

/**
 * MARCENAPP SUPREME v370 - ENGINE INTEGRATION
 * - Firebase Ready
 * - Hardware: Camera Environment & Microphone Vox
 * - Admin Master: evaldo@marcenapp.com.br / 123456
 */

// ============================================================================
// [0. INFRAESTRUTURA FIREBASE - IGNIÇÃO SEGURA]
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
    console.error("Erro no hardware Firebase:", e);
    return false;
  }
};

// ============================================================================
// [1. MOTOR IA - YARA ENGINE]
// ============================================================================

const MODEL_TEXT = "gemini-2.5-flash-preview-09-2025";

const YaraEngine = {
  processInput: async (text: string, attachment?: Attachment): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text }];
    if (attachment?.data) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: attachment.data,
        },
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: IARA_SYSTEM_PROMPT,
        }
      });
      return response.text || "Sem resposta do sinal.";
    } catch (e) {
      console.error("AI Error:", e);
      return "Erro de sincronismo industrial.";
    }
  }
};

// ============================================================================
// [2. CONTEXTO GLOBAL & REDUCER]
// ============================================================================

const MarcenaContext = createContext<any>(null);

const marcenaReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SET_READY': return { ...state, isReady: true };
    case 'SET_MODAL': return { ...state, activeModal: action.id };
    case 'SET_CLIENT': return { ...state, activeClientId: action.id };
    case 'ADD_CLIENT': return { ...state, clients: [...state.clients, action.payload] };
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING': return { ...state, loadingAI: action.val };
    case 'SET_ADMIN': return { ...state, isAdminLoggedIn: action.val };
    case 'SET_RATES': return { ...state, industrialRates: { ...state.industrialRates, ...action.payload } };
    case 'ADD_PART': return { ...state, parts: [...state.parts, action.payload] };
    case 'REMOVE_PART': return { ...state, parts: state.parts.filter((p: any) => p.id !== action.id) };
    case 'ADD_AMBIENTE': return { ...state, ambientes: { ...state.ambientes, [action.nome]: { pecas: [] } } };
    case 'SET_ACTIVE_AMBIENTE': return { ...state, activeAmbiente: action.nome };
    case 'ADD_PECA_AMBIENTE': {
      const updated = { ...state.ambientes };
      const amb = updated[action.ambiente] || { pecas: [] };
      amb.pecas = [...amb.pecas, action.peca];
      updated[action.ambiente] = amb;
      return { ...state, ambientes: updated };
    }
    default: return state;
  }
};

// ============================================================================
// [3. UI COMPONENTS PADRONIZADOS (I & X)]
// ============================================================================

const LogoSVG = ({ size = 48, animated = false }) => (
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
    <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">MARCENAPP</h1>
    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none mt-1">MARCENARIA DIGITAL</p>
  </div>
);

const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="p-2 bg-white/20 rounded-full active:scale-95 text-white hover:bg-white/40 transition-all">
    <X size={20} />
  </button>
);

const Drawer = ({ id, title, color, icon: Icon, children }: any) => {
  const { state, dispatch } = useContext(MarcenaContext);
  if (state.activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => dispatch({ type: 'SET_MODAL', id: null })} />
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        <header className={`${color} p-6 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-4">{Icon && <Icon size={24} />}<h2 className="text-lg font-black uppercase tracking-tight font-mono">{title}</h2></div>
          <CloseButton onClick={() => dispatch({ type: 'SET_MODAL', id: null })} />
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar text-zinc-900 text-left">{children}</div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
    <div className="text-left text-zinc-900">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-2 shadow-lg group-hover:scale-110 transition-transform`}><Icon size={20} /></div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h4>
    </div>
    <ArrowUpRight size={18} className="text-slate-200 group-hover:text-amber-500 transition-colors" />
  </div>
);

// ============================================================================
// [4. BANCADAS]
// ============================================================================

const BentoBancada = () => {
  const { state, dispatch, financeiro, notify } = useContext(MarcenaContext);
  const [newP, setNewP] = useState({ n: "", w: "", h: "", q: 1 });

  const addAmbiente = () => {
    const nome = prompt("Nome do Ambiente (ex: Cozinha):");
    if (nome) dispatch({ type: 'ADD_AMBIENTE', nome });
  };

  const addPeca = () => {
    if (!newP.w || !newP.h) return;
    const peca = { ...newP, id: Date.now() };
    if (state.activeAmbiente === "Geral") {
      dispatch({ type: 'ADD_PART', payload: peca });
    } else {
      dispatch({ type: 'ADD_PECA_AMBIENTE', ambiente: state.activeAmbiente, peca });
    }
    setNewP({ n: "", w: "", h: "", q: 1 });
    notify("Peça Registrada!");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-100 rounded-3xl border flex justify-between items-center shadow-inner">
        <div><p className="text-[10px] font-black text-slate-400 uppercase">MDF Projetado</p><p className="text-2xl font-black text-slate-800">{financeiro.chapas} Chapas</p></div>
        <Package className="text-amber-600" size={32} />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black uppercase text-zinc-400">Ambientes</h3>
          <button onClick={addAmbiente} className="text-[10px] font-black text-orange-600">+ NOVO</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["Geral", ...Object.keys(state.ambientes)].map(a => (
            <button key={a} onClick={() => dispatch({ type: 'SET_ACTIVE_AMBIENTE', nome: a })} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all shrink-0 ${state.activeAmbiente === a ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-slate-100 text-slate-400"}`}>{a}</button>
          ))}
        </div>
      </div>
      <div className="p-6 bg-white rounded-[2.5rem] border-2 border-dashed border-orange-200 space-y-4">
        <input placeholder="Descrição da Peça" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newP.n} onChange={e => setNewP({ ...newP, n: e.target.value })} />
        <div className="flex gap-2">
          <input type="number" placeholder="Larg." className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={newP.w} onChange={e => setNewP({ ...newP, w: e.target.value })} />
          <input type="number" placeholder="Alt." className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={newP.h} onChange={e => setNewP({ ...newP, h: e.target.value })} />
          <input type="number" placeholder="Qtd" className="w-20 p-4 bg-slate-50 rounded-2xl font-bold" value={newP.q} onChange={e => setNewP({ ...newP, q: Number(e.target.value) })} />
        </div>
        <button onClick={addPeca} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Fixar Item</button>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { state, dispatch, financeiro } = useContext(MarcenaContext);
  const [form, setForm] = useState({ email: "", pass: "" });

  if (!state.isAdminLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center pt-12 space-y-6">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse"><Lock size={30} /></div>
        <div className="w-full max-w-sm space-y-4">
          <input placeholder="E-mail Corporativo" className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-center outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Senha Master" className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-center outline-none" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} />
          <button onClick={() => form.email === "evaldo@marcenapp.com.br" && form.pass === "123456" ? dispatch({ type: 'SET_ADMIN', val: true }) : alert("Acesso Negado")} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-xl active:scale-95">Entrar no Cofre</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <MetricCard label="Faturamento Previsto" value={`R$ ${financeiro.venda.toLocaleString('pt-BR')}`} icon={DollarSign} color="bg-blue-600" />
      <MetricCard label="Lucro Projeto" value={`R$ ${financeiro.lucro.toLocaleString('pt-BR')}`} icon={TrendingUp} color="bg-green-600" />
      <button onClick={() => dispatch({ type: 'SET_ADMIN', val: false })} className="w-full py-3 text-red-500 font-bold text-[10px] uppercase mt-10">Logout Segurança</button>
    </div>
  );
};

// ============================================================================
// [5. WORKSHOP SUPREME]
// ============================================================================

const Workshop = () => {
  const { state, dispatch, financeiro, notify } = useContext(MarcenaContext);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null); 
  const galInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [state.messages, state.loadingAI]);

  const handleVox = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return notify("Voz não suportada.");
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.onstart = () => { setListening(true); notify("Ouvindo..."); };
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    rec.start();
  };

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!state.activeClientId) return notify("Selecione um projeto!");
    const userMsg = { id: Date.now(), from: "user", text: txt, src: img, type: img ? "user-image" : "text" };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    setInput(""); setPreview(null);
    dispatch({ type: 'SET_LOADING', val: true });

    try {
      const responseText = await YaraEngine.processInput(txt, img ? { type: 'image', url: img, data: img.split(',')[1] } : undefined);
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { id: Date.now() + 1, from: "iara", text: responseText, timestamp: new Date() } 
      });
    } catch (e) {
      notify("Erro IA");
    } finally {
      dispatch({ type: 'SET_LOADING', val: false });
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
    <div className="flex h-screen bg-[#09090b] font-sans overflow-hidden">
      {/* SIDEBAR SUPREME */}
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500 p-2"><X /></button></div>
          <button onClick={() => { const n = prompt("Cliente:"); if(n) { const id=Date.now().toString(); dispatch({ type: 'ADD_CLIENT', payload: {id, name:n, status:'Iniciação'} }); dispatch({ type: 'SET_CLIENT', id }); } }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-8 flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all"><Plus size={16} /> Novo Projeto</button>
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar custom-scrollbar">
            {state.clients.map((c: any) => (
              <button key={c.id} onClick={() => { dispatch({ type: 'SET_CLIENT', id: c.id }); setSidebar(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${state.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-lg scale-105" : "bg-zinc-900 border-white/5 text-zinc-500 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${state.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>M</div>
                <p className="font-black text-[11px] uppercase truncate">{c.name}</p>
              </button>
            ))}
          </div>
          <div className="pt-6 border-t border-white/5 opacity-40 text-center text-[8px] font-black uppercase text-amber-600 tracking-widest">v370 Architecture</div>
        </div>
      </nav>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col relative h-screen bg-white lg:rounded-l-[3.5rem] shadow-2xl overflow-hidden">
        <header className="bg-[#09090b] py-3 px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-5">
            {!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500 active:scale-90"><Menu size={28} /></button>}
            <LogoSVG size={45} /><BrandHeading />
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => dispatch({ type: 'SET_MODAL', id: 'DISTRIBUIDOR' })} className="p-2 bg-white/5 rounded-xl text-amber-500 active:scale-90 transition-all"><Truck size={22} /></button>
             <button onClick={() => dispatch({ type: 'SET_MODAL', id: 'ADMIN' })} className="p-2 bg-white/5 rounded-xl text-emerald-500 active:scale-90 transition-all"><ShieldCheck size={22} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 bg-[#f8fafc] custom-scrollbar pb-36 relative text-left">
          {state.messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 text-center grayscale">
              <LogoSVG size={180} animated={state.loadingAI}/>
              <p className="mt-8 font-black uppercase tracking-[0.4em] text-xs">Mestre, oficina aberta.</p>
            </div>
          )}
          {state.messages.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-5 rounded-[2.5rem] text-sm font-medium leading-relaxed shadow-sm ${m.from === "user" ? "bg-zinc-900 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"}`}>
                {m.src && <img src={m.src} className="rounded-2xl mb-3 w-full h-auto border border-white/10 shadow-md cursor-pointer" alt="Scan" onClick={() => dispatch({ type: 'SET_PREVIEW', url: m.src })} />}
                <p className="whitespace-pre-line">{m.text}</p>
                <div className="flex justify-end mt-1 opacity-40"><span className="text-[9px] font-bold">12:00</span>{m.from === 'user' && <CheckCheck size={12} className="ml-1"/>}</div>
              </div>
            </div>
          ))}
          {state.loadingAI && <div className="flex items-center gap-3 bg-white w-fit p-4 rounded-3xl shadow-sm border border-slate-100 animate-pulse"><Loader2 size={16} className="animate-spin text-amber-600" /><span className="text-[10px] font-black text-slate-400 uppercase">Yara processando...</span></div>}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          {preview && (
            <div className="flex items-center gap-4 bg-slate-100 p-3 rounded-2xl mb-4 animate-in zoom-in border-2 border-white shadow-xl relative">
              <img src={preview} className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" alt="Studio Preview" />
              <div className="flex-1 text-zinc-900"><p className="text-[10px] font-black text-amber-600 uppercase mb-1 flex items-center gap-1"><Maximize size={12}/> Iara Studio</p><p className="text-[11px] text-slate-500 font-bold leading-tight uppercase">Hardware pronto. Descreva o plano.</p></div>
              <button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 p-2 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-xl transition-all"><X size={16}/></button>
            </div>
          )}
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all border active:scale-90 ${isToolsOpen ? "bg-red-500 border-red-500 text-white" : "bg-[#09090b] border-white/5 text-amber-500"}`}><Plus size={24} className={`${isToolsOpen ? "rotate-45" : ""} transition-transform`} /></button>
            <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-1 border border-zinc-200 shadow-inner group focus-within:bg-white transition-all ring-orange-500/10 focus-within:ring-4">
              <input placeholder={preview ? "Legenda do Scan..." : "Falar com Yara v370..."} className="flex-1 bg-transparent py-5 text-sm outline-none font-bold text-slate-800" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} />
              <div className="flex gap-1 text-slate-400">
                <button onClick={() => galInputRef.current?.click()} className="p-2 hover:text-orange-600 transition-colors"><LucideImage size={24}/></button>
                <button onClick={() => camInputRef.current?.click()} className="p-2 hover:text-orange-600 transition-colors"><Camera size={24}/></button>
              </div>
            </div>
            <button onClick={input.trim() || preview ? () => handlePipeline(input, preview) : handleVox} className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-xl transition-all ${input.trim() || preview ? "bg-orange-600 text-white" : listening ? "bg-red-500 text-white animate-pulse" : "bg-zinc-800 text-white"}`}>
              {input.trim() || preview ? <Send size={22} /> : <Mic size={22} className={listening ? "animate-spin" : ""} />}
            </button>
          </div>
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={onFileChange} />
        <input type="file" ref={camInputRef} hidden accept="image/*" capture="environment" onChange={onFileChange} />

        {/* MENU SUSPENSO (+) */}
        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000] pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-28 left-6 w-64 bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl p-3 flex flex-col gap-2 pointer-events-auto animate-in slide-in-from-bottom-5">
              {[
                { id: 'BENTO', label: 'Engenharia Bento', color: 'bg-orange-600', icon: Wrench },
                { id: 'ESTELA', label: 'Financeiro Estela', color: 'bg-emerald-600', icon: DollarSign },
                { id: 'JUCA', label: 'Instalação Juca', color: 'bg-slate-700', icon: HardHat },
                { id: 'ADMIN', label: 'Dashboard Master', color: 'bg-slate-900', icon: ShieldCheck },
              ].map((tool) => (
                <button key={tool.id} onClick={() => { dispatch({ type: 'SET_MODAL', id: tool.id }); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-3xl transition-all text-left text-white group">
                  <div className={`p-2 rounded-xl ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon size={20} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODAIS GAVETA */}
        <Drawer id="BENTO" title="Engenharia Bento" color="bg-orange-600" icon={Wrench}><BentoBancada /></Drawer>
        <Drawer id="ESTELA" title="Financeiro Estela" color="bg-emerald-600" icon={DollarSign}>
           <div className="space-y-6">
              <MetricCard label="Faturamento Total" value={`R$ ${financeiro.venda.toLocaleString('pt-BR')}`} icon={DollarSign} color="bg-blue-600" />
              <MetricCard label="Lucro Projeto" value={`R$ ${financeiro.lucro.toLocaleString('pt-BR')}`} icon={TrendingUp} color="bg-green-600" />
              <div className="p-8 bg-white border-2 border-slate-100 rounded-[3rem] space-y-4">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-left">Markup de Venda</p>
                 <div className="flex items-center gap-6">
                    <input type="range" min="1.1" max="4" step="0.1" className="flex-1 accent-orange-600" value={state.industrialRates.markup} onChange={(e) => dispatch({ type: 'SET_RATES', payload: { markup: Number(e.target.value) } })} />
                    <span className="bg-zinc-900 text-white px-5 py-3 rounded-2xl font-black italic">{state.industrialRates.markup}x</span>
                 </div>
              </div>
              <button onClick={() => notify("📄 CONTRATO SUPREME GERADO!")} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-4 active:scale-95 shadow-xl transition-all"><FileSignature size={24} /> Gerar Contrato PDF</button>
           </div>
        </Drawer>
        <Drawer id="ADMIN" title="Admin Master" color="bg-slate-900" icon={ShieldCheck}><AdminPanel /></Drawer>
        <Drawer id="DISTRIBUIDOR" title="Onde Comprar" color="bg-amber-600" icon={Truck}>
          <div className="space-y-4 text-zinc-900">
             <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center gap-3">
               <MapPin size={24} className="text-amber-600" />
               <p className="text-xs font-black text-amber-800 uppercase tracking-tighter leading-relaxed">Localizando parceiros industriais em sua região</p>
             </div>
             {[
                { id: 1, nome: "Madeireira Central", cidade: "Osasco", status: "Online" },
                { id: 2, nome: "GMAD - Revenda Master", cidade: "São Paulo", status: "Parceiro" },
                { id: 3, nome: "Leo Madeiras", cidade: "Guarulhos", status: "Estoque" }
             ].map(d => (
               <div key={d.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-amber-500 transition-all text-left group">
                  <h4 className="font-black text-sm uppercase group-hover:text-amber-600 transition-colors">{d.nome}</h4>
                  <p className="text-[10px] text-slate-400 mb-4">{d.cidade} • <span className="text-emerald-500">{d.status}</span></p>
                  <button className="w-full py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">Ver Estoque MDF</button>
               </div>
             ))}
          </div>
        </Drawer>

        {/* FULLSCREEN PREVIEW */}
        {state.selectedImage && (
          <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-in fade-in" onClick={() => dispatch({ type: 'SET_PREVIEW', url: null })}>
            <img src={state.selectedImage} className="max-w-full max-h-[80vh] rounded-[4rem] shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-10 right-10">
               <button className="p-4 bg-white text-orange-600 rounded-full shadow-2xl active:scale-90" onClick={() => dispatch({ type: 'SET_PREVIEW', url: null })}><X size={32} strokeWidth={3}/></button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        input[type="range"] { -webkit-appearance: none; height: 10px; border-radius: 10px; background: #e2e8f0; outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 30px; height: 30px; border-radius: 50%; background: #ea580c; cursor: pointer; border: 4px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

// ============================================================================
// [6. APP ROOT & LOGIC]
// ============================================================================

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  if (hasError) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center p-12 text-center text-white">
      <LogoSVG size={100} />
      <h2 className="mt-12 text-2xl font-black uppercase tracking-widest text-amber-500 italic">Reinicialização Necessária</h2>
      <button onClick={() => window.location.reload()} className="px-14 py-6 mt-10 bg-white text-black rounded-full font-black uppercase text-xs tracking-[0.5em] shadow-2xl active:scale-95 transition-all">Reconectar Oficina</button>
    </div>
  );
  return <>{children}</>;
};

function AppLogic() {
  const { state, dispatch } = useContext(MarcenaContext);

  useEffect(() => {
    const startup = async () => {
      initFirebase();
      if (auth) {
        try {
          if (typeof (window as any).__initial_auth_token !== "undefined" && (window as any).__initial_auth_token) {
            await signInWithCustomToken(auth, (window as any).__initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (e) { console.warn("Offline Boot Mode."); }
      }
      setTimeout(() => dispatch({ type: 'SET_READY' }), 1500);
    };
    startup();
  }, [dispatch]);

  if (!state.isReady) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-12">
      <LogoSVG size={100} animated={true} />
      <h2 className="mt-12 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-amber-500 italic leading-none">SINCRONIZANDO OFICINA...</h2>
      <p className="mt-6 text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em] leading-none">Protocol v370 Unlocked</p>
    </div>
  );

  return <Workshop />;
}

export default function App() {
  const [state, dispatch] = useReducer(marcenaReducer, { 
    isReady: false,
    activeModal: null,
    activeClientId: '1',
    clients: [{ id: '1', name: 'Lead Master', status: 'Iniciação' }],
    parts: [],
    ambientes: {},
    activeAmbiente: "Geral",
    industrialRates: { mdf: 440, markup: 2.2 },
    messages: [{ id: 'w1', from: 'iara', text: 'MARCENAPP SUPREME v370 ONLINE. Mestre, envie um rascunho ou descreva o projeto para orquestrar agora.', timestamp: new Date() }],
    loadingAI: false,
    isAdminLoggedIn: false,
    selectedImage: null
  });

  const financeiro = useMemo(() => {
    let totalArea = 0;
    // Soma peças de ambientes
    Object.values(state.ambientes).forEach((amb: any) => {
      (amb?.pecas || []).forEach((p: any) => {
        totalArea += (Number(p.w) * Number(p.h) * Number(p.q || 1)) / 1000000;
      });
    });
    // Soma peças gerais
    state.parts.forEach((p: any) => {
      totalArea += (Number(p.w) * Number(p.h) * Number(p.q || 1)) / 1000000;
    });

    const mdfCost = (totalArea * (state.industrialRates.mdf / 5)) || 0;
    const totalCost = mdfCost * 1.35;
    const venda = totalCost * state.industrialRates.markup;
    return { 
      venda, 
      lucro: venda - totalCost, 
      area: totalArea, 
      chapas: Math.ceil(totalArea / 4.3) 
    };
  }, [state.ambientes, state.parts, state.industrialRates]);

  const notify = (text: string) => {
    const t = document.createElement('div');
    t.className = "fixed top-36 left-1/2 -translate-x-1/2 z-[300000] bg-black text-white px-12 py-6 rounded-full font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl animate-in zoom-in border border-amber-500/30 text-center backdrop-blur-xl pointer-events-none";
    t.innerText = text; document.body.appendChild(t);
    setTimeout(() => { t.classList.add('animate-out', 'fade-out'); setTimeout(() => t.remove(), 400); }, 3000);
  };

  return (
    <ErrorBoundary>
      <MarcenaContext.Provider value={{ state, dispatch, financeiro, notify }}>
        <AppLogic />
      </MarcenaContext.Provider>
    </ErrorBoundary>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
