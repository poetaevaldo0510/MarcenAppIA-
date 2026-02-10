
import React, { useState, useRef, useEffect, useReducer, createContext, useContext, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Wrench, X, Mic, Award, Image as LucideImage, Camera, Send, 
  BarChart3, FolderOpen, LayoutDashboard, MessageSquare, 
  Download, Share2, Loader2, CheckCheck, Paperclip
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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ============================================================================
// [0. MOTOR YARA - JSON MESTRE CENTRAL]
// ============================================================================

const YaraEngine = {
  /**
   * ESTÁGIO 1: PARSING & DNA (Criação do JSON Mestre)
   * Garante que SEM JSON = SEM PROCESSO.
   */
  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
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

      // Schema Enforcement: Garante integridade do JSON Central
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
        source: {
          type: attachment ? 'image' : 'text',
          content: text,
          attachmentUrl: attachment?.url
        },
        render: { status: 'pending' },
        pricing: { status: 'pending', materials: [], total: 0, labor: 0, finalPrice: 0, creditsUsed: 15 },
        cutPlan: { status: 'pending', boards: [], optimizationScore: 0 }
      };
    } catch (e) {
      console.error("Critical Engine Error:", e);
      return null;
    }
  },

  /**
   * ESTÁGIO 2: MATERIALIZAÇÃO (Render AI baseado no JSON)
   */
  generateRender: async (project: ProjectData, sketchData?: string, style: string = 'Architectural Digest Style'): Promise<{ faithful: string, decorated: string }> => {
    const gen = async (prompt: string, ref?: string) => {
      const parts: any[] = [];
      if (ref) parts.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
      parts.push({ text: prompt });
      const res = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents: [{ parts }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    };

    const faithful = await gen(`TECHNICAL DNA 1:1 INDUSTRIAL VIEW: ${project.title}. High definition wood textures, precise joinery details, neutral background.`, sketchData);
    const decorated = await gen(`${style} PROFESSIONAL PHOTOGRAPHY: ${project.title}. Real environment, cinematic lighting, staged luxury interior.`, sketchData);

    return { faithful, decorated };
  },

  /**
   * ESTÁGIO 3: BUDGET (Cálculo Industrial)
   */
  calculateBudget: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    const area = project.modules.reduce((acc, m) => acc + (m.dimensions.w * m.dimensions.h) / 1000000, 0);
    const mdfCost = Math.ceil(area / (MDF_SHEET_AREA * 0.8)) * rates.mdf;
    const labor = area * LABOR_RATE_M2;
    const total = mdfCost + labor;
    return {
      status: 'done' as const,
      materials: [{ name: 'MDF Estrutural', cost: mdfCost }],
      total,
      labor,
      finalPrice: total * rates.markup,
      creditsUsed: 15
    };
  }
};

// ============================================================================
// [1. ESTADO GLOBAL - REDUCER CONSOLIDADO]
// ============================================================================

const MarcenaContext = createContext<any>(null);

const marcenaReducer = (state: MarcenaState, action: any): MarcenaState => {
  switch (action.type) {
    case 'ADD_MESSAGE': 
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE': 
      return { ...state, messages: state.messages.map(m => m.id === action.id ? { ...m, ...action.payload } : m) };
    case 'PROGRESS_UPDATE': 
      return { 
        ...state, 
        messages: state.messages.map(m => m.id === action.id ? { 
          ...m, 
          project: { ...(m.project || {}), ...action.payload } as ProjectData, 
          progressiveSteps: { ...(m.progressiveSteps || {}), ...action.stepUpdate } 
        } : m) 
      };
    default: return state;
  }
};

// ============================================================================
// [2. COMPONENTES ATOMICOS]
// ============================================================================

const LogoSVG = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="black" />
    <circle cx="50" cy="22" r="7.5" fill="#D97706" />
    <path d="M22 75V34H39L50 54L61 34H78V75" stroke="white" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    <rect x="22" y="86" width="56" height="5" fill="#D97706" />
  </svg>
);

const ProgressStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className="flex items-center gap-2.5 py-1">
    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
      done ? 'bg-orange-500 shadow-[0_0_10px_rgba(217,119,6,0.6)]' : active ? 'bg-orange-500 animate-pulse' : 'bg-zinc-200'
    }`} />
    <span className={`text-[9px] font-black uppercase tracking-widest ${
      done ? 'text-zinc-800' : active ? 'text-orange-600' : 'text-zinc-400'
    }`}>{label}</span>
  </div>
);

// FIX: Added IaraVisionBancada component to solve the missing name error.
const IaraVisionBancada = () => {
  const { state, setSelectedImage } = useContext(MarcenaContext);
  const projects = state.messages
    .filter((m: Message) => m.project && m.status === 'done')
    .map((m: Message) => m.project!);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
        <LucideImage size={48} className="mx-auto" />
        <p className="text-[11px] font-black uppercase mt-4 tracking-[0.3em]">Galeria Vazia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {projects.map((p: ProjectData) => (
        <div key={p.projectId} className="space-y-2 group">
          <div 
            className="relative aspect-square overflow-hidden rounded-[2rem] border-2 border-zinc-100 shadow-sm cursor-pointer" 
            onClick={() => setSelectedImage(p.render.faithfulUrl!)}
          >
            <img src={p.render.faithfulUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <LucideImage size={24} className="text-white" />
            </div>
          </div>
          <p className="text-[9px] font-black uppercase truncate px-2 text-zinc-600">{p.title}</p>
        </div>
      ))}
    </div>
  );
};

const Drawer = ({ id, title, color, icon, children }: any) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[120000] flex justify-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-[460px] h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        <header className={`${color} p-10 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-[1.4rem] backdrop-blur-md border border-white/20 shadow-xl">{React.createElement(icon, { size: 30 })}</div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none">MarcenApp Supreme</span>
              <h2 className="text-2xl font-black uppercase tracking-widest italic leading-none mt-1.5">{title}</h2>
            </div>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-5 bg-white text-orange-600 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center border-2 border-orange-600/10">
            <X size={34} strokeWidth={3} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// [3. INTERFACE DE MENSAGENS]
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
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 px-3`}>
      <div className={`max-w-[85%] relative flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* BOLHA WHATSAPP SUPREME */}
        <div className={`p-2 rounded-2xl shadow-md min-w-[80px] relative transition-all ${
          isUser ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none border border-zinc-100'
        }`}>
          {/* CAUDA DA BOLHA (TIPS) */}
          <div className={`absolute top-0 w-3 h-3 ${
            isUser ? '-right-2 bg-[#dcf8c6] [clip-path:polygon(0_0,0_100%,100%_0)]' : '-left-2 bg-white [clip-path:polygon(100%_0,0_0,100%_100%)]'
          }`} />

          {msg.attachment?.type === 'image' && (
            <div className="relative overflow-hidden rounded-xl mb-2 cursor-pointer" onClick={() => onImageClick(msg.attachment!.url)}>
              <img src={msg.attachment.url} className="w-full max-h-72 object-cover" />
            </div>
          )}

          <div className="px-2 pb-1">
            <div className={`text-[15px] leading-snug text-zinc-900 ${!isUser && msg.status === 'processing' ? 'italic text-orange-600 font-bold' : ''}`}>
              {msg.content}
            </div>
            <div className="flex justify-end items-center gap-1.5 mt-1.5 opacity-60">
              <span className="text-[10px] text-zinc-600 font-bold">{timeStr}</span>
              {isUser && <CheckCheck size={14} className="text-blue-500" />}
            </div>
          </div>
        </div>

        {/* FEEDBACK DE PROCESSAMENTO DO MOTOR YARA */}
        {!isUser && msg.status === 'processing' && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 mt-3 shadow-xl border-2 border-orange-500/10 w-full max-w-[240px] animate-in slide-in-from-left">
            <ProgressStep label="DNA Parsing" active={!steps.parsed} done={steps.parsed} />
            <ProgressStep label="Materialização AI" active={steps.parsed && !steps.render} done={steps.render} />
            <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-zinc-100">
               <Loader2 size={13} className="animate-spin text-orange-500" />
               <span className="text-[9px] font-black uppercase text-orange-700 animate-pulse">Orquestrando...</span>
            </div>
          </div>
        )}

        {/* CARD DO PROJETO - MATERIALIZAÇÃO DO JSON MESTRE */}
        {project && msg.status === 'done' && (
          <div className="mt-4 bg-white border-2 border-orange-600/20 rounded-[3rem] overflow-hidden text-left shadow-2xl w-full max-w-[350px] animate-in zoom-in border-b-[12px] border-orange-600">
             <div className="bg-black p-6 text-white flex justify-between items-center relative overflow-hidden">
               <div className="flex flex-col relative z-10">
                 <span className="text-[12px] font-black uppercase tracking-[0.3em] text-orange-500 italic leading-none mb-1.5">{project.title}</span>
                 <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.4em] leading-none">CÓDIGO INDUSTRIAL V283</span>
               </div>
               <Award size={26} className="text-orange-500 animate-bounce relative z-10" />
             </div>
             
             <div className="p-7 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.faithfulUrl!)}>
                    <img src={project.render.faithfulUrl} className="aspect-square object-cover rounded-[1.8rem] border-2 border-zinc-100 shadow-md transition-transform hover:scale-105" />
                    <span className="absolute bottom-2.5 left-2.5 bg-black/70 text-white text-[7px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter backdrop-blur-md">DNA FIEL</span>
                  </div>
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.decoratedUrl!)}>
                    <img src={project.render.decoratedUrl} className="aspect-square object-cover rounded-[1.8rem] border-2 border-zinc-100 shadow-md transition-transform hover:scale-105" />
                    <span className="absolute bottom-2.5 left-2.5 bg-orange-600 text-white text-[7px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter backdrop-blur-md">AD STYLE</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-5 border-t border-zinc-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-zinc-400 italic leading-none mb-1.5 tracking-widest">Orçamento Master</span>
                    <span className="text-4xl font-black italic tracking-tighter leading-none text-zinc-900">R$ {project.pricing.finalPrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚀 MarcenApp: Projeto ${project.title} pronto!`)}`)} className="w-16 h-16 bg-black text-orange-500 rounded-[1.6rem] flex items-center justify-center shadow-2xl active:scale-90 border border-orange-600/10 hover:bg-zinc-900 transition-all">
                    <MessageSquare size={28}/>
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
// [4. WORKSHOP MASTER - UI CONSOLIDADA]
// ============================================================================

const WorkshopInner = () => {
  const { state, dispatch, financeiro, setActiveModal, notify, industrialRates, setSelectedImage } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.messages]);

  const handlePipeline = async (text: string, attachment?: Attachment) => {
    if (!text && !attachment) return;
    
    // UI OTIMISTA: Insere mensagem do usuário instantaneamente
    const userMsgId = `u-${Date.now()}`;
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { id: userMsgId, type: MessageType.USER, content: text || "Análise DNA Multimodal", timestamp: new Date(), attachment, status: 'sent' } 
    });
    setInputText("");
    
    // ESTÁGIO 1: Feedback YARA
    const iaraId = `i-${Date.now()}`;
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { 
        id: iaraId, type: MessageType.IARA, 
        content: "YARA 3.0: Iniciando extração do DNA industrial...", 
        timestamp: new Date(), 
        status: 'processing', 
        progressiveSteps: { parsed: false, render: false, pricing: false, cutPlan: false } 
      } 
    });

    try {
      // ESTÁGIO 2: Geração do JSON MESTRE (Fonte Única)
      const project = await YaraEngine.processInput(text, attachment);
      if (!project) throw new Error("DNA Parsing falhou.");
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: project, stepUpdate: { parsed: true } });
      
      // ESTÁGIO 3: Materialização AI
      const pricing = YaraEngine.calculateBudget(project, industrialRates);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { pricing }, stepUpdate: { pricing: true } });

      const render = await YaraEngine.generateRender(project, attachment?.data);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { render: { ...render, status: 'done' } }, stepUpdate: { render: true, cutPlan: true } });
      
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Orquestração completa. Projeto materializado.", status: 'done' } });
      notify("🚀 PROJETO ORQUESTRADO");
    } catch (e: any) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Erro na orquestração: " + e.message, status: 'error' } });
      notify("❌ FALHA NA YARA");
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden relative font-sans text-left">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-[#e5ddd5] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative border-black sm:border-[12px] transition-all duration-700">
        
        {/* HEADER WHATSAPP SUPREME */}
        <header className="bg-black pt-14 pb-5 px-7 flex items-center justify-between text-white z-30 shrink-0 shadow-lg relative">
          <div className="flex items-center gap-5">
            <LogoSVG size={54} />
            <div className="flex flex-col text-left">
              <h1 className="text-[17px] font-black uppercase tracking-[0.1em] text-orange-500 italic leading-none mb-1.5">MARCENAPP</h1>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" /> online agora
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setActiveModal('IARA')} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all text-orange-500 border border-white/5 bg-white/5"><FolderOpen size={22} /></button>
            <button onClick={() => setActiveModal('ADMIN')} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all text-orange-500 border border-white/5 bg-white/5"><LayoutDashboard size={22} /></button>
          </div>
        </header>

        {/* CHAT AREA WITH WALLPAPER */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:400px_auto]">
          <div className="bg-black/60 text-white text-[9px] font-black px-8 py-2.5 rounded-full mx-auto w-fit uppercase tracking-[0.4em] backdrop-blur-md mb-10 border border-white/10 shadow-2xl">
            SESSÃO MASTER CRIPTOGRAFADA
          </div>
          {state.messages.map((msg: Message) => (
            <ChatMessage key={msg.id} msg={msg} onImageClick={setSelectedImage} />
          ))}
        </main>

        {/* FOOTER INPUT WHATSAPP SUPREME */}
        <footer className="bg-[#f0f0f0] px-5 py-5 flex items-center gap-3.5 z-50 shrink-0 pb-12 sm:pb-8 border-t border-zinc-200/50 backdrop-blur-xl">
          <button onClick={() => setActiveModal('BENTO')} className="w-13 h-13 flex items-center justify-center rounded-full bg-white text-zinc-400 hover:text-orange-500 shadow-sm border border-zinc-200 transition-all active:scale-90">
            <Paperclip size={26} />
          </button>
          <div className="flex-1 bg-white rounded-full flex items-center px-6 py-2 shadow-sm border border-zinc-200 focus-within:ring-4 ring-orange-500/10 transition-all">
            <input 
              type="text" 
              placeholder="Mensagem" 
              className="flex-1 text-[16px] outline-none bg-transparent py-3 px-1 text-zinc-800 placeholder-zinc-400 font-medium" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} 
            />
            <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-2.5 transition-transform active:scale-125">
              <Camera size={28} />
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
            className="w-14 h-14 rounded-full flex items-center justify-center bg-orange-600 text-white shadow-xl hover:bg-orange-500 transition-all active:scale-90"
            onClick={() => inputText.trim() && handlePipeline(inputText)}
          >
            {inputText.trim() ? <Send size={26} className="ml-1.5"/> : <Mic size={28}/>}
          </button>
        </footer>
      </div>

      {/* MODAIS (Consolidados para desmontar quando inativos) */}
      <Drawer id="BENTO" title="Engine Bento" color="bg-orange-600" icon={Wrench}><p className="text-[11px] font-black uppercase opacity-40 text-center py-24 tracking-[0.4em] italic">Engine v283 em stand-by</p></Drawer>
      <Drawer id="IARA" title="Galeria Master" color="bg-purple-600" icon={LucideImage}><IaraVisionBancada /></Drawer>
      <Drawer id="ADMIN" title="Cockpit Master" color="bg-black" icon={BarChart3}>
        <div className="space-y-6">
           <div className="p-10 bg-blue-50 rounded-[3rem] text-left border border-blue-100 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 blur-3xl rounded-full" />
             <p className="text-[11px] font-black uppercase text-blue-400 tracking-[0.3em] italic mb-3 leading-none">Total Industrial</p>
             <h3 className="text-5xl font-black text-blue-900 tracking-tighter italic leading-none">R$ {financeiro.venda.toLocaleString('pt-BR')}</h3>
           </div>
        </div>
      </Drawer>

      {/* VISUALIZADOR DE IMAGEM FULLSCREEN COM X LARANJA EM FUNDO BRANCO */}
      {state.selectedImage && (
        <div className="fixed inset-0 z-[140000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-700" onClick={() => setSelectedImage(null)}>
          <img src={state.selectedImage} className="max-w-full max-h-[85vh] rounded-[4rem] shadow-2xl border border-white/10 select-none" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-12 right-12">
            <button className="p-9 bg-white text-orange-600 rounded-full shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all hover:scale-110 active:scale-90 border-[6px] border-orange-600/10" onClick={() => setSelectedImage(null)}>
              <X size={54} strokeWidth={4} />
            </button>
          </div>
          <div className="mt-14 flex gap-10">
             <button className="px-14 py-6 bg-white/5 text-white rounded-full font-black uppercase text-[12px] tracking-[0.5em] border border-white/10 flex items-center gap-4 backdrop-blur-xl hover:bg-white/10 shadow-2xl transition-all" onClick={(e) => e.stopPropagation()}><Download size={22}/> Salvar</button>
             <button className="px-14 py-6 bg-orange-600 text-white rounded-full font-black uppercase text-[12px] tracking-[0.5em] flex items-center gap-4 shadow-xl hover:bg-orange-500 transition-all" onClick={(e) => e.stopPropagation()}><Share2 size={22}/> Compartilhar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// [5. APP ROOT]
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
    t.className = "fixed top-36 left-1/2 -translate-x-1/2 z-[200000] bg-black text-white px-14 py-7 rounded-full font-black text-[12px] uppercase tracking-[0.5em] shadow-2xl animate-in fade-in zoom-in italic border border-orange-500/30 text-center backdrop-blur-md";
    t.innerText = text; document.body.appendChild(t);
    setTimeout(() => { t.classList.add('animate-out', 'fade-out'); setTimeout(() => t.remove(), 400); }, 3500);
  };

  const reRender = async (msgId: string, style: string) => {
    const msg = state.messages.find(m => m.id === msgId);
    if (!msg?.project) return;
    notify(`🎨 RE-MATERIALIZANDO: ${style.toUpperCase()}...`);
    dispatch({ type: 'PROGRESS_UPDATE', id: msgId, stepUpdate: { render: false } });
    try {
      const render = await YaraEngine.generateRender(msg.project, msg.attachment?.data, style);
      dispatch({ type: 'PROGRESS_UPDATE', id: msgId, payload: { render: { ...render, status: 'done' } }, stepUpdate: { render: true } });
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
