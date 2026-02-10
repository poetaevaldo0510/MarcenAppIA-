
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
  FolderOpen, ImageIcon, CheckCheck, Play, Pause, Paperclip
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
      contents: [{ parts: [{ inlineData: { mimeType: 'audio/wav', data: audioBase64 } }, { text: "Transcreva tecnicamente em português do Brasil focado em marcenaria." }] }]
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
    const sheetsCost = Math.ceil(area / (MDF_SHEET_AREA * 0.8)) * industrialRates.mdf;
    const labor = area * LABOR_RATE_M2;
    const finalPrice = (sheetsCost + labor) * industrialRates.markup;
    return { status: 'done' as const, total: sheetsCost + labor, finalPrice, labor, materials: [], taxAmount: 0, creditsUsed: 15 };
  }
};

const RenderEngine = {
  generate: async (project: Partial<ProjectData>, sketchData?: string, style: string = 'Architectural Digest Style') => {
    const gen = async (prompt: string, ref?: string) => {
      const parts: any[] = [];
      if (ref) parts.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
      parts.push({ text: prompt });
      const res = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: [{ parts }], config: { imageConfig: { aspectRatio: "1:1" } } });
      const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    };
    const faithful = await gen("TECHNICAL DNA FAITHFUL 1:1 INDUSTRIAL WOOD FURNITURE. Neutral studio background, clear joinery details.", sketchData);
    const decorated = await gen(`${style} PROFESSIONAL INTERIOR PHOTOGRAPHY. Hyper-realistic material textures, cinematic lighting, elegant staging.`, sketchData);
    return { status: 'done' as const, faithfulUrl: faithful, decoratedUrl: decorated };
  }
};

// ============================================================================
// [2. CONTEXTO E ESTADO]
// ============================================================================

const MarcenaContext = createContext<any>(null);

const marcenaReducer = (state: MarcenaState, action: any): MarcenaState => {
  switch (action.type) {
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE': return { ...state, messages: state.messages.map(m => m.id === action.id ? { ...m, ...action.payload } : m) };
    case 'PROGRESS_UPDATE': return { ...state, messages: state.messages.map(m => m.id === action.id ? { ...m, project: { ...(m.project || {}), ...action.payload }, progressiveSteps: { ...(m.progressiveSteps || {}), ...action.stepUpdate } } : m) };
    default: return state;
  }
};

// ============================================================================
// [3. COMPONENTES VISUAIS]
// ============================================================================

const LogoSVG = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="black" />
    <circle cx="50" cy="20" r="7" fill="#D97706" />
    <path d="M24 74V34H40L50 54L60 34H76V74" stroke="white" strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    <rect x="24" y="84" width="52" height="6" fill="#D97706" />
  </svg>
);

const ProgressStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className="flex items-center gap-2 py-1">
    <div className={`w-2 h-2 rounded-full transition-all ${done ? 'bg-orange-500 shadow-[0_0_8px_rgba(217,119,6,0.5)]' : active ? 'bg-orange-500 animate-pulse' : 'bg-zinc-200'}`} />
    <span className={`text-[9px] font-bold uppercase tracking-widest ${done ? 'text-zinc-700' : active ? 'text-orange-600' : 'text-zinc-400'}`}>{label}</span>
  </div>
);

const Drawer = ({ id, title, color, icon, children }: any) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[120000] flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-[450px] h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        <header className={`${color} p-10 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/20 rounded-[1.2rem] backdrop-blur-md border border-white/20">{React.createElement(icon, { size: 30 })}</div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none">MarcenApp Master</span>
              <h2 className="text-2xl font-black uppercase tracking-widest italic leading-none mt-1">{title}</h2>
            </div>
          </div>
          {/* X LARANJA EM FUNDO BRANCO - OBRIGATÓRIO */}
          <button onClick={() => setActiveModal(null)} className="p-4 bg-white rounded-full text-orange-600 hover:scale-110 transition-all shadow-xl flex items-center justify-center border-2 border-orange-600/10">
            <X size={32} strokeWidth={3} />
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
    .map((m: Message) => ({ url: m.attachment!.url, title: m.content || "DNA Origem" })), [state.messages]);

  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="flex bg-zinc-100 p-1.5 rounded-2xl gap-2 shadow-inner">
        <button onClick={() => setTab('RENDERS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'RENDERS' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-200'}`}>Renders Projetados</button>
        <button onClick={() => setTab('DNA')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'DNA' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-200'}`}>DNA (Fotos Celular)</button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {(tab === 'RENDERS' ? renders : dnaPhotos).map((img: any, i: number) => (
          <div key={i} className="group relative aspect-square bg-zinc-200 rounded-[2.2rem] overflow-hidden shadow-xl border-4 border-white cursor-pointer transition-transform hover:scale-105" onClick={() => setSelectedImage(img.url)}>
            <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/75 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] font-black text-orange-500 uppercase truncate leading-none mb-1">{img.title}</p>
              {img.mode && <p className="text-[7px] text-white font-bold uppercase tracking-widest opacity-80">{img.mode}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// [4. CHAT E MENSAGENS]
// ============================================================================

const ChatMessage: React.FC<{ msg: Message; onImageClick: (url: string) => void }> = ({ msg, onImageClick }) => {
  const isUser = msg.type === MessageType.USER;
  const project = msg.project;
  const steps = msg.progressiveSteps || { parsed: false, render: false, pricing: false, cutPlan: false };
  const { reRender } = useContext(MarcenaContext);

  const timeStr = useMemo(() => {
    const d = new Date(msg.timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }, [msg.timestamp]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 px-2`}>
      <div className={`max-w-[85%] relative flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* BOLHA ESTILO WHATSAPP */}
        <div className={`p-2 rounded-2xl shadow-sm min-w-[80px] relative transition-all ${
          isUser ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none border border-zinc-100'
        }`}>
          {/* CAUDA DA BOLHA */}
          <div className={`absolute top-0 w-3 h-3 ${
            isUser ? '-right-2 bg-[#dcf8c6] [clip-path:polygon(0_0,0_100%,100%_0)]' : '-left-2 bg-white [clip-path:polygon(100%_0,0_0,100%_100%)]'
          }`} />

          {/* MÍDIA (FOTO DO CELULAR OU RENDER) */}
          {msg.attachment?.type === 'image' && (
            <div className="relative overflow-hidden rounded-xl mb-2 cursor-pointer group shadow-sm" onClick={() => onImageClick(msg.attachment!.url)}>
              <img src={msg.attachment.url} className="w-full max-h-72 object-cover transition-transform group-hover:scale-105 duration-700" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/10">DNA ORIGINAL</div>
            </div>
          )}

          {/* TEXTO */}
          <div className="px-1.5 pb-1">
            <div className={`text-[15px] leading-tight text-zinc-900 ${!isUser && msg.status === 'processing' ? 'italic text-orange-600 font-bold' : ''}`}>
              {msg.content}
            </div>

            {/* STATUS E HORA */}
            <div className="flex justify-end items-center gap-1.5 mt-1 opacity-60">
              <span className="text-[10px] text-zinc-600 font-bold">{timeStr}</span>
              {isUser && <CheckCheck size={14} className="text-blue-500" />}
            </div>
          </div>
        </div>

        {/* LOADING INDUSTRIAL */}
        {!isUser && msg.status === 'processing' && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 mt-2 shadow-xl border-2 border-orange-500/10 w-full max-w-[220px] animate-in slide-in-from-left duration-300">
            <ProgressStep label="Extração de DNA" active={!steps.parsed} done={steps.parsed} />
            <ProgressStep label="Materialização AI" active={steps.parsed && !steps.render} done={steps.render} />
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100">
               <Loader2 size={12} className="animate-spin text-orange-500" />
               <span className="text-[8px] font-black uppercase text-orange-700 animate-pulse">Orquestrando...</span>
            </div>
          </div>
        )}

        {/* PROJETO MATERIALIZADO (O PRODUTO FINAL) */}
        {project && msg.status === 'done' && (
          <div className="mt-4 bg-white border-2 border-orange-600/20 rounded-[2.8rem] overflow-hidden text-left shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[340px] animate-in zoom-in duration-500 border-b-8 border-orange-600">
             <div className="bg-black p-6 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-3xl rounded-full" />
               <div className="flex flex-col relative z-10">
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500 italic truncate leading-none mb-1">{project.title}</span>
                 <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">CÓDIGO INDUSTRIAL V283</span>
               </div>
               <Award size={24} className="text-orange-500 animate-bounce relative z-10" />
             </div>
             
             <div className="p-6 space-y-5">
                {/* RENDERS LADO A LADO */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.faithfulUrl!)}>
                    <img src={project.render.faithfulUrl} className="aspect-square object-cover rounded-2xl border-2 border-zinc-100 shadow-sm transition-transform hover:scale-105" />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter backdrop-blur-md border border-white/5">FIEL 1:1</span>
                  </div>
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.decoratedUrl!)}>
                    <img src={project.render.decoratedUrl} className="aspect-square object-cover rounded-2xl border-2 border-zinc-100 shadow-sm transition-transform hover:scale-105" />
                    <span className="absolute bottom-2 left-2 bg-orange-600 text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter backdrop-blur-md border border-white/10">AD STYLE</span>
                  </div>
                </div>

                {/* MODOS DE RENDERIZAÇÃO (RESTAURADOS) */}
                <div className="space-y-2">
                   <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest italic">Alternar Materialização:</p>
                   <div className="flex flex-wrap gap-2 py-3 border-y border-zinc-50">
                    {['Industrial CAD', 'Architectural Digest Style', 'Sketch Fiel'].map(s => (
                      <button key={s} onClick={() => reRender(msg.id, s)} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:border-orange-600 hover:text-orange-600 transition-all active:scale-95 shadow-xs hover:bg-white">
                        {s.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-end pt-4 border-t border-zinc-100">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-zinc-400 italic leading-none mb-1">Budget Industrial</span>
                    <span className="text-4xl font-black italic tracking-tighter leading-none text-zinc-900">R$ {project.pricing.finalPrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚀 MarcenApp Supreme: Projeto ${project.title} orquestrado!`)}`)} className="w-14 h-14 bg-black text-orange-500 rounded-[1.5rem] flex items-center justify-center shadow-xl active:scale-90 border border-orange-600/10 hover:bg-zinc-900">
                    <MessageSquare size={26}/>
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// [5. WORKSHOP MASTER]
// ============================================================================

const WorkshopInner = () => {
  const { state, dispatch, financeiro, activeModal, setActiveModal, notify, industrialRates, setSelectedImage } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.messages]);

  const handlePipeline = async (text: string, attachment?: Attachment) => {
    if (!text && !attachment) return;
    const userMsg: Message = { id: `u-${Date.now()}`, type: MessageType.USER, content: text || "Análise de DNA multimodal", timestamp: new Date(), attachment, status: 'sent' };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    setInputText("");
    const iaraId = `i-${Date.now()}`;
    dispatch({ type: 'ADD_MESSAGE', payload: { id: iaraId, type: MessageType.IARA, content: "YARA 3.0: Iniciando extração do DNA industrial...", timestamp: new Date(), status: 'processing', progressiveSteps: { parsed: false, render: false, pricing: false, cutPlan: false } } });
    try {
      const parts: any[] = [{ text: text || "Extrair DNA completo." }];
      if (attachment?.data) parts.push({ inlineData: { mimeType: 'image/jpeg', data: attachment.data } });
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ parts }], config: { systemInstruction: IARA_SYSTEM_PROMPT, responseMimeType: "application/json" } });
      const parsed = YaraParsers.extractJSON(res.text || '')?.project;
      if (!parsed) throw new Error("Falha na decodificação do DNA.");
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: parsed, stepUpdate: { parsed: true } });
      
      const pricing = PricingEngine.calculate(parsed, industrialRates);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { pricing }, stepUpdate: { pricing: true } });

      const render = await RenderEngine.generate(parsed, attachment?.data);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { render }, stepUpdate: { render: true, cutPlan: true } });
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Orquestração industrial finalizada. Projeto pronto para produção.", status: 'done' } });
      notify("🚀 DNA SUPREME ATIVADO!");
    } catch (e: any) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Erro na orquestração: " + e.message, status: 'error' } });
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden relative font-sans text-left">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-[#e5ddd5] sm:rounded-[2.8rem] overflow-hidden flex flex-col shadow-2xl relative border-black sm:border-[10px]">
        
        {/* HEADER MARCENTAPP WHATSAPP STYLE */}
        <header className="bg-black pt-14 pb-5 px-6 flex items-center justify-between text-white z-30 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative">
          <div className="flex items-center gap-4">
            <LogoSVG size={52} />
            <div className="flex flex-col text-left">
              <h1 className="text-[16px] font-black uppercase tracking-widest text-orange-500 italic leading-none mb-1">MARCENAPP</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter leading-none flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveModal('IARA')} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-orange-500 border border-white/5 bg-white/5"><FolderOpen size={20} /></button>
            <button onClick={() => setActiveModal('ADMIN')} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-orange-500 border border-white/5 bg-white/5"><LayoutDashboard size={20} /></button>
          </div>
        </header>

        {/* CHAT AREA */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
          <div className="bg-black/50 text-white text-[9px] font-black px-6 py-2 rounded-full mx-auto w-fit uppercase tracking-[0.3em] backdrop-blur-md mb-8 border border-white/10 shadow-lg">
            SESSÃO SUPREME CRIPTOGRAFADA
          </div>
          {state.messages.map((msg: Message) => (
            <ChatMessage key={msg.id} msg={msg} onImageClick={setSelectedImage} />
          ))}
        </main>

        {/* FOOTER INPUT WHATSAPP STYLE */}
        <footer className="bg-[#f0f0f0] px-4 py-5 flex items-center gap-3 z-50 shrink-0 pb-10 sm:pb-7 border-t border-zinc-200/50">
          <button onClick={() => setActiveModal('BENTO')} className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-zinc-400 hover:text-orange-500 shadow-sm border border-zinc-200 transition-all active:scale-90">
            <Paperclip size={24} />
          </button>
          <div className="flex-1 bg-white rounded-full flex items-center px-5 py-1.5 shadow-sm border border-zinc-200 focus-within:ring-2 ring-orange-500/20 transition-all">
            <input 
              type="text" 
              placeholder="Mensagem" 
              className="flex-1 text-[16px] outline-none bg-transparent py-2.5 px-1 text-zinc-800 placeholder-zinc-400" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} 
            />
            <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-2.5 transition-transform active:scale-110" title="Fotos do Celular">
              <Camera size={26} />
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
          <button 
            className="w-13 h-13 rounded-full flex items-center justify-center bg-orange-600 text-white shadow-[0_10px_20px_rgba(217,119,6,0.3)] hover:bg-orange-500 transition-all active:scale-90"
            onClick={() => inputText.trim() && handlePipeline(inputText)}
          >
            {inputText.trim() ? <Send size={24} className="ml-1"/> : <Mic size={26}/>}
          </button>
        </footer>
      </div>

      {/* DRAWERS E MODAIS */}
      <Drawer id="BENTO" title="Engine Bento" color="bg-orange-600" icon={Wrench}><p className="text-[10px] font-black uppercase opacity-40 text-center py-20 tracking-widest italic">Processamento de Corte e Montagem v283</p></Drawer>
      <Drawer id="IARA" title="Galeria Master" color="bg-purple-600" icon={LucideImage}><IaraVisionBancada /></Drawer>
      <Drawer id="ADMIN" title="Cockpit Master" color="bg-black" icon={BarChart3}>
        <div className="space-y-4">
           <div className="p-8 bg-blue-50 rounded-[2.5rem] text-left border border-blue-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 blur-2xl" />
             <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest italic mb-2 leading-none">Performance Comercial</p>
             <h3 className="text-4xl font-black text-blue-900 tracking-tighter italic leading-none">R$ {financeiro.venda.toLocaleString('pt-BR')}</h3>
           </div>
        </div>
      </Drawer>

      {/* VISUALIZADOR DE IMAGEM FULLSCREEN COM X LARANJA */}
      {state.selectedImage && (
        <div className="fixed inset-0 z-[140000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setSelectedImage(null)}>
          <img src={state.selectedImage} className="max-w-full max-h-[85vh] rounded-[3.5rem] shadow-2xl border border-white/10 transition-transform duration-700" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-12 right-12">
            {/* O X LARANJA EM FUNDO BRANCO RECLAMADO PELO USUÁRIO */}
            <button className="p-8 bg-white text-orange-600 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-90 border-4 border-orange-600/10" onClick={() => setSelectedImage(null)}>
              <X size={48} strokeWidth={3} />
            </button>
          </div>
          <div className="mt-12 flex gap-8">
             <button className="px-12 py-5 bg-white/5 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] border border-white/10 active:scale-95 flex items-center gap-3 backdrop-blur-md hover:bg-white/10" onClick={(e) => e.stopPropagation()}><Download size={18}/> Salvar Render</button>
             <button className="px-12 py-5 bg-orange-600 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] active:scale-95 flex items-center gap-3 shadow-2xl hover:bg-orange-500" onClick={(e) => e.stopPropagation()}><Share2 size={18}/> Compartilhar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// [6. APP ROOT]
// ============================================================================

const App: React.FC = () => {
  const [state, dispatch] = useReducer(marcenaReducer, { 
    messages: [{ 
      id: 'welcome', 
      type: MessageType.IARA, 
      content: 'MARCENAPP SUPREME v283 ONLINE. Envie uma foto do ambiente, rascunho ou áudio para orquestrar sua marcenaria agora.', 
      timestamp: new Date(), 
      status: 'done' 
    }], 
    isLoading: false, 
    isAdminMode: false 
  });
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [industrialRates, setIndustrialRates] = useState({ mdf: MDF_SHEET_PRICE, markup: 1.45 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const financeiro = useMemo(() => {
    const totalVenda = state.messages.reduce((acc, m) => acc + (m.project?.pricing?.finalPrice || 0), 0);
    return { venda: totalVenda };
  }, [state.messages]);

  const notify = (text: string) => {
    const t = document.createElement('div');
    t.className = "fixed top-36 left-1/2 -translate-x-1/2 z-[200000] bg-black text-white px-12 py-6 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl animate-in fade-in zoom-in italic border border-orange-600/20 text-center";
    t.innerText = text; document.body.appendChild(t);
    setTimeout(() => { t.classList.add('animate-out', 'fade-out'); setTimeout(() => t.remove(), 300); }, 3000);
  };

  const reRender = async (msgId: string, style: string) => {
    const msg = state.messages.find(m => m.id === msgId);
    if (!msg?.project) return;
    notify(`🎨 RE-MATERIALIZANDO: ${style.toUpperCase()}...`);
    dispatch({ type: 'PROGRESS_UPDATE', id: msgId, stepUpdate: { render: false } });
    try {
      const render = await RenderEngine.generate(msg.project, msg.attachment?.data, style);
      dispatch({ type: 'PROGRESS_UPDATE', id: msgId, payload: { render }, stepUpdate: { render: true } });
      notify("✅ MATERIALIZAÇÃO CONCLUÍDA!");
    } catch (e) { notify("❌ ERRO NO MOTOR DE RENDER."); }
  };

  return (
    <MarcenaContext.Provider value={{ state, dispatch, financeiro, activeModal, setActiveModal, industrialRates, setIndustrialRates, notify, selectedImage, setSelectedImage, reRender }}>
      <WorkshopInner />
    </MarcenaContext.Provider>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
