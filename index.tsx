
import React, { useState, useRef, useEffect, useReducer, createContext, useContext, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Wrench, DollarSign, Eye, HardHat, X, Mic, Calendar,
  TrendingUp, Users, RotateCcw, Rotate3d, Package, FileSignature, 
  CheckCircle, ArrowUpRight, Cpu, Menu, Award, PlayCircle, 
  Image as LucideImage, Camera, Send, Trash2, AlertTriangle, BarChart3,
  Plus, Search, Filter, ClipboardList, Hammer, Zap, UserPlus,
  ChevronRight, Smartphone, LayoutDashboard, MessageSquare, Download, Share2, Loader2
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

// ============================================================================
// [0. UTILITÁRIOS - YARA RUBI PARSERS]
// ============================================================================

const YaraParsers = {
  extractJSON: (text: string) => {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.project || parsed;
    } catch (e) {
      return null;
    }
  },

  parseVoice: async (audioBase64: string): Promise<string> => {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        contents: [{
          parts: [
            { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
            { text: "Você é a YARA RUBI. Transcreva este áudio focando em medidas de marcenaria e materiais técnicos." }
          ]
        }]
      });
      return res.text || "";
    } catch (e) {
      throw new Error("Erro na escuta Rubi.");
    }
  },

  calculateTotalArea: (modules: Module[]) => {
    return modules.reduce((acc, m) => acc + (m.dimensions.w * m.dimensions.h) / 1000000, 0);
  }
};

// ============================================================================
// [1. ENGINES DE PRODUÇÃO]
// ============================================================================

const PricingEngine = {
  calculate: (project: Partial<ProjectData>, industrialRates: { mdf: number; markup: number }) => {
    const modules = project.modules || [];
    const area = YaraParsers.calculateTotalArea(modules);
    const weightedCost = modules.reduce((acc, m: any) => acc + ((m.dimensions.w * m.dimensions.h) / 1000000 * industrialRates.mdf), 0);
    const materialCost = Math.ceil(weightedCost / (MDF_SHEET_AREA * 0.85)) * industrialRates.mdf;
    const labor = area * LABOR_RATE_M2;
    const finalPrice = (materialCost + labor) * 1.30 * 1.12 * industrialRates.markup;
    return { status: 'done' as const, finalPrice, total: materialCost + labor };
  }
};

const RenderEngine = {
  generate: async (project: Partial<ProjectData>, sketchData?: string) => {
    const gen = async (prompt: string, ref?: string) => {
      const parts: any[] = [];
      if (ref) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: ref
          }
        });
      }
      parts.push({ text: prompt });
      
      const res = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents: [{ parts }],
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });
      
      const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    };

    // Prompt Refatorado: Fiel 1:1 baseado no rascunho
    const faithfulPrompt = `ACT AS A SENIOR WOODWORKING ENGINEER. Materialize this EXACT sketch as a technical 3D CAD render. 
      You MUST maintain 1:1 proportions, layout, and structural details from the provided reference image. 
      Material: 18mm MDF with realistic grain. Lighting: Clean studio lighting with soft shadows. 
      Background: Solid white. Perspective: Isometric or perspective as seen in the sketch. 
      ENGINEERING ACCURACY IS CRITICAL. Do not invent parts, follow the sketch lines exactly.`;

    // Prompt Refatorado: Architectural Digest Style (Decorado)
    const decoratedPrompt = `ACT AS A WORLD-CLASS ARCHITECTURAL PHOTOGRAPHER FOR ARCHITECTURAL DIGEST. 
      Create a hyper-realistic, high-end interior photography of the custom furniture from the sketch. 
      CONTEXT: Integrated into a luxury minimalist penthouse in São Paulo. 
      LIGHTING: Natural, soft morning sunlight through large panoramic windows, creating subtle cinematic shadows and depth. 
      COMPOSITION: Professional architectural wide-angle lens, low-angle perspective, balanced composition. 
      STYLING: Impeccable minimalist decor, with deep RUBY RED (#e11d48) luxury accents in textiles or lighting to match the 'Yara Rubi' brand. 
      QUALITY: 8k resolution, photorealistic textures (wood, stone, glass), sharp focus.`;

    const [faithful, decorated] = await Promise.all([
      gen(faithfulPrompt, sketchData),
      gen(decoratedPrompt, sketchData)
    ]);
    
    return { status: 'done' as const, faithfulUrl: faithful, decoratedUrl: decorated };
  }
};

// ============================================================================
// [2. CORE STATE & CONTEXT]
// ============================================================================

const marcenaReducer = (state: MarcenaState, action: any): MarcenaState => {
  switch (action.type) {
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE': return { ...state, messages: state.messages.map(m => (m.id === action.id ? { ...m, ...action.payload } : m)) };
    case 'PROGRESS_UPDATE': return { ...state, messages: state.messages.map(m => (m.id === action.id ? { ...m, project: { ...(m.project || {}), ...action.payload } as ProjectData, progressiveSteps: { ...(m.progressiveSteps || {}), ...action.stepUpdate } as any } : m)) };
    default: return state;
  }
};

const MarcenaContext = createContext<any>(null);

// ============================================================================
// [3. UI COMPONENTS - NOIR & RUBI]
// ============================================================================

const QuickVisionRail = () => {
  const { state, setSelectedImage } = useContext(MarcenaContext);
  const gallery = state.messages
    .filter((m: any) => m.project?.render?.status === 'done')
    .flatMap((m: any) => [m.project.render.faithfulUrl, m.project.render.decoratedUrl])
    .filter(Boolean).slice(-8).reverse();

  return (
    <div className="bg-[#09090b] border-b border-red-600/30 flex items-center gap-4 p-4 overflow-x-auto custom-scrollbar shadow-[0_10px_30px_rgba(225,29,72,0.1)] sticky top-[92px] z-40">
      <div className="flex flex-col shrink-0 border-r border-zinc-800 pr-4">
        <span className="text-[8px] font-black text-red-600 uppercase tracking-widest leading-none">Vision</span>
        <span className="text-[10px] font-black text-white uppercase italic">Galeria</span>
      </div>
      {gallery.length === 0 ? (
        <div className="flex gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center opacity-30">
              <LucideImage size={20} className="text-zinc-600" />
            </div>
          ))}
          <span className="text-[8px] font-black text-zinc-700 uppercase self-center tracking-widest">Aguardando DNA...</span>
        </div>
      ) : (
        gallery.map((img: string, i: number) => (
          <button key={i} onClick={() => setSelectedImage(img)} className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border-2 border-zinc-800 hover:border-red-600 active:scale-90 transition-all shadow-xl">
            <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
          </button>
        ))
      )}
      <div className="w-12 shrink-0" />
    </div>
  );
};

const ChatMessage = ({ msg, onImageClick }: any) => {
  const isUser = msg.type === MessageType.USER;
  const project = msg.project;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 duration-500`}>
      <div className={`max-w-[85%] p-6 rounded-[2.5rem] shadow-2xl relative ${isUser ? 'bg-red-600 text-white rounded-tr-none font-bold' : 'bg-[#18181b] border border-zinc-800 text-zinc-200 rounded-tl-none'}`}>
        {msg.attachment?.type === 'image' && (
          <img src={msg.attachment.url} className="w-full rounded-[1.8rem] mb-4 border-2 border-red-600/20 cursor-pointer shadow-lg" onClick={() => onImageClick(msg.attachment.url)} />
        )}
        <div className="text-[14px] leading-relaxed">{msg.content}</div>
        
        {project && msg.status === 'done' && (
          <div className="mt-6 bg-[#09090b] rounded-[2rem] overflow-hidden border border-zinc-800 shadow-inner">
            <div className="bg-red-700 px-6 py-3 flex justify-between items-center text-white">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">{project.title}</span>
              <Award size={14} className="animate-bounce" />
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 bg-[#09090b]">
              <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.faithfulUrl)}>
                <img src={project.render.faithfulUrl} className="rounded-2xl border border-zinc-800 group-hover:border-red-600 transition-all" />
                <span className="absolute bottom-2 left-2 text-[7px] font-black uppercase bg-black/60 px-2 py-1 rounded text-white">DNA Fiel</span>
              </div>
              <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.decoratedUrl)}>
                <img src={project.render.decoratedUrl} className="rounded-2xl border border-zinc-800 group-hover:border-red-600 transition-all" />
                <span className="absolute bottom-2 left-2 text-[7px] font-black uppercase bg-red-600 px-2 py-1 rounded text-white italic">Rubi Style</span>
              </div>
            </div>
            <div className="p-5 flex justify-between items-end border-t border-zinc-800">
               <div className="text-left">
                  <p className="text-[8px] font-black text-red-500 uppercase tracking-widest italic mb-1">Venda Final</p>
                  <p className="text-2xl font-black text-white italic tracking-tighter">R$ {project.pricing.finalPrice?.toLocaleString('pt-BR')}</p>
               </div>
               <button className="w-12 h-12 bg-zinc-800 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-xl">
                 <MessageSquare size={20} />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// [4. WORKSHOP INNER - NOIR & RUBI]
// ============================================================================

const WorkshopInner = () => {
  const { state, dispatch, financeiro, activeModal, setActiveModal, notify, industrialRates, selectedImage, setSelectedImage } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.messages]);

  const handlePipeline = async (text: string, attachment?: Attachment) => {
    if (!text && !attachment) return;
    const uId = `u-${Date.now()}`;
    dispatch({ type: 'ADD_MESSAGE', payload: { id: uId, type: MessageType.USER, content: text || "DNA Digital enviado.", timestamp: new Date(), attachment, status: 'sent' } });
    setInputText("");
    const iId = `i-${Date.now()}`;
    dispatch({ type: 'ADD_MESSAGE', payload: { id: iId, type: MessageType.IARA, content: "YARA RUBI: Materializando DNA industrial...", timestamp: new Date(), status: 'processing' } });

    try {
      const parts: any[] = [{ text: text || "Extraia DNA." }];
      if (attachment?.data) parts.push({ inlineData: { mimeType: 'image/jpeg', data: attachment.data } });
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ parts }], config: { systemInstruction: IARA_SYSTEM_PROMPT, responseMimeType: "application/json" } });
      const parsed = YaraParsers.extractJSON(res.text || '');
      if (!parsed) throw new Error("DNA Inválido.");

      const pricing = PricingEngine.calculate(parsed, industrialRates);
      
      // Passando o sketchData para o motor de renderização
      const render = await RenderEngine.generate(parsed, attachment?.data);
      
      dispatch({ type: 'UPDATE_MESSAGE', id: iId, payload: { content: "Orquestração concluída. Projetos materializados em 3D Rubi Style.", project: { ...parsed, render, pricing, status: 'done' }, status: 'done' } });
      notify("🚀 DNA Rubi Materializado!");
    } catch (e: any) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iId, payload: { content: "Erro na orquestração Rubi: " + e.message, status: 'error' } });
    }
  };

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr; audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          notify("🎙️ Escutando...");
          try {
            const trans = await YaraParsers.parseVoice(base64);
            if (trans) handlePipeline(trans);
          } catch (err) { notify("❌ Voz falhou."); }
        };
        reader.readAsDataURL(audioBlob);
      };
      mr.start(); setIsRecording(true);
    } catch (err) { notify("❌ Sem Microfone."); }
  };

  const stopVoice = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); } };

  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden relative font-sans text-left selection:bg-red-600/30">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-[#09090b] sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(225,29,72,0.15)] relative border-zinc-800 sm:border-[12px]">
        
        {/* HEADER RUBI NOIR */}
        <header className="bg-[#09090b] pt-14 pb-6 px-8 flex items-center justify-between text-white z-50 shrink-0 border-b border-red-900/40">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-red-600 rounded-[1.2rem] flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)]"><LogoSVG size={32} /></div>
            <div>
              <h1 className="text-[14px] font-black uppercase tracking-[0.4em] text-red-600 italic leading-none">YARA RUBI</h1>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">Industrial Engine 3.0</p>
            </div>
          </div>
          <button onClick={() => setActiveModal('ADMIN')} className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-red-600 border border-zinc-800 hover:bg-zinc-800 transition-all"><LayoutDashboard size={20} /></button>
        </header>

        {/* GALERIA PERSISTENTE (VISION RAIL) - SEMPRE DISPONÍVEL */}
        <QuickVisionRail />

        {/* CHAT FEED NOIR */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-10 bg-[#09090b] custom-scrollbar pb-40">
          {state.messages.map((m: any) => <ChatMessage key={m.id} msg={m} onImageClick={setSelectedImage} />)}
        </main>

        {/* CONTROLES RUBI (ALWAYS VISIBLE) */}
        <footer className="bg-[#09090b]/80 backdrop-blur-3xl px-6 py-6 border-t border-red-900/30 flex flex-col gap-5 z-50 shrink-0 shadow-[0_-30px_60px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-4">
            {/* BOTÃO CÂMERA (DNA VISUAL) - SEMPRE DISPONÍVEL */}
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-16 h-16 flex items-center justify-center rounded-[1.6rem] bg-zinc-900 text-red-600 border-2 border-zinc-800 shadow-[0_0_15px_rgba(225,29,72,0.1)] active:scale-90 hover:bg-red-600 hover:text-white transition-all group"
              title="DNA Visual (Foto/Rascunho)"
            >
              <Camera size={28} className="group-hover:scale-110 transition-transform" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const r = new FileReader();
                r.onload = (ev) => handlePipeline("", { type: 'image', url: URL.createObjectURL(f), data: (ev.target?.result as string).split(',')[1] });
                r.readAsDataURL(f);
              }
            }} />

            {/* INPUT CENTRAL */}
            <div className="flex-1 bg-zinc-900 rounded-[1.8rem] flex items-center px-6 py-3 border border-zinc-800 shadow-inner group focus-within:border-red-600/50 transition-all">
              <input 
                type="text" placeholder="Dite comando Rubi..." 
                className="w-full text-[14px] outline-none bg-transparent py-2 font-bold text-white placeholder-zinc-600" 
                value={inputText} onChange={(e) => setInputText(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} 
              />
              <button onClick={() => inputText.trim() && handlePipeline(inputText)} className="text-red-600 p-2 hover:scale-110 transition-transform"><Send size={22} /></button>
            </div>

            {/* BOTÃO MICROFONE (DNA VOZ) - SEMPRE DISPONÍVEL */}
            <button 
              onMouseDown={startVoice} onMouseUp={stopVoice} onTouchStart={startVoice} onTouchEnd={stopVoice}
              className={`w-16 h-16 rounded-[1.6rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all group ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-red-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]'}`}
              title="DNA de Voz"
            >
              <Mic size={28} className="group-hover:scale-110 transition-transform"/>
            </button>
          </div>
        </footer>
      </div>

      {/* DRAWERS RUBI */}
      <Drawer id="ADMIN" title="Cockpit Rubi" color="bg-zinc-900" icon={BarChart3}>
        <div className="space-y-6">
          <div className="p-8 bg-[#09090b] rounded-[2.5rem] border border-red-900/40 text-center shadow-2xl">
             <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic mb-2 leading-none">Faturamento Rubi</p>
             <h3 className="text-4xl font-black text-white italic tracking-tighter">R$ {financeiro.venda.toLocaleString('pt-BR')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 text-center">
                <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Área Total</p>
                <p className="text-xl font-black text-white">{financeiro.area.toFixed(1)}m²</p>
             </div>
             <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 text-center">
                <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">MDF Chapas</p>
                <p className="text-xl font-black text-white">{financeiro.chapas}</p>
             </div>
          </div>
        </div>
      </Drawer>

      <Drawer id="TOOLS" title="Módulos" color="bg-red-800" icon={Menu}>
        <div className="grid grid-cols-1 gap-4">
           {['BENTO', 'ESTELA', 'JUCA', 'CRM'].map(id => (
              <button key={id} onClick={() => setActiveModal(id)} className="flex items-center gap-5 p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 hover:border-red-600 transition-all text-left shadow-lg">
                 <div className="w-12 h-12 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center"><Rotate3d size={24}/></div>
                 <span className="font-black uppercase text-[11px] tracking-widest italic text-white">{id} Cockpit</span>
              </button>
           ))}
        </div>
      </Drawer>

      {/* VIEWER FOTORREALISTA RUBI */}
      {selectedImage && (
        <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <img src={selectedImage} className="max-w-full max-h-[75vh] rounded-[3rem] shadow-[0_0_100px_rgba(225,29,72,0.3)] border border-red-600/20" onClick={(e) => e.stopPropagation()} />
            <div className="mt-12 flex gap-8">
               <button className="px-12 py-5 bg-zinc-900 text-red-600 rounded-full font-black uppercase text-[11px] tracking-[0.3em] border border-red-600/20 shadow-2xl hover:bg-red-600 hover:text-white transition-all">Download Master</button>
               <button className="px-12 py-5 bg-red-600 text-white rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_0_30px_rgba(225,29,72,0.4)]">Enviar Portfólio</button>
            </div>
          </div>
          <button className="absolute top-10 right-10 text-white p-4 hover:rotate-90 transition-all duration-300" onClick={() => setSelectedImage(null)}><X size={48}/></button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// [RECURSOS AUXILIARES]
// ============================================================================

const LogoSVG = ({ size = 24, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
    <rect width="40" height="40" rx="10" fill="white" />
    <path d="M20 10L30 16L20 22L10 16L20 10Z" fill="#e11d48" />
    <path d="M10 24L20 30L30 24" stroke="#e11d48" strokeWidth="2.5" />
  </svg>
);

const Drawer = ({ id, title, color, icon, children }: any) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-[420px] h-full bg-[#09090b] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-red-900/30">
        <header className={`${color} p-10 text-white flex justify-between items-center shadow-2xl`}>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">{React.createElement(icon, { size: 28 })}</div>
            <h2 className="text-2xl font-black uppercase tracking-widest italic">{title}</h2>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-4 bg-black/20 rounded-full hover:rotate-90 transition-all"><X size={28} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const useFinanceiro = (messages: Message[]) => {
  return useMemo(() => {
    let area = 0; let venda = 0;
    messages.forEach(m => { if(m.project && m.status === 'done') { area += YaraParsers.calculateTotalArea(m.project.modules); venda += m.project.pricing.finalPrice; }});
    return { area, venda, chapas: Math.ceil(area / (MDF_SHEET_AREA * 0.82)), lucro: venda * 0.38 };
  }, [messages]);
};

const App = () => {
  const [state, dispatch] = useReducer(marcenaReducer, { messages: [{ id: 'w', type: MessageType.IARA, content: 'Cockpit Yara Rubi v3.0 Supreme Online. Pronto para transformar DNA em fotorrealismo e produção.', timestamp: new Date(), status: 'done' }], isLoading: false, isAdminMode: false });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [industrialRates] = useState({ mdf: MDF_SHEET_PRICE, markup: 1.38 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const financeiro = useFinanceiro(state.messages);
  const notify = useCallback((t: string) => { const toast = document.createElement('div'); toast.className = "fixed top-32 left-1/2 -translate-x-1/2 z-[2000] bg-red-600 text-white text-[12px] font-black px-12 py-6 rounded-full shadow-[0_0_50px_rgba(225,29,72,0.4)] uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-4 italic text-center whitespace-nowrap"; toast.innerText = t; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000); }, []);

  return (
    <MarcenaContext.Provider value={{ state, dispatch, financeiro, activeModal, setActiveModal, industrialRates, notify, selectedImage, setSelectedImage }}>
      <WorkshopInner />
    </MarcenaContext.Provider>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
