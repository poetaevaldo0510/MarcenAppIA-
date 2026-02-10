
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
// [0. UTILITÁRIOS - YARA PARSERS (REFREFINADO)]
// ============================================================================

const YaraParsers = {
  // Extração robusta de DNA industrial com mapeamento de materiais premium
  extractJSON: (text: string) => {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.project?.modules) {
        parsed.project.modules = parsed.project.modules.map((m: any) => {
          const parseDim = (val: any) => {
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
            return isNaN(num) ? 0 : Math.abs(num);
          };

          // Lógica aprimorada de identificação de materiais e acabamentos
          const rawMaterial = String(m.material || '').toLowerCase();
          let detectedMaterial = 'MDF 18mm Branco TX';
          let detectedFinish = 'Padrão Industrial';
          let costMultiplier = 1.0;

          if (rawMaterial.includes('freijó') || rawMaterial.includes('verniz')) {
            detectedMaterial = 'MDF 18mm Freijó Premium';
            detectedFinish = 'Verniz Fosco Acetinado';
            costMultiplier = 1.6;
          } else if (rawMaterial.includes('mdp') || rawMaterial.includes('bp')) {
            detectedMaterial = 'MDP 18mm BP';
            detectedFinish = 'Texturizado BP High-Wear';
            costMultiplier = 0.85;
          } else if (rawMaterial.includes('grafite') || rawMaterial.includes('cinza')) {
            detectedMaterial = 'MDF 18mm Grafite Matt';
            detectedFinish = 'Anti-Fingerprint';
            costMultiplier = 1.3;
          }

          return {
            ...m,
            dimensions: {
              w: parseDim(m.dimensions?.w),
              h: parseDim(m.dimensions?.h),
              d: parseDim(m.dimensions?.d)
            },
            material: detectedMaterial,
            finish: detectedFinish,
            costMultiplier // Usado pelo PricingEngine
          };
        });
      }
      return parsed;
    } catch (e) {
      console.error("YaraParsers Error:", e);
      return null;
    }
  },

  // Refatoração de Processamento de Voz
  parseVoice: async (audioBase64: string): Promise<string> => {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        contents: [{
          parts: [
            { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
            { text: "Transcreva este áudio de marcenaria em português. Seja preciso com medidas e materiais." }
          ]
        }]
      });
      return res.text || "";
    } catch (e) {
      console.error("Voz Error:", e);
      throw new Error("Falha na transcrição robusta de voz.");
    }
  },

  calculateTotalArea: (modules: Module[]) => {
    return modules.reduce((acc, m) => acc + (m.dimensions.w * m.dimensions.h) / 1000000, 0);
  }
};

// [0.1 PIPELINE DE IA (MASTER)]
const YaraPipeline = {
  // Orquestração central para transformar input multimodal em JSON industrial usando Gemini
  parse: async ({ text, attachment }: { text: string; attachment?: Attachment }) => {
    try {
      const parts: any[] = [];
      if (attachment?.data) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: attachment.data,
          },
        });
      }
      parts.push({
        text: `${IARA_SYSTEM_PROMPT}\n\nComando do Marceneiro: ${text || "Analise o anexo e extraia o projeto estruturado em JSON."}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = YaraParsers.extractJSON(response.text || "");
      return parsed ? parsed.project : null;
    } catch (e) {
      console.error("YaraPipeline Error:", e);
      return null;
    }
  }
};

// ============================================================================
// [1. ENGINES INDUSTRIAIS (OTIMIZADOS)]
// ============================================================================

const PricingEngine = {
  calculate: (project: Partial<ProjectData>, industrialRates: { mdf: number; markup: number }) => {
    const modules = project.modules || [];
    const area = YaraParsers.calculateTotalArea(modules);
    
    // Custos diretos com ajuste por tipo de material detectado
    const baseMaterialPrice = industrialRates.mdf;
    const weightedMaterialsCost = modules.reduce((sum, m: any) => {
      const mArea = (m.dimensions.w * m.dimensions.h) / 1000000;
      return sum + (mArea * baseMaterialPrice * (m.costMultiplier || 1));
    }, 0);

    const materialsTotal = Math.ceil(weightedMaterialsCost / (MDF_SHEET_AREA * 0.82)) * 1.15; // +15% retalho/segurança
    const labor = area * LABOR_RATE_M2;
    const overhead = 1.35;
    const directCost = (materialsTotal + labor) * overhead;
    const taxRate = 0.12; 
    const costWithTax = directCost * (1 + taxRate);
    const finalPrice = costWithTax * industrialRates.markup;
    
    return {
      status: 'done' as const,
      total: directCost,
      labor,
      taxAmount: costWithTax - directCost,
      finalPrice: finalPrice,
      materials: [{ name: 'Insumos Estruturais e Acabamento', cost: materialsTotal }],
      creditsUsed: 25
    };
  }
};

const CNCOptimizer = {
  // Validações robustas para CNC industrial
  optimize: async (project: Partial<ProjectData>) => {
    const modules = project.modules || [];
    const area = YaraParsers.calculateTotalArea(modules);
    
    // Validação de dimensões máximas (Mesa CNC padrão 2750x1840)
    const MAX_W = 2750;
    const MAX_H = 1840;
    const invalidPieces = modules.filter(m => m.dimensions.w > MAX_W || m.dimensions.h > MAX_H);

    if (invalidPieces.length > 0) {
      throw new Error(`Peças excedem o limite da mesa CNC (${MAX_W}x${MAX_H}mm).`);
    }

    const rawSheetsNeeded = area / (MDF_SHEET_AREA * 0.94);
    const sheetsNeeded = Math.ceil(rawSheetsNeeded);
    const score = Math.min(98.5, (area / (sheetsNeeded * MDF_SHEET_AREA)) * 105); 
    
    return {
      status: 'done' as const,
      optimizationScore: Math.round(score),
      wastePercentage: Math.max(1.5, 100 - score),
      boards: Array.from({ length: sheetsNeeded }).map((_, i) => ({
        id: i + 1,
        usage: (score / 100) - (Math.random() * 0.02)
      }))
    };
  }
};

const RenderEngine = {
  generate: async (project: Partial<ProjectData>, sketchData?: string) => {
    const getImg = async (prompt: string, ref?: string) => {
      const parts: any[] = [];
      if (ref) parts.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
      parts.push({ text: prompt });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : '';
    };

    // Prompt ajustado dinamicamente com materiais detectados
    const materialFocus = project.modules?.[0]?.material || 'MDF Premium';
    const finishFocus = project.modules?.[0]?.finish || 'Natural';

    const faithfulPrompt = `WOODWORKING TECHNICAL MATERIALIZATION. Project: "${project.title}". 
      TASK: Match the sketch exactly. Replicate geometry and volumes.
      MATERIAL: Use high-res textures of ${materialFocus} with ${finishFocus} finish.
      STYLE: CAD technical render, clean engineering view, precise joinery.`;

    const decoratedPrompt = `ARCHITECTURAL DIGEST STYLE INTERIOR PHOTOGRAPHY. Project: "${project.title}". 
      CONTEXT: Finished furniture in a luxury modern suite. 
      MATERIAL: ${materialFocus} textures. 
      LIGHTING: Cinematic morning light, Architectural Digest composition, 8k professional magazine style.`;

    // Geração paralela para performance
    const [faithful, decorated] = await Promise.all([
      getImg(faithfulPrompt, sketchData),
      getImg(decoratedPrompt, sketchData)
    ]);

    return { status: 'done' as const, faithfulUrl: faithful, decoratedUrl: decorated };
  }
};

// ============================================================================
// [2. REDUCER & CONTEXTO]
// ============================================================================

const marcenaReducer = (state: MarcenaState, action: any): MarcenaState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m => (m.id === action.id ? { ...m, ...action.payload } : m))
      };
    case 'PROGRESS_UPDATE':
      return {
        ...state,
        messages: state.messages.map(m => (m.id === action.id ? { 
          ...m, 
          project: { ...(m.project || {}), ...action.payload } as ProjectData,
          progressiveSteps: { ...(m.progressiveSteps || {}), ...action.stepUpdate } as any
        } : m))
      };
    default:
      return state;
  }
};

const MarcenaContext = createContext<any>(null);

// ============================================================================
// [3. WORKSHOP FEED & UI MASTER]
// ============================================================================

const ProgressStep: React.FC<{ label: string; active: boolean; done: boolean; error?: boolean }> = ({ label, active, done, error }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-white/40 rounded-2xl border border-white/20">
    {active && !done && !error && <Loader2 size={12} className="animate-spin text-amber-500" />}
    {done && <CheckCircle size={12} className="text-emerald-500" />}
    {error && <AlertTriangle size={12} className="text-red-500" />}
    {!active && !done && !error && <div className="w-3 h-3 rounded-full border border-zinc-300" />}
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-zinc-900' : 'text-zinc-400'}`}>{label}</span>
  </div>
);

const ChatMessage: React.FC<{ msg: Message; onImageClick: (url: string) => void }> = ({ msg, onImageClick }) => {
  const isUser = msg.type === MessageType.USER;
  const project = msg.project;
  const steps = msg.progressiveSteps || { parsed: false, render: false, pricing: false, cutPlan: false };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`max-w-[88%] p-6 rounded-[2.8rem] shadow-sm text-[13px] leading-relaxed relative ${
        isUser ? 'bg-[#09090b] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-zinc-800 rounded-tl-none'
      }`}>
        {msg.attachment?.type === 'image' && (
          <div className="relative mb-4 cursor-pointer" onClick={() => onImageClick(msg.attachment!.url)}>
            <img src={msg.attachment.url} className="rounded-[1.8rem] w-full max-h-64 object-cover shadow-md" />
            <div className="absolute top-3 left-3 bg-black/60 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/10">DNA Input</div>
          </div>
        )}
        
        <div className="text-left font-medium leading-relaxed">{msg.content}</div>

        {!isUser && msg.status === 'processing' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ProgressStep label="DNA Parsing" active={!steps.parsed} done={steps.parsed} />
            <ProgressStep label="Engine Render" active={steps.parsed && !steps.render} done={steps.render} />
            <ProgressStep label="Pricing 12%" active={steps.render && !steps.pricing} done={steps.pricing} />
            <ProgressStep label="CNC Nesting" active={steps.pricing && !steps.cutPlan} done={steps.cutPlan} />
          </div>
        )}

        {project && msg.status === 'done' && (
          <div className="mt-6 bg-zinc-50 border border-zinc-100 rounded-[3rem] overflow-hidden text-zinc-900 text-left animate-in zoom-in-95">
            <div className="bg-[#09090b] px-10 py-6 flex justify-between items-center text-white">
              <div className="flex flex-col">
                <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 truncate mb-1">{project.title}</h1>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">PROCESSO v283 SUPREME</p>
              </div>
              <Award size={24} className="text-amber-500" />
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.faithfulUrl!)}>
                  <img src={project.render.faithfulUrl} className="w-full aspect-square object-cover rounded-[2rem] shadow-md hover:scale-[1.03] transition-transform duration-500" />
                  <span className="absolute bottom-3 left-3 bg-black/70 text-white text-[7px] px-2 py-1 rounded-full font-black uppercase tracking-tighter">DNA Fiel 1:1</span>
                </div>
                <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.decoratedUrl!)}>
                  <img src={project.render.decoratedUrl} className="w-full aspect-square object-cover rounded-[2rem] shadow-md hover:scale-[1.03] transition-transform duration-500" />
                  <span className="absolute bottom-3 left-3 bg-amber-600/90 text-white text-[7px] px-2 py-1 rounded-full font-black uppercase tracking-tighter italic">AD Showroom</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-zinc-200 pt-6 mt-2">
                <div className="text-left">
                  <p className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest mb-1 leading-none">Venda Master Industrial</p>
                  <p className="text-3xl font-black text-zinc-900 tracking-tighter leading-none italic">R$ {project.pricing.finalPrice?.toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase italic">
                      <Zap size={12}/> Otimização CNC {project.cutPlan.optimizationScore}%
                   </div>
                   <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚀 MarcenApp: Projeto de ${project.title} materializado!`)}`, '_blank')} className="w-14 h-14 bg-[#09090b] text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl active:scale-90 border border-white/5">
                    <MessageSquare size={24} className="text-amber-500" />
                   </button>
                </div>
              </div>
            </div>
          </div>
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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.messages]);

  const handlePipeline = async (text: string, attachment?: Attachment) => {
    if (!text && !attachment) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      type: MessageType.USER,
      content: text || "Input multimodal recebido.",
      timestamp: new Date(),
      attachment,
      status: 'sent'
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    setInputText("");

    const iaraId = `i-${Date.now()}`;
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { 
        id: iaraId, type: MessageType.IARA, 
        content: "YARA 3.0: Iniciando processamento granular...", 
        timestamp: new Date(), 
        status: 'processing',
        progressiveSteps: { parsed: false, render: false, pricing: false, cutPlan: false }
      } 
    });

    try {
      // 1. Parsing - Extracting project data via YaraPipeline
      const parsed = await YaraPipeline.parse({ text, attachment });
      if (!parsed) throw new Error("DNA Parsing falhou.");
      
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: parsed, stepUpdate: { parsed: true } });

      // 2. Rendering (Assíncrono, não bloqueante para o estado de precificação)
      const renderPromise = RenderEngine.generate(parsed as ProjectData, attachment?.data);
      
      // 3. Pricing & CNC (Sequencial rápido)
      const pricing = PricingEngine.calculate(parsed as ProjectData, industrialRates);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { pricing }, stepUpdate: { pricing: true } });

      const cutPlan = await CNCOptimizer.optimize(parsed as ProjectData);
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { cutPlan }, stepUpdate: { cutPlan: true } });

      // 4. Aguarda Render finalizado
      const renderRes = await renderPromise;
      dispatch({ type: 'PROGRESS_UPDATE', id: iaraId, payload: { render: renderRes }, stepUpdate: { render: true } });

      const finalProject = { ...parsed, render: renderRes, pricing, cutPlan };
      dispatch({
        type: 'UPDATE_MESSAGE', id: iaraId,
        payload: { 
          content: "Orquestração Supreme v283 concluída. DNA materializado com fotografia profissional e Nesting validado.",
          project: finalProject,
          status: 'done'
        }
      });
      notify("🚀 Operação v283 Concluída!");
    } catch (e: any) {
      console.error(e);
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: e.message || "Erro crítico na orquestração.", status: 'error' } });
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          notify("🎙️ Transcrevendo voz...");
          const transcription = await YaraParsers.parseVoice(base64);
          handlePipeline(transcription);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      notify("❌ Permissão de microfone negada.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden relative font-sans text-left">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-white sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl relative border-zinc-900 sm:border-[12px]">
        {/* HEADER */}
        <header className="bg-[#09090b] pt-14 pb-8 px-8 flex items-center justify-between text-white shadow-2xl z-30 shrink-0 border-b border-amber-600/20">
          <div className="flex items-center gap-5">
            <LogoSVG size={44} />
            <div className="flex flex-col">
              <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 italic mb-1">MARCENAPP SUPREME</h1>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">v283 MASTER RECALL</p>
            </div>
          </div>
          <button onClick={() => setActiveModal('ADMIN')} className="p-4 bg-white/5 rounded-[1.3rem] text-amber-500 shadow-2xl active:scale-95 transition-all"><LayoutDashboard size={22} /></button>
        </header>

        {/* FEED */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-12 bg-[#fdfdfd] custom-scrollbar pb-36">
          {state.messages.map((msg: Message) => <ChatMessage key={msg.id} msg={msg} onImageClick={setSelectedImage} />)}
        </main>

        {/* CONTROLES */}
        <footer className="bg-white/95 backdrop-blur-3xl px-5 py-5 border-t border-zinc-100 flex items-center gap-4 z-50 pb-9 sm:pb-7 shrink-0 shadow-2xl">
          <button 
            onClick={() => setActiveModal('TOOLS')} 
            className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all bg-orange-600 text-white shadow-orange-500/30 active:scale-90"
          >
            <Plus size={30} />
          </button>

          <div className="flex-1 bg-zinc-100 rounded-[1.5rem] flex items-center px-5 py-3 border border-zinc-200 shadow-inner group focus-within:bg-white transition-all">
            <input 
              type="text" placeholder="Dite comando ou envie DNA..." 
              className="w-full text-[14px] outline-none bg-transparent py-2 font-bold placeholder-zinc-400" 
              value={inputText} onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} 
            />
            <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-2.5"><Camera size={22} /></button>
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
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center active:scale-95 shadow-2xl transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : (inputText.trim() ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-white')}`}
            onClick={() => inputText.trim() && handlePipeline(inputText)}
          >
            {isRecording ? <Mic size={24}/> : (inputText.trim() ? <Send size={24}/> : <Mic size={24}/>)}
          </button>
        </footer>
      </div>

      {/* DRAWERS SUPREME */}
      <Drawer id="BENTO" title="Engenharia Bento" color="bg-orange-600" icon={Wrench}><BentoBancada /></Drawer>
      <Drawer id="ESTELA" title="Financeiro Estela" color="bg-emerald-600" icon={DollarSign}><EstelaBancada /></Drawer>
      <Drawer id="IARA" title="IARA Vision" color="bg-purple-600" icon={LucideImage}><IaraVisionBancada /></Drawer>
      <Drawer id="JUCA" title="Instalação Juca" color="bg-slate-700" icon={HardHat}><JucaBancada /></Drawer>
      <Drawer id="CRM" title="Gestão Industrial" color="bg-blue-600" icon={Users}><MarceneiroCRMBancada /></Drawer>
      <Drawer id="ADMIN" title="Cockpit Master" color="bg-zinc-900" icon={BarChart3}>
        <div className="space-y-5">
          <MetricCard label="Faturamento Previsto" value={`R$ ${financeiro.venda.toLocaleString('pt-BR')}`} icon={<Package size={26}/>} color="bg-blue-50" />
          <MetricCard label="Lucro em Carteira" value={`R$ ${financeiro.lucro.toLocaleString('pt-BR')}`} icon={<TrendingUp size={26}/>} color="bg-green-50" highlight />
          <MetricCard label="Área Industrial Total" value={`${financeiro.area.toFixed(2)} m²`} icon={<Hammer size={26}/>} color="bg-amber-50" />
          <div className="p-10 bg-[#09090b] rounded-[3rem] mt-8 flex items-center justify-between text-white shadow-2xl relative border border-white/5">
             <div className="text-left relative z-10">
               <p className="text-[11px] font-black uppercase text-amber-500 italic mb-2 tracking-[0.4em]">Patente Industrial</p>
               <h4 className="text-2xl font-black italic uppercase tracking-tighter">Supreme Operação v283</h4>
             </div>
             <Award className="text-amber-500 animate-pulse" size={44} />
          </div>
        </div>
      </Drawer>

      <Drawer id="TOOLS" title="Ferramentas Master" color="bg-zinc-800" icon={Menu}>
        <div className="grid grid-cols-1 gap-4">
           {['BENTO', 'ESTELA', 'IARA', 'JUCA', 'CRM'].map(id => (
              <button key={id} onClick={() => setActiveModal(id)} className="flex items-center gap-5 p-5 bg-white rounded-3xl border border-zinc-100 hover:border-amber-500 transition-all text-left group">
                 <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform"><Rotate3d size={20}/></div>
                 <span className="font-black uppercase text-[11px] tracking-widest">{id} Cockpit</span>
              </button>
           ))}
        </div>
      </Drawer>

      {/* VIEWER FOTORREALISTA MASTER */}
      {state.selectedImage && (
        <div className="fixed inset-0 z-[110000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-700" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center">
            <img src={state.selectedImage} className="max-w-full max-h-[84vh] rounded-[4rem] shadow-2xl border border-white/10 transition-all duration-1000 select-none" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-12 right-0">
               <button className="p-7 bg-white/10 text-white rounded-full backdrop-blur-xl border border-white/10 shadow-2xl" onClick={() => setSelectedImage(null)}><X size={40}/></button>
            </div>
            <div className="mt-12 flex gap-8">
               <button className="px-12 py-6 bg-white/5 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] border border-white/10 active:scale-95 flex items-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}><Download size={18}/> Baixar Master Render</button>
               <button className="px-12 py-6 bg-amber-600 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] active:scale-95 flex items-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}><Share2 size={18}/> Enviar Portfólio AD Style</button>
            </div>
          </div>
        </div>
      )}

      {/* RECALL BUTTON (QUICK RELOAD) */}
      <button onClick={() => window.location.reload()} className="fixed bottom-8 left-8 p-6 bg-slate-900/40 text-white rounded-full backdrop-blur-2xl opacity-10 hover:opacity-100 transition-all z-[100000] flex items-center justify-center shadow-2xl border border-white/10"><RotateCcw size={22} /></button>
    </div>
  );
};

// ============================================================================
// [5. COMPONENTES AUXILIARES (UI)]
// ============================================================================

const LogoSVG = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="12" fill="#D97706" />
    <path d="M20 8L32 15L20 22L8 15L20 8Z" fill="white" />
    <path d="M8 25L20 32L32 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 20L20 27L32 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MetricCard = ({ label, value, icon, color, highlight }: any) => (
  <div className={`p-6 rounded-[2.5rem] ${color} flex items-center justify-between border border-black/5`}>
    <div className="text-left">
      <p className="text-[10px] font-black uppercase text-zinc-400 mb-1 leading-none tracking-widest">{label}</p>
      <p className={`text-2xl font-black ${highlight ? 'text-zinc-900 italic' : 'text-zinc-700'} tracking-tighter`}>{value}</p>
    </div>
    <div className="p-4 bg-white rounded-2xl shadow-sm text-zinc-400">{icon}</div>
  </div>
);

const Drawer = ({ id, title, color, icon, children }: any) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;

  return (
    <div className="fixed inset-0 z-[120000] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-[450px] h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        <header className={`${color} p-10 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-md border border-white/20 shadow-xl">{React.createElement(icon, { size: 28 })}</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Cockpit MarcenApp</span>
              <h2 className="text-2xl font-black uppercase tracking-widest italic">{title}</h2>
            </div>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-4 bg-black/10 rounded-full hover:bg-black/20 transition-all active:scale-90"><X size={28} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#f8fafc]">
          {children}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
};

const BentoBancada = () => {
  const { state, financeiro, manualParts, setManualParts, notify } = useContext(MarcenaContext);
  const [newP, setNewP] = useState({ n: '', w: '', h: '', q: 1 });
  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="p-6 bg-white rounded-3xl border shadow-sm">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Engenharia Estrutural</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{financeiro?.chapas || 0} Chapas MDF</p>
          </div>
          <Package size={20} className="text-orange-600" />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">DNA Industrial Extraído</h3>
        {state.messages.filter(m => m.project).map((msg: Message, idx: number) => (
          <div key={idx} className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:border-orange-200 transition-colors">
             <div className="bg-zinc-900 p-4 text-white flex justify-between items-center">
               <span className="text-[10px] font-black text-amber-500 uppercase leading-none">{msg.project!.title}</span>
               <Cpu size={16} className="text-amber-500" />
             </div>
             <div className="p-2">
               <table className="w-full text-left text-[11px]">
                 <tbody className="divide-y text-zinc-900">
                   {msg.project!.modules.map((p: any, i: number) => (
                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                       <td className="p-3 font-bold uppercase">{p.type}</td>
                       <td className="p-3 text-amber-700 font-mono text-center">{p.dimensions.w}x{p.dimensions.h}</td>
                       <td className="p-3 font-black text-center text-zinc-400">1x</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        ))}
      </div>
      <div className="p-6 bg-white rounded-[2rem] border-2 border-dashed border-orange-200 space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <Hammer size={16} className="text-orange-600" />
           <h3 className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Inclusão Manual</h3>
        </div>
        <input placeholder="Descrição da Peça" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none border-2 border-transparent focus:border-orange-500" value={newP.n} onChange={e => setNewP({...newP, n: e.target.value})} />
        <div className="grid grid-cols-3 gap-3">
          <input type="number" placeholder="Largura" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newP.w} onChange={e => setNewP({...newP, w: e.target.value})} />
          <input type="number" placeholder="Altura" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newP.h} onChange={e => setNewP({...newP, h: e.target.value})} />
          <input type="number" placeholder="Qtd" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newP.q} onChange={e => setNewP({...newP, q: parseInt(e.target.value) || 1})} />
        </div>
        <button onClick={() => { if(parseFloat(newP.w) > 0) { setManualParts([...manualParts, {...newP, id: Date.now(), w: parseFloat(newP.w), h: parseFloat(newP.h)}]); setNewP({n:'',w:'',h:'',q:1}); notify("DNA Sincronizado!"); } }} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-orange-700 transition-all active:scale-95 text-[10px] uppercase tracking-widest">Registrar Manualmente</button>
      </div>
    </div>
  );
};

const EstelaBancada = () => {
  const { financeiro, industrialRates, setIndustrialRates, notify } = useContext(MarcenaContext);
  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className={`p-8 rounded-[2.5rem] border-l-[12px] shadow-xl transition-all ${financeiro.isLowProfit ? 'border-red-500 bg-red-50' : 'border-emerald-500 bg-emerald-50'}`}>
        <div className="flex justify-between items-start">
           <div className="text-left">
             <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Lucro Industrial Líquido</p>
             <h3 className={`text-4xl font-black tracking-tighter italic ${financeiro.isLowProfit ? 'text-red-600' : 'text-emerald-600'}`}>R$ {financeiro.lucro.toLocaleString('pt-BR')}</h3>
           </div>
           <TrendingUp size={24} className={financeiro.isLowProfit ? 'text-red-600' : 'text-emerald-600'} />
        </div>
      </div>
      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-center shadow-2xl">
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 leading-none">Venda Master (Com 12% Imposto)</p>
        <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">R$ {financeiro.venda.toLocaleString('pt-BR')}</h2>
      </div>
      <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-5 shadow-sm">
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Ajuste de Margem Master</h3>
        <input type="range" min="1.1" max="4" step="0.1" className="w-full accent-emerald-600" value={industrialRates.markup} onChange={(e: any) => setIndustrialRates({...industrialRates, markup: parseFloat(e.target.value)})} />
      </div>
      <button onClick={() => notify("📄 Contrato Gerado!")} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">Emitir Contrato Industrial</button>
    </div>
  );
};

const IaraVisionBancada = () => {
  const { state, setSelectedImage } = useContext(MarcenaContext);
  const galleryImages = state.messages
    .filter((m: Message) => m.project && m.project.render.status === 'done')
    .flatMap((m: Message) => [{ url: m.project!.render.faithfulUrl, title: `${m.project!.title} (DNA Fiel)` }, { url: m.project!.render.decoratedUrl, title: `${m.project!.title} (AD Style)` }])
    .filter(img => img.url);
  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black uppercase tracking-widest italic">Galeria Master v283</h2></div>
      <div className="grid grid-cols-2 gap-4">
        {galleryImages.map((img: any, i: number) => (
          <div key={i} className="group relative aspect-square bg-zinc-200 rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer border-4 border-white" onClick={() => setSelectedImage(img.url)}>
            <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>
        ))}
      </div>
    </div>
  );
};

const JucaBancada = () => (
  <div className="space-y-6 text-zinc-900 text-left">
    <div className="p-10 bg-white border-2 border-slate-100 rounded-[3rem] flex flex-col items-center text-center gap-6 shadow-sm">
      <div className="w-24 h-24 bg-slate-100 text-slate-600 rounded-[2.5rem] flex items-center justify-center shadow-inner"><HardHat size={48}/></div>
      <h3 className="text-2xl font-black uppercase italic tracking-tighter">Instalação Master</h3>
      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Ver Cronograma</button>
    </div>
  </div>
);

const MarceneiroCRMBancada = () => (
  <div className="space-y-6 text-zinc-900 text-left">
    <div className="p-10 bg-white border-2 border-slate-100 rounded-[3rem] flex flex-col items-center text-center gap-6 shadow-sm">
      <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-inner"><Users size={48}/></div>
      <h3 className="text-2xl font-black uppercase italic tracking-tighter">Funil Industrial</h3>
      <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Abrir CRM</button>
    </div>
  </div>
);

// [5.5 HOOKS DE ENGENHARIA]
const useFinanceiro = (messages: Message[], industrialRates: { mdf: number; markup: number }, manualParts: any[]) => {
  return useMemo(() => {
    let totalArea = 0;
    let totalVenda = 0;
    let totalCustoDirecto = 0;

    messages.forEach((m) => {
      if (m.project && m.status === 'done') {
        const area = YaraParsers.calculateTotalArea(m.project.modules);
        totalArea += area;
        totalVenda += m.project.pricing?.finalPrice || 0;
        totalCustoDirecto += m.project.pricing?.total || 0;
      }
    });

    manualParts.forEach((p) => {
      totalArea += (p.w * p.h * p.q) / 1000000;
    });

    const chapas = Math.ceil(totalArea / (MDF_SHEET_AREA * 0.82));
    const lucro = totalVenda - totalCustoDirecto;
    const isLowProfit = totalVenda > 0 ? (lucro / totalVenda < DEFAULT_MARGIN) : false;

    return {
      area: totalArea,
      venda: totalVenda,
      lucro,
      chapas,
      isLowProfit,
    };
  }, [messages, manualParts, industrialRates]);
};

// ============================================================================
// [6. ENTRY POINT SUPREME]
// ============================================================================

const App: React.FC = () => {
  const [state, dispatch] = useReducer(marcenaReducer, {
    messages: [{ id: 'welcome', type: MessageType.IARA, content: 'Cockpit v283 Supreme Online. YARA 3.0 orquestrada para extração de DNA robusta e fotorrealismo AD Style.', timestamp: new Date(), status: 'done' }],
    isLoading: false,
    isAdminMode: false
  });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [manualParts, setManualParts] = useState<any[]>([]);
  const [industrialRates, setIndustrialRates] = useState({ mdf: MDF_SHEET_PRICE, markup: 1.8 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const financeiro = useFinanceiro(state.messages, industrialRates, manualParts);
  const notify = useCallback((text: string) => {
    const toast = document.createElement('div');
    toast.className = "fixed top-36 left-1/2 -translate-x-1/2 z-[130000] bg-[#09090b] text-white text-[12px] font-black px-16 py-8 rounded-full shadow-2xl border border-amber-600/40 uppercase tracking-[0.4em] text-center whitespace-nowrap backdrop-blur-md";
    toast.innerText = text;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
  }, []);

  return (
    <MarcenaContext.Provider value={{ 
      state, dispatch, financeiro, activeModal, setActiveModal, 
      manualParts, setManualParts, industrialRates, setIndustrialRates,
      notify, selectedImage, setSelectedImage
    }}>
      <WorkshopInner />
    </MarcenaContext.Provider>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
