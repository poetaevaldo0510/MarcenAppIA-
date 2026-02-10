
import React, { useState, useRef, useEffect, useReducer, createContext, useContext, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Wrench, DollarSign, Eye, HardHat, X, Mic, Calendar,
  TrendingUp, Users, RotateCcw, Rotate3d, Package, FileSignature, 
  CheckCircle, ArrowUpRight, Cpu, Menu, Award, PlayCircle, 
  Image as LucideImage, Camera, Send, Trash2, AlertTriangle, BarChart3,
  Plus, Search, Filter, ClipboardList, Hammer, Zap, UserPlus,
  ChevronRight, Smartphone, LayoutDashboard, MessageSquare, Download, Share2, Loader2, Save, UploadCloud,
  FolderOpen, ImageIcon
} from 'lucide-react';

import { 
  Message, 
  MessageType, 
  ProjectData, 
  Attachment,
  MarcenaState,
  Module
} from './types';

import { 
  IARA_SYSTEM_PROMPT, 
  MDF_SHEET_PRICE, 
  LABOR_RATE_M2, 
  DEFAULT_MARGIN,
  MDF_SHEET_AREA
} from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cores da Identidade Visual MarcenApp
const BRAND_ORANGE = '#D97706';
const BRAND_BLACK = '#000000';

// ============================================================================
// [0. UTILITÁRIOS - YARA PARSERS]
// ============================================================================

const YaraParsers = {
  extractJSON: (text: string) => {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const projectData = parsed.project || parsed;
      if (projectData.modules) {
        projectData.modules = projectData.modules.map((m: any) => {
          const parseDim = (val: any) => {
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
            return isNaN(num) ? 0 : Math.abs(num);
          };
          return {
            ...m,
            dimensions: { 
              w: parseDim(m.dimensions?.w), 
              h: parseDim(m.dimensions?.h), 
              d: parseDim(m.dimensions?.d) 
            }
          };
        });
      }
      return { project: projectData };
    } catch (e) { return null; }
  },
  parseVoice: async (audioBase64: string): Promise<string> => {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      contents: [{ parts: [{ inlineData: { mimeType: 'audio/wav', data: audioBase64 } }, { text: "Transcreva tecnicamente." }] }]
    });
    return res.text || "";
  },
  calculateTotalArea: (modules: Module[]) => modules.reduce((acc, m) => acc + (m.dimensions.w * m.dimensions.h) / 1000000, 0)
};

// ============================================================================
// [1. ENGINES]
// ============================================================================

const PricingEngine = {
  calculate: (project: Partial<ProjectData>, industrialRates: { mdf: number; markup: number }) => {
    const modules = project.modules || [];
    const area = YaraParsers.calculateTotalArea(modules);
    const cost = Math.ceil(area / (MDF_SHEET_AREA * 0.8)) * industrialRates.mdf;
    const finalPrice = (cost + area * LABOR_RATE_M2) * industrialRates.markup;
    return { status: 'done' as const, total: cost, finalPrice, labor: area * LABOR_RATE_M2, materials: [], taxAmount: 0, creditsUsed: 10 };
  }
};

const RenderEngine = {
  generate: async (project: Partial<ProjectData>, sketchData?: string, style: string = 'Architectural Digest Style') => {
    const gen = async (prompt: string, ref?: string) => {
      const parts: any[] = [];
      if (ref) parts.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
      parts.push({ text: prompt });
      const res = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: [{ parts }] });
      const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    };
    const faithful = await gen("1:1 DNA Faithful industrial wood furniture visualization.", sketchData);
    const decorated = await gen(`${style} professional interior photography staging.`, sketchData);
    return { status: 'done' as const, faithfulUrl: faithful, decoratedUrl: decorated };
  }
};

// ============================================================================
// [2. REDUCER & CONTEXTO]
// ============================================================================

const MarcenaContext = createContext<any>(null);

const marcenaReducer = (state: MarcenaState, action: any): MarcenaState => {
  switch (action.type) {
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE': return { ...state, messages: state.messages.map(m => m.id === action.id ? { ...m, ...action.payload } : m) };
    case 'LOAD_PROJECTS': return { ...state, messages: action.payload };
    case 'PROGRESS_UPDATE': return { ...state, messages: state.messages.map(m => m.id === action.id ? { ...m, project: { ...(m.project || {}), ...action.payload }, progressiveSteps: { ...(m.progressiveSteps || {}), ...action.stepUpdate } } : m) };
    default: return state;
  }
};

// ============================================================================
// [3. COMPONENTES]
// ============================================================================

const LogoSVG = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="black" />
    <circle cx="50" cy="18" r="6.5" fill="#D97706" />
    <path d="M22 74V32H39L50 52L61 32H78V74" stroke="white" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    <rect x="22" y="84" width="56" height="5" fill="#D97706" />
  </svg>
);

// Componente para visualização do progresso das etapas da YARA
const ProgressStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${done ? 'bg-orange-500 border-orange-500 shadow-[0_0_10px_rgba(217,119,6,0.5)]' : active ? 'border-orange-500 animate-pulse' : 'border-zinc-300'}`} />
    <span className={`text-[9px] font-black uppercase tracking-widest ${done ? 'text-zinc-900' : active ? 'text-orange-600' : 'text-zinc-400'}`}>{label}</span>
  </div>
);

const Drawer = ({ id, title, color, icon, children }: any) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[120000] flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-[450px] h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        <header className={`${color} p-10 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/20 rounded-[1.2rem] backdrop-blur-md border border-white/20">{React.createElement(icon, { size: 28 })}</div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none">MarcenApp Master</span>
              <h2 className="text-2xl font-black uppercase tracking-widest italic leading-none mt-1">{title}</h2>
            </div>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-4 bg-white rounded-full text-orange-600 hover:bg-orange-50 transition-all shadow-xl flex items-center justify-center">
            <X size={28} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const IaraVisionBancada = () => {
  const { state, setSelectedImage } = useContext(MarcenaContext);
  const [tab, setTab] = useState<'RENDERS' | 'DNA'>('RENDERS');

  const renders = useMemo(() => state.messages
    .filter((m: Message) => m.project?.render.status === 'done')
    .flatMap((m: Message) => [
      { url: m.project!.render.faithfulUrl, title: m.project!.title, mode: "DNA Fiel 1:1" },
      { url: m.project!.render.decoratedUrl, title: m.project!.title, mode: "AD Showroom" }
    ]).filter(i => i.url), [state.messages]);

  const dnaPhotos = useMemo(() => state.messages
    .filter((m: Message) => m.attachment?.type === 'image')
    .map((m: Message) => ({ url: m.attachment!.url, title: m.content || "DNA Origem", timestamp: m.timestamp })), [state.messages]);

  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="flex bg-zinc-100 p-1.5 rounded-2xl gap-2">
        <button onClick={() => setTab('RENDERS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'RENDERS' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-200'}`}>Renders AI</button>
        <button onClick={() => setTab('DNA')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'DNA' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-200'}`}>DNA do Celular</button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {tab === 'RENDERS' ? (
          renders.length === 0 ? <div className="col-span-2 py-20 text-center opacity-30 font-black uppercase text-[10px]">Sem renders realizados.</div> :
          renders.map((img: any, i: number) => (
            <div key={i} className="group relative aspect-square bg-zinc-200 rounded-[1.8rem] overflow-hidden shadow-xl border-4 border-white cursor-pointer" onClick={() => setSelectedImage(img.url)}>
              <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] font-black text-orange-500 uppercase truncate">{img.title}</p>
                <p className="text-[6px] text-white font-bold uppercase">{img.mode}</p>
              </div>
            </div>
          ))
        ) : (
          dnaPhotos.length === 0 ? <div className="col-span-2 py-20 text-center opacity-30 font-black uppercase text-[10px]">Sem fotos de origem.</div> :
          dnaPhotos.map((img: any, i: number) => (
            <div key={i} className="group relative aspect-square bg-zinc-200 rounded-[1.8rem] overflow-hidden shadow-xl border-4 border-white cursor-pointer" onClick={() => setSelectedImage(img.url)}>
              <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-2 right-2"><ImageIcon size={14} className="text-white/50" /></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// [4. WORKSHOP MASTER]
// ============================================================================

const WorkshopInner = () => {
  const { state, dispatch, financeiro, activeModal, setActiveModal, notify, industrialRates, setSelectedImage } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.messages]);

  const handlePipeline = async (text: string, attachment?: Attachment) => {
    if (!text && !attachment) return;
    const userMsg: Message = { id: `u-${Date.now()}`, type: MessageType.USER, content: text || "Análise de Mídia", timestamp: new Date(), attachment, status: 'sent' };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    setInputText("");
    const iaraId = `i-${Date.now()}`;
    dispatch({ type: 'ADD_MESSAGE', payload: { id: iaraId, type: MessageType.IARA, content: "YARA 3.0: Orquestrando DNA Industrial...", timestamp: new Date(), status: 'processing', progressiveSteps: { parsed: false, render: false, pricing: false, cutPlan: false } } });
    try {
      const parts: any[] = [{ text: text || "Extrair DNA." }];
      if (attachment?.data) parts.push({ inlineData: { mimeType: 'image/jpeg', data: attachment.data } });
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ parts }], config: { systemInstruction: IARA_SYSTEM_PROMPT, responseMimeType: "application/json" } });
      const parsed = YaraParsers.extractJSON(res.text || '')?.project;
      if (!parsed) throw new Error("Falha no DNA Parsing.");
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: parsed, stepUpdate: { parsed: true } });
      
      const pricing = PricingEngine.calculate(parsed, industrialRates);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { pricing }, stepUpdate: { pricing: true } });

      const render = await RenderEngine.generate(parsed, attachment?.data);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { render }, stepUpdate: { render: true, cutPlan: true } });
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Engenharia Master concluída com sucesso.", status: 'done' } });
      notify("🚀 DNA Orquestrado!");
    } catch (e: any) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: e.message, status: 'error' } });
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden relative font-sans text-left">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-white sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative border-black sm:border-[10px]">
        <header className="bg-black pt-14 pb-8 px-8 flex items-center justify-between text-white z-30 shrink-0 border-b border-orange-600/10 backdrop-blur-md">
          <div className="flex items-center gap-5">
            <LogoSVG size={54} />
            <div className="flex flex-col">
              <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500 italic leading-none mb-1">MARCENAPP SUPREME</h1>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">v283 MASTER RECALL</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveModal('IARA')} className="p-3 bg-white/5 rounded-xl text-orange-500 border border-white/5 hover:bg-white/10" title="Projetos"><FolderOpen size={18} /></button>
            <button onClick={() => setActiveModal('ADMIN')} className="p-3 bg-white/5 rounded-xl text-orange-500 border border-white/5 hover:bg-white/10" title="Admin"><LayoutDashboard size={18} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-12 bg-[#fdfdfd] custom-scrollbar pb-36">
          {state.messages.map((msg: Message) => (
            <ChatMessage key={msg.id} msg={msg} onImageClick={setSelectedImage} />
          ))}
        </main>

        <footer className="bg-white/95 backdrop-blur-3xl px-5 py-5 border-t border-zinc-100 flex items-center gap-3 z-50 pb-9 sm:pb-7 shrink-0 shadow-2xl">
          <button onClick={() => setActiveModal('BENTO')} className="w-14 h-14 flex items-center justify-center rounded-[1.2rem] bg-orange-600 text-white shadow-xl active:scale-90" title="Engenharia">
            <Wrench size={22} />
          </button>
          <div className="flex-1 bg-zinc-100 rounded-[1.2rem] flex items-center px-4 py-2 border border-zinc-200 shadow-inner focus-within:bg-white transition-all">
            <input type="text" placeholder="Dite comando ou envie DNA..." className="w-full text-[13px] outline-none bg-transparent py-2 font-bold placeholder-zinc-400" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} />
            <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-2.5" title="Acessar Galeria do Celular">
              <LucideImage size={22} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => handlePipeline("", { type: 'image', url: URL.createObjectURL(file), data: (ev.target?.result as string).split(',')[1] });
                reader.readAsDataURL(file);
              }
            }} />
          </div>
          <button className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-2xl transition-all ${inputText.trim() ? 'bg-orange-600 text-white' : 'bg-black text-white'}`} onClick={() => inputText.trim() && handlePipeline(inputText)}>
            {inputText.trim() ? <Send size={24}/> : <Mic size={24}/>}
          </button>
        </footer>
      </div>

      <Drawer id="BENTO" title="Engenharia Bento" color="bg-orange-600" icon={Wrench}><p className="text-xs opacity-50 font-black uppercase tracking-widest py-20">Módulos de Engenharia v283</p></Drawer>
      <Drawer id="IARA" title="Galeria Master" color="bg-purple-600" icon={LucideImage}><IaraVisionBancada /></Drawer>
      <Drawer id="ADMIN" title="Cockpit Master" color="bg-black" icon={BarChart3}>
        <div className="space-y-4">
           <div className="p-6 bg-blue-50 rounded-3xl text-left border border-blue-100">
             <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest italic mb-1">Venda Industrial</p>
             <h3 className="text-3xl font-black text-blue-900 tracking-tighter italic">R$ {financeiro.venda.toLocaleString('pt-BR')}</h3>
           </div>
        </div>
      </Drawer>

      {state.selectedImage && (
        <div className="fixed inset-0 z-[130000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6" onClick={() => setSelectedImage(null)}>
          <img src={state.selectedImage} className="max-w-full max-h-[85vh] rounded-[3rem] shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-10 right-10">
            <button className="p-7 bg-white text-orange-600 rounded-full shadow-2xl flex items-center justify-center" onClick={() => setSelectedImage(null)}><X size={40}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatMessage: React.FC<{ msg: Message; onImageClick: (url: string) => void }> = ({ msg, onImageClick }) => {
  const isUser = msg.type === MessageType.USER;
  const project = msg.project;
  const steps = msg.progressiveSteps || { parsed: false, render: false, pricing: false, cutPlan: false };
  const { reRender } = useContext(MarcenaContext);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
      <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm text-[13px] relative ${isUser ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none'}`}>
        {msg.attachment?.type === 'image' && (
          <img src={msg.attachment.url} className="w-full rounded-[1.5rem] mb-4 cursor-pointer" onClick={() => onImageClick(msg.attachment!.url)} />
        )}
        <div className="text-left font-medium">{msg.content}</div>
        {!isUser && msg.status === 'processing' && (
          <div className="mt-4 space-y-2">
            <ProgressStep label="Extração DNA" active={!steps.parsed} done={steps.parsed} />
            <ProgressStep label="Materialização AI" active={steps.parsed && !steps.render} done={steps.render} />
          </div>
        )}
        {project && msg.status === 'done' && (
          <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-[2rem] overflow-hidden text-left text-zinc-900 shadow-inner">
             <div className="bg-black p-6 text-white flex justify-between items-center">
               <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic truncate">{project.title}</span>
               <Award size={18} className="text-orange-500" />
             </div>
             <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <img src={project.render.faithfulUrl} className="aspect-square object-cover rounded-2xl cursor-pointer border-2 border-white shadow-sm" onClick={() => onImageClick(project.render.faithfulUrl!)} title="DNA Fiel" />
                  <img src={project.render.decoratedUrl} className="aspect-square object-cover rounded-2xl cursor-pointer border-2 border-white shadow-sm" onClick={() => onImageClick(project.render.decoratedUrl!)} title="AD Showroom" />
                </div>
                {/* Modos de Render visíveis no chat */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {['Industrial CAD', 'Architectural Digest Style', 'Sketch Fiel'].map(s => (
                    <button key={s} onClick={() => reRender(msg.id, s)} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-[7px] font-black uppercase tracking-widest text-zinc-500 hover:border-orange-500 hover:text-orange-600 transition-all active:scale-95 shadow-xs">
                      {s.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-end pt-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-zinc-400 italic">Preço Industrial</span>
                    <span className="text-2xl font-black italic tracking-tighter">R$ {project.pricing.finalPrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <button className="w-12 h-12 bg-black text-orange-500 rounded-2xl flex items-center justify-center shadow-lg active:scale-90"><MessageSquare size={20}/></button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// [5. APP ROOT]
// ============================================================================

const App: React.FC = () => {
  const [state, dispatch] = useReducer(marcenaReducer, { messages: [{ id: 'w', type: MessageType.IARA, content: 'Cockpit MarcenApp Supreme v283 Online.', timestamp: new Date(), status: 'done' }], isLoading: false, isAdminMode: false });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [industrialRates, setIndustrialRates] = useState({ mdf: MDF_SHEET_PRICE, markup: 1.4 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const financeiro = useMemo(() => {
    const totalVenda = state.messages.reduce((acc, m) => acc + (m.project?.pricing?.finalPrice || 0), 0);
    return { venda: totalVenda };
  }, [state.messages]);

  const notify = (text: string) => {
    const t = document.createElement('div');
    t.className = "fixed top-32 left-1/2 -translate-x-1/2 z-[200000] bg-black text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl animate-in fade-in zoom-in italic";
    t.innerText = text; document.body.appendChild(t);
    setTimeout(() => { t.classList.add('animate-out', 'fade-out'); setTimeout(() => t.remove(), 300); }, 3000);
  };

  const reRender = async (msgId: string, style: string) => {
    const msg = state.messages.find(m => m.id === msgId);
    if (!msg?.project) return;
    notify(`🎨 Render: ${style}...`);
    try {
      const render = await RenderEngine.generate(msg.project, msg.attachment?.data, style);
      dispatch({ type: 'PROGRESS_UPDATE', id: msgId, payload: { render }, stepUpdate: { render: true } });
      notify("✅ Sucesso!");
    } catch (e) { notify("❌ Erro."); }
  };

  return (
    <MarcenaContext.Provider value={{ state, dispatch, financeiro, activeModal, setActiveModal, industrialRates, setIndustrialRates, notify, selectedImage, setSelectedImage, reRender }}>
      <WorkshopInner />
    </MarcenaContext.Provider>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
