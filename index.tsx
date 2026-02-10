
import React, { useState, useRef, useEffect, useReducer, createContext, useContext, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Wrench, X, Mic, Award, Image as LucideImage, Camera, Send, 
  BarChart3, FolderOpen, LayoutDashboard, MessageSquare, 
  Download, Share2, Loader2, CheckCheck, Paperclip, Plus,
  DollarSign, HardHat, Users, TrendingUp, Calendar, AlertTriangle,
  RotateCcw, Trash2, FileSignature, Cpu, Package, ChevronRight
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
  MDF_SHEET_AREA
} from './constants';

// ============================================================================
// [0. MOTOR YARA - ORQUESTRADOR INDUSTRIAL]
// ============================================================================

const YaraEngine = {
  // Fix: Create GoogleGenAI right before making an API call to ensure fresh environment variable access.
  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: text || "Analisar projeto de marcenaria industrial." }];
    if (attachment?.data) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: attachment.data } });
    }

    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts }],
        config: { 
          systemInstruction: IARA_SYSTEM_PROMPT, 
          responseMimeType: "application/json" 
        }
      });

      const data = JSON.parse(res.text || "{}");
      const project = data.project || data;

      return {
        projectId: `YARA-${Date.now()}`,
        title: project.title || "Novo Projeto Supreme",
        description: project.description || "",
        environment: project.environment || { width: 0, height: 0, depth: 0 },
        modules: (project.modules || []).map((m: any, idx: number) => ({
          ...m,
          id: m.id || `m${idx + 1}`
        })),
        complexity: project.complexity || 1,
        source: { type: attachment ? 'image' : 'text', content: text, attachmentUrl: attachment?.url },
        render: { status: 'pending' },
        pricing: { status: 'pending', materials: [], total: 0, labor: 0, finalPrice: 0, creditsUsed: 15 },
        cutPlan: { status: 'pending', boards: [], optimizationScore: 0 }
      };
    } catch (e) { return null; }
  },

  // Fix: Handle mandatory API key selection for Gemini 3 Pro Image model and re-initialize AI client.
  generateRender: async (project: ProjectData, sketchData?: string, style: string = 'Architectural Digest Style'): Promise<{ faithful: string, decorated: string }> => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // Assume success after trigger to avoid race condition as per guidelines.
      }
    }

    const gen = async (prompt: string, ref?: string) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [];
      if (ref) parts.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
      parts.push({ text: prompt });
      try {
        const res = await ai.models.generateContent({ 
          model: 'gemini-3-pro-image-preview', 
          contents: [{ parts }],
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
        });
        const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : '';
      } catch (e: any) {
        // Fix: Reset key selection if entity not found error occurs.
        if (e.message?.includes("Requested entity was not found") && typeof window !== 'undefined' && (window as any).aistudio) {
          await (window as any).aistudio.openSelectKey();
        }
        return '';
      }
    };

    const faithfulPrompt = `DNA INDUSTRIAL FIEL 1:1. Mobiliário: ${project.title}. Materiais: ${project.modules.map(m => m.material).join(', ')}. Estilo catálogo técnico, fundo neutro, iluminação de estúdio.`;
    const decoratedPrompt = `${style} MASTERPIECE. Fotografia profissional de interiores, iluminação natural, staging de luxo. Preserve o layout original.`;

    const [faithful, decorated] = await Promise.all([
      gen(faithfulPrompt, sketchData),
      gen(decoratedPrompt, sketchData)
    ]);

    return { faithful, decorated };
  }
};

// ============================================================================
// [1. ESTADO GLOBAL & LOGICA FINANCEIRA]
// ============================================================================

const MarcenaContext = createContext<any>(null);

const marcenaReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE': return { ...state, messages: state.messages.map((m:any) => m.id === action.id ? { ...m, ...action.payload } : m) };
    case 'PROGRESS_UPDATE': return { ...state, messages: state.messages.map((m:any) => m.id === action.id ? { ...m, project: { ...(m.project || {}), ...action.payload }, progressiveSteps: { ...(m.progressiveSteps || {}), ...action.stepUpdate } } : m) };
    case 'ADD_PART': return { ...state, manualParts: [...state.manualParts, action.payload] };
    case 'REMOVE_PART': return { ...state, manualParts: state.manualParts.filter((p:any) => p.id !== action.id) };
    case 'SET_RATES': return { ...state, industrialRates: { ...state.industrialRates, ...action.payload } };
    case 'ADD_CLIENT': return { ...state, clients: [action.payload, ...state.clients] };
    default: return state;
  }
};

// ============================================================================
// [2. BANCADAS (MODULOS DE ESPECIALIDADE)]
// ============================================================================

const BentoBancada = () => {
  const { state, dispatch, notify } = useContext(MarcenaContext);
  const [newP, setNewP] = useState({ n: '', w: '', h: '', q: 1 });
  
  // Extrai peças de todos os projetos ativos na conversa
  const iaParts = useMemo(() => {
    return state.messages
      .filter((m: any) => m.project && m.status === 'done')
      .flatMap((m: any) => m.project.modules.map((mod: any) => ({
        name: mod.type,
        dims: `${mod.dimensions.w}x${mod.dimensions.h}`,
        qty: 1
      })));
  }, [state.messages]);

  return (
    <div className="space-y-6 text-zinc-900">
      <div className="bg-white border-2 border-orange-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Engenharia IA</span>
            <h3 className="text-xl font-black italic">Peças Orquestradas</h3>
          </div>
          <Cpu size={24} />
        </div>
        <div className="p-4">
          <table className="w-full text-left text-[12px]">
            <tbody className="divide-y text-zinc-900">
              {iaParts.map((p: any, i: number) => (
                <tr key={i}><td className="p-3 font-bold uppercase">{p.name}</td><td className="p-3 text-orange-700 font-mono text-center">{p.dims}</td><td className="p-3 font-black text-center">{p.qty}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-orange-200 space-y-5">
        <h3 className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Acréscimo Manual</h3>
        <input placeholder="Descrição" className="w-full p-4 bg-zinc-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500" value={newP.n} onChange={e => setNewP({...newP, n: e.target.value})} />
        <div className="flex gap-3">
          <input type="number" placeholder="L" className="w-full p-4 bg-zinc-50 rounded-2xl font-bold" value={newP.w} onChange={e => setNewP({...newP, w: e.target.value})} />
          <input type="number" placeholder="H" className="w-full p-4 bg-zinc-50 rounded-2xl font-bold" value={newP.h} onChange={e => setNewP({...newP, h: e.target.value})} />
          <input type="number" placeholder="Q" className="w-20 p-4 bg-zinc-50 rounded-2xl font-bold" value={newP.q} onChange={e => setNewP({...newP, q: Number(e.target.value)})} />
        </div>
        <button onClick={() => { if(Number(newP.w) > 0) { dispatch({ type: 'ADD_PART', payload: { ...newP, id: Date.now() } }); setNewP({n:'',w:'',h:'',q:1}); notify("PEÇA ADICIONADA"); } }} className="w-full bg-orange-600 text-white py-5 rounded-[2rem] font-black shadow-lg hover:bg-orange-700 transition-all active:scale-95">REGISTRAR NA BANCADA</button>
        {state.manualParts.map((p:any) => (
          <div key={p.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <span className="text-xs font-bold uppercase">{p.n || "Item"}</span>
            <span className="text-xs font-mono">{p.w}x{p.h}</span>
            <button onClick={() => dispatch({ type: 'REMOVE_PART', id: p.id })} className="text-red-400 p-2"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const EstelaBancada = () => {
  const { financeiro, state, dispatch, notify } = useContext(MarcenaContext);
  return (
    <div className="space-y-6">
      <div className={`p-10 rounded-[3rem] border-l-[15px] shadow-2xl transition-all ${financeiro.lucro < 1000 ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-zinc-400 mb-1 tracking-widest">Lucro Estimado</p>
            <h3 className={`text-5xl font-black italic tracking-tighter ${financeiro.lucro < 1000 ? 'text-red-600' : 'text-green-600'}`}>R$ {financeiro.lucro.toLocaleString('pt-BR')}</h3>
          </div>
          <TrendingUp className={financeiro.lucro < 1000 ? 'text-red-400' : 'text-green-400'} size={48} />
        </div>
      </div>
      <div className="p-10 bg-zinc-900 rounded-[3rem] text-center">
        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.4em] mb-3">Faturamento Master</p>
        <h2 className="text-6xl font-black text-white italic tracking-tighter">R$ {financeiro.venda.toLocaleString('pt-BR')}</h2>
      </div>
      <div className="p-8 bg-white border-2 border-zinc-100 rounded-[2.5rem] space-y-5">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">Markup de Obra Industrial</label>
        <div className="flex items-center gap-6">
          <input type="range" min="1.1" max="4" step="0.1" className="flex-1 accent-orange-600" value={state.industrialRates.markup} onChange={(e)=>dispatch({ type: 'SET_RATES', payload: { markup: Number(e.target.value) } })} />
          <span className="bg-zinc-900 text-white px-5 py-3 rounded-2xl font-black text-sm italic">{state.industrialRates.markup}x</span>
        </div>
      </div>
      <button onClick={() => notify("📄 CONTRATO SUPREME GERADO!")} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-4 active:scale-95 shadow-xl transition-all"><FileSignature size={24} /> Gerar PDF de Contrato</button>
    </div>
  );
};

// ============================================================================
// [3. UI SUPREME CONSOLIDADA]
// ============================================================================

const LogoSVG = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="black" />
    <circle cx="50" cy="22" r="7.5" fill="#D97706" />
    <path d="M22 75V34H39L50 54L61 34H78V75" stroke="white" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    <rect x="22" y="86" width="56" height="5" fill="#D97706" />
  </svg>
);

const Drawer = ({ id, title, color, icon, children }: any) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[120000] flex justify-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-[480px] h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        <header className={`${color} p-10 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-[1.4rem] backdrop-blur-md border border-white/20 shadow-xl">{React.createElement(icon, { size: 30 })}</div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none">MarcenApp Supreme</span>
              <h2 className="text-2xl font-black uppercase tracking-widest italic leading-none mt-1.5">{title}</h2>
            </div>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-5 bg-white text-orange-600 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center border-2 border-orange-600/10 active:scale-90">
            <X size={34} strokeWidth={3} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// [4. WORKSHOP MASTER]
// ============================================================================

const WorkshopInner = () => {
  const { state, dispatch, financeiro, setActiveModal, notify, selectedImage, setSelectedImage } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.messages]);

  const handlePipeline = async (text: string, attachment?: Attachment) => {
    if (!text && !attachment) return;
    const userMsgId = `u-${Date.now()}`;
    dispatch({ type: 'ADD_MESSAGE', payload: { id: userMsgId, type: MessageType.USER, content: text || "Análise Multimodal", timestamp: new Date(), attachment, status: 'sent' } });
    setInputText("");
    
    const iaraId = `i-${Date.now()}`;
    dispatch({ type: 'ADD_MESSAGE', payload: { id: iaraId, type: MessageType.IARA, content: "YARA 3.0: Orquestrando DNA industrial...", timestamp: new Date(), status: 'processing', progressiveSteps: { parsed: false, render: false, pricing: false, cutPlan: false } } });

    try {
      const project = await YaraEngine.processInput(text, attachment);
      if (!project) throw new Error("DNA Error");
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: project, stepUpdate: { parsed: true } });
      
      const render = await YaraEngine.generateRender(project, attachment?.data);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { render: { ...render, status: 'done' } }, stepUpdate: { render: true, pricing: true, cutPlan: true } });
      
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Orquestração Supreme finalizada.", status: 'done' } });
      notify("🚀 PROJETO MATERIALIZADO");
    } catch (e: any) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Falha na orquestração.", status: 'error' } });
    }
  };

  const BANCADAS = [
    { id: 'BENTO', title: 'Engenharia Bento', color: 'bg-orange-600', icon: Wrench },
    { id: 'ESTELA', title: 'Financeiro Estela', color: 'bg-emerald-600', icon: DollarSign },
    { id: 'CRM', title: 'Gestão de Leads', color: 'bg-blue-600', icon: Users },
    { id: 'ADMIN', title: 'Dashboard Master', color: 'bg-black', icon: BarChart3 }
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden relative font-sans">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-[#e5ddd5] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative border-black sm:border-[12px] transition-all duration-700">
        
        {/* HEADER SUPREME */}
        <header className="bg-black pt-14 pb-5 px-7 flex items-center justify-between text-white z-30 shrink-0 shadow-lg relative">
          <div className="flex items-center gap-5">
            <LogoSVG size={54} />
            <div className="flex flex-col text-left">
              <h1 className="text-[17px] font-black uppercase tracking-[0.1em] text-orange-500 italic leading-none mb-1.5">MARCENAPP</h1>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" /> online
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setActiveModal('IARA')} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all text-orange-500 bg-white/5"><FolderOpen size={22} /></button>
            <button onClick={() => setActiveModal('ADMIN')} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all text-orange-500 bg-white/5"><LayoutDashboard size={22} /></button>
          </div>
        </header>

        {/* CHAT AREA */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:400px_auto]">
          {state.messages.map((msg: any) => (
             <div key={msg.id} className={`flex w-full ${msg.type === MessageType.USER ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
               <div className={`max-w-[85%] relative flex flex-col ${msg.type === MessageType.USER ? 'items-end' : 'items-start'}`}>
                 <div className={`p-3 rounded-2xl shadow-md text-left ${msg.type === MessageType.USER ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none border border-zinc-100'}`}>
                    {msg.attachment?.type === 'image' && <img src={msg.attachment.url} className="w-full rounded-xl mb-2 max-h-60 object-cover cursor-pointer" onClick={() => setSelectedImage(msg.attachment.url)} />}
                    <div className="text-[15px] text-zinc-900">{msg.content}</div>
                    <div className="flex justify-end mt-1 opacity-50"><span className="text-[9px] font-bold">12:00</span></div>
                 </div>
                 {msg.project && msg.status === 'done' && (
                   <div className="mt-4 bg-white border-2 border-orange-600/20 rounded-[3rem] overflow-hidden text-left shadow-2xl w-full max-w-[320px] animate-in zoom-in border-b-[10px] border-orange-600">
                     <div className="bg-black p-5 text-white flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-widest text-orange-500 italic">{msg.project.title}</span><Award size={20} className="text-orange-500"/></div>
                     <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <img src={msg.project.render.faithfulUrl} className="aspect-square object-cover rounded-[1.5rem] border border-zinc-100 cursor-pointer" onClick={() => setSelectedImage(msg.project.render.faithfulUrl)} />
                          <img src={msg.project.render.decoratedUrl} className="aspect-square object-cover rounded-[1.5rem] border border-zinc-100 cursor-pointer" onClick={() => setSelectedImage(msg.project.render.decoratedUrl)} />
                        </div>
                        <div className="flex justify-between items-end pt-3 border-t border-zinc-50">
                          <div className="flex flex-col"><span className="text-[9px] font-black uppercase text-zinc-400">Orçamento</span><span className="text-2xl font-black text-zinc-900">R$ {msg.project.pricing?.finalPrice?.toLocaleString('pt-BR') || '---'}</span></div>
                          <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚀 Projeto ${msg.project.title} pronto!`)}`)} className="w-12 h-12 bg-black text-orange-500 rounded-2xl flex items-center justify-center shadow-lg active:scale-90"><MessageSquare size={20}/></button>
                        </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          ))}
        </main>

        {/* FOOTER SUPREME */}
        <footer className="bg-[#f0f0f0] px-5 py-5 flex items-center gap-3 z-50 shrink-0 pb-12 sm:pb-8 border-t border-zinc-200/50 backdrop-blur-xl">
          <div className="relative">
            <button onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)} className={`w-13 h-13 flex items-center justify-center rounded-2xl transition-all shadow-xl active:scale-90 ${isToolsMenuOpen ? 'bg-zinc-800 rotate-45 text-white shadow-none' : 'bg-orange-600 text-white shadow-orange-500/30'}`}>
              <Plus size={28} />
            </button>
            {isToolsMenuOpen && (
              <div className="absolute bottom-16 left-0 w-64 bg-black border border-white/10 rounded-[2.5rem] shadow-2xl p-3 flex flex-col gap-2 animate-in slide-in-from-bottom-5 z-[200]">
                {BANCADAS.map(tool => (
                  <button key={tool.id} onClick={() => { setActiveModal(tool.id); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-3xl transition-all text-left">
                    <div className={`p-2.5 rounded-xl ${tool.color} text-white`}>{React.createElement(tool.icon, { size: 20 })}</div>
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">{tool.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 bg-white rounded-full flex items-center px-6 py-2 shadow-sm border border-zinc-200 focus-within:ring-4 ring-orange-500/10">
            <input type="text" placeholder="Comando Industrial" className="flex-1 text-[16px] outline-none bg-transparent py-3 text-zinc-800 placeholder-zinc-400 font-medium" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} />
            <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-2.5 transition-transform active:scale-125"><Camera size={28} /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => handlePipeline("", { type: 'image', url: URL.createObjectURL(file), data: (ev.target?.result as string).split(',')[1] });
                reader.readAsDataURL(file);
              }
            }} />
          </div>
          <button className="w-14 h-14 rounded-full flex items-center justify-center bg-orange-600 text-white shadow-xl hover:bg-orange-500 active:scale-90" onClick={() => inputText.trim() && handlePipeline(inputText)}>
            {inputText.trim() ? <Send size={26} className="ml-1"/> : <Mic size={28}/>}
          </button>
        </footer>
      </div>

      {/* GAVETAS INTEGRADAS */}
      <Drawer id="BENTO" title="Engenharia Bento" color="bg-orange-600" icon={Wrench}><BentoBancada /></Drawer>
      <Drawer id="ESTELA" title="Financeiro Estela" color="bg-emerald-600" icon={DollarSign}><EstelaBancada /></Drawer>
      <Drawer id="IARA" title="Galeria Master" color="bg-purple-600" icon={LucideImage}>
        <div className="grid grid-cols-2 gap-4">
          {state.messages.filter((m:any)=>m.project && m.status==='done').map((m:any)=>(
            <div key={m.id} className="space-y-2 group cursor-pointer" onClick={()=>setSelectedImage(m.project.render.faithfulUrl)}>
              <div className="aspect-square overflow-hidden rounded-[2rem] border-2 border-zinc-100 shadow-sm transition-transform group-hover:scale-105">
                <img src={m.project.render.faithfulUrl} className="w-full h-full object-cover" />
              </div>
              <p className="text-[9px] font-black uppercase text-zinc-600">{m.project.title}</p>
            </div>
          ))}
        </div>
      </Drawer>
      <Drawer id="CRM" title="Gestão de Leads" color="bg-blue-600" icon={Users}>
         <div className="space-y-4">
            <button onClick={()=>notify("CRM: Novo Lead Criado")} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95"><Plus size={18}/> Novo Cliente</button>
            {state.clients.map((c:any)=>(
              <div key={c.id} className="p-6 bg-white border border-zinc-100 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                <div className="text-left"><p className="text-[11px] font-black uppercase text-zinc-400 mb-1">{c.status}</p><h4 className="text-lg font-black text-zinc-900 leading-none">{c.name}</h4></div>
                {/* Fix: ChevronRight was missing from imports. Added now. */}
                <div className="bg-zinc-100 p-3 rounded-2xl text-blue-600"><ChevronRight size={20}/></div>
              </div>
            ))}
         </div>
      </Drawer>
      <Drawer id="ADMIN" title="Cockpit Master" color="bg-black" icon={BarChart3}>
        <div className="space-y-6">
           <div className="p-10 bg-blue-50 rounded-[3rem] text-left border border-blue-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 blur-3xl rounded-full" />
             <p className="text-[11px] font-black uppercase text-blue-400 tracking-[0.3em] mb-3 leading-none">Total Faturado</p>
             <h3 className="text-5xl font-black text-blue-900 tracking-tighter italic">R$ {financeiro.venda.toLocaleString('pt-BR')}</h3>
           </div>
           <div className="p-10 bg-green-50 rounded-[3rem] text-left border border-green-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 blur-3xl rounded-full" />
             <p className="text-[11px] font-black uppercase text-green-400 tracking-[0.3em] mb-3 leading-none">Lucro Bruto</p>
             <h3 className="text-5xl font-black text-green-900 tracking-tighter italic">R$ {financeiro.lucro.toLocaleString('pt-BR')}</h3>
           </div>
        </div>
      </Drawer>

      {/* FULLSCREEN PREVIEW */}
      {selectedImage && (
        <div className="fixed inset-0 z-[140000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-[85vh] rounded-[4rem] shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-12 right-12">
            <button className="p-9 bg-white text-orange-600 rounded-full shadow-2xl hover:scale-110 active:scale-90 border-[6px] border-orange-600/10" onClick={() => setSelectedImage(null)}>
              <X size={54} strokeWidth={4} />
            </button>
          </div>
          <div className="mt-14 flex gap-10">
             <button className="px-14 py-6 bg-white/5 text-white rounded-full font-black uppercase text-[12px] tracking-[0.5em] border border-white/10 flex items-center gap-4 backdrop-blur-xl hover:bg-white/10" onClick={(e) => e.stopPropagation()}><Download size={22}/> Salvar</button>
             <button className="px-14 py-6 bg-orange-600 text-white rounded-full font-black uppercase text-[12px] tracking-[0.5em] flex items-center gap-4 shadow-xl" onClick={(e) => e.stopPropagation()}><Share2 size={22}/> Compartilhar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// [5. APP ENTRY POINT]
// ============================================================================

const App: React.FC = () => {
  const [state, dispatch] = useReducer(marcenaReducer, { 
    messages: [{ id: 'welcome', type: MessageType.IARA, content: 'MARCENAPP SUPREME v283 ONLINE. Orquestre sua fábrica agora.', timestamp: new Date(), status: 'done' }], 
    manualParts: [],
    industrialRates: { mdf: MDF_SHEET_PRICE, markup: 1.8 },
    clients: [{ id: 1, name: 'Exemplo Master', status: 'Orçamento', updatedAt: Date.now() }]
  });
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const financeiro = useMemo(() => {
    let totalArea = 0;
    // Soma peças da IA (de todas as mensagens com projeto)
    state.messages.forEach((m:any) => {
      if (m.project && m.status === 'done') {
        m.project.modules.forEach((mod:any) => {
          totalArea += (mod.dimensions.w * mod.dimensions.h) / 1000000;
        });
      }
    });
    // Soma peças manuais
    state.manualParts.forEach((p:any) => {
      totalArea += (Number(p.w) * Number(p.h) * Number(p.q || 1)) / 1000000;
    });

    const mdfCost = (totalArea * (state.industrialRates.mdf / 5)) || 0;
    const totalCost = mdfCost * 1.35;
    const venda = totalCost * state.industrialRates.markup;
    return { venda, lucro: venda - totalCost, area: totalArea, chapas: Math.ceil(totalArea / (MDF_SHEET_AREA * 0.85)) };
  }, [state.messages, state.manualParts, state.industrialRates]);

  const notify = (text: string) => {
    const t = document.createElement('div');
    t.className = "fixed top-36 left-1/2 -translate-x-1/2 z-[200000] bg-black text-white px-14 py-7 rounded-full font-black text-[12px] uppercase tracking-[0.5em] shadow-2xl animate-in italic border border-orange-500/30 text-center backdrop-blur-md";
    t.innerText = text; document.body.appendChild(t);
    setTimeout(() => { t.classList.add('animate-out', 'fade-out'); setTimeout(() => t.remove(), 400); }, 3000);
  };

  return (
    <MarcenaContext.Provider value={{ state, dispatch, financeiro, activeModal, setActiveModal, notify, selectedImage, setSelectedImage }}>
      <WorkshopInner />
    </MarcenaContext.Provider>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
