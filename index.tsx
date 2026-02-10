
import React, { useState, useRef, useEffect, useReducer, createContext, useContext, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Wrench, DollarSign, Eye, HardHat, X, Mic, Calendar,
  TrendingUp, Users, RotateCcw, Rotate3d, Package, FileSignature, 
  CheckCircle, ArrowUpRight, Cpu, Menu, Award, PlayCircle, 
  Image as LucideImage, Camera, Send, Trash2, AlertTriangle, BarChart3,
  Plus, Search, Filter, ClipboardList, Hammer, Zap, UserPlus,
  ChevronRight, Smartphone, LayoutDashboard, MessageSquare
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
// [0. REDUCER & ESTADO GLOBAL]
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
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// ============================================================================
// [1. ENGINES INDUSTRIAIS (CORE)]
// ============================================================================

const PricingEngine = {
  calculate: (project: Partial<ProjectData>, industrialRates: { mdf: number; markup: number }) => {
    const modules = project.modules || [];
    const area = modules.reduce((s, m) => s + (m.dimensions.w * m.dimensions.h / 1000000), 0);
    const materialsCost = Math.ceil(area / (MDF_SHEET_AREA * 0.85)) * industrialRates.mdf;
    const labor = area * LABOR_RATE_M2;
    const overhead = 1.35;
    const baseCost = (materialsCost + labor) * overhead;
    const finalPrice = baseCost * industrialRates.markup;
    
    return {
      status: 'done' as const,
      total: baseCost,
      labor,
      finalPrice,
      materials: [{ name: 'MDF Estrutural Premium', cost: materialsCost }],
      creditsUsed: 12
    };
  }
};

const CNCOptimizer = {
  optimize: async (project: Partial<ProjectData>) => {
    // Simulação de otimização de plano de corte baseada na área total
    const modules = project.modules || [];
    const area = modules.reduce((s, m) => s + (m.dimensions.w * m.dimensions.h / 1000000), 0);
    const sheetsNeeded = Math.ceil(area / (MDF_SHEET_AREA * 0.85));
    const score = 88 + Math.random() * 8;
    
    return {
      status: 'done' as const,
      optimizationScore: score,
      boards: Array.from({ length: sheetsNeeded }).map((_, i) => ({
        id: i + 1,
        usage: 0.75 + Math.random() * 0.15
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

    // Prompt de Render Fiel: Foco em precisão técnica e estrutura baseada no rascunho
    const faithfulPrompt = `Technical 3D woodworking render of the furniture: "${project.title}". 
      INSTRUCTION: This render MUST be an exact 3D materialization of the provided sketch reference. 
      Maintain exact geometry, proportions, and structure. 
      STYLE: Clean studio environment, industrial lighting, focus on wood textures, visible joinery, professional CAD visualization quality.`;

    // Prompt de Showroom: Fotografia de interiores profissional com iluminação suave
    const decoratedPrompt = `Professional architectural photography of the finished "${project.title}" from the sketch. 
      CONTEXT: Placed in a high-end luxury modern room with professional interior design staging. 
      LIGHTING: Soft cinematic natural light from a window, subtle shadows, warm atmosphere. 
      COMPOSITION: Architectural magazine style, wide angle, perfectly balanced frame, high-resolution textures. 
      The furniture must maintain the core structural design of the sketch but perfectly integrated into a decorated space.`;

    const [faithful, decorated] = await Promise.all([
      getImg(faithfulPrompt, sketchData),
      getImg(decoratedPrompt, sketchData)
    ]);

    return { status: 'done' as const, faithfulUrl: faithful, decoratedUrl: decorated };
  }
};

const YaraPipeline = {
  parse: async (input: { text?: string; attachment?: Attachment }): Promise<Partial<ProjectData> | null> => {
    const parts: any[] = [{ text: input.text || "Extração de DNA técnico para marcenaria." }];
    if (input.attachment?.data) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: input.attachment.data } });
    }

    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts }],
      config: { systemInstruction: IARA_SYSTEM_PROMPT }
    });

    const jsonMatch = (res.text || '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      const data = JSON.parse(jsonMatch[0]);
      const ext = data.project || data;
      return {
        projectId: `PRJ-${Date.now()}`,
        title: ext.title,
        description: ext.description,
        environment: ext.environment,
        modules: ext.modules,
        complexity: ext.complexity || 2,
        source: { type: input.attachment ? 'image' : 'text', content: input.text },
        render: { status: 'pending' },
        pricing: { status: 'pending', materials: [], total: 0, labor: 0, finalPrice: 0, creditsUsed: 0 },
        cutPlan: { status: 'pending', boards: [], optimizationScore: 0 }
      };
    } catch (e) { return null; }
  }
};

// ============================================================================
// [2. CONTEXTO & HOOKS DE ESTADO]
// ============================================================================

const MarcenaContext = createContext<any>(null);

function useFinanceiro(messages: Message[], industrialRates: any, manualParts: any[]) {
  return useMemo(() => {
    try {
      let totalAreaM2 = 0;
      messages.forEach(msg => {
        if (msg.project) {
          msg.project.modules.forEach(m => {
            totalAreaM2 += (m.dimensions.w * m.dimensions.h) / 1000000;
          });
        }
      });
      
      manualParts.forEach(p => {
        totalAreaM2 += (p.w * p.h * (p.q || 1)) / 1000000;
      });

      const sheets = Math.ceil(totalAreaM2 / (MDF_SHEET_AREA * 0.85));
      const cost = sheets * industrialRates.mdf;
      const labor = totalAreaM2 * LABOR_RATE_M2;
      const baseTotal = (cost + labor) * 1.35;
      const finalPrice = baseTotal * industrialRates.markup;
      const profit = finalPrice - baseTotal;
      
      return { 
        area: totalAreaM2,
        custo: baseTotal,
        venda: finalPrice,
        lucro: profit,
        chapas: sheets,
        isLowProfit: profit < (baseTotal * 0.3)
      };
    } catch (e) { 
      return { venda: 0, lucro: 0, area: 0, chapas: 0, isLowProfit: false }; 
    }
  }, [messages, industrialRates, manualParts]);
}

// ============================================================================
// [3. COMPONENTES AUXILIARES (UI)]
// ============================================================================

/**
 * Fix: Added missing LogoSVG component.
 */
const LogoSVG = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="12" fill="currentColor" fillOpacity="0.1"/>
    <path d="M20 8L32 15L20 22L8 15L20 8Z" fill="currentColor" />
    <path d="M8 25L20 32L32 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 20L20 27L32 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Fix: Added missing MetricCard component for the Admin Dashboard.
 */
const MetricCard = ({ label, value, icon, color, highlight }: any) => (
  <div className={`p-6 rounded-[2rem] ${color} flex items-center justify-between shadow-sm border border-black/5`}>
    <div className="text-left">
      <p className="text-[10px] font-black uppercase text-zinc-400 mb-1 leading-none">{label}</p>
      <p className={`text-xl font-black ${highlight ? 'text-zinc-900 italic' : 'text-zinc-700'}`}>{value}</p>
    </div>
    <div className="p-3 bg-white rounded-xl shadow-sm text-zinc-400">{icon}</div>
  </div>
);

/**
 * Fix: Added missing Drawer component for the modular tool views.
 */
const Drawer = ({ id, title, color, icon, children }: any) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;

  return (
    <div className="fixed inset-0 z-[120000] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-[450px] h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        <header className={`${color} p-8 text-white flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">{React.createElement(icon, { size: 24 })}</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Cockpit Móvel</span>
              <h2 className="text-xl font-black uppercase tracking-widest">{title}</h2>
            </div>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-4 bg-black/10 rounded-full hover:bg-black/20 transition-all"><X size={24} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Fix: Added missing IaraVisionBancada component.
 */
const IaraVisionBancada = () => (
  <div className="space-y-6 text-zinc-900 text-left">
    <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center gap-4 shadow-sm">
      <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center animate-bounce"><Rotate3d size={40}/></div>
      <div>
        <h3 className="text-xl font-black uppercase italic">Neural Preview 3.0</h3>
        <p className="text-xs font-medium text-slate-500">IARA orquestrando visão computacional para detecção de materiais e ferragens em tempo real.</p>
      </div>
    </div>
  </div>
);

/**
 * Fix: Added missing JucaBancada component.
 */
const JucaBancada = () => (
  <div className="space-y-6 text-zinc-900 text-left">
    <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center gap-4 shadow-sm">
      <div className="w-20 h-20 bg-slate-100 text-slate-600 rounded-3xl flex items-center justify-center"><HardHat size={40}/></div>
      <div>
        <h3 className="text-xl font-black uppercase italic">Logística & Instalação</h3>
        <p className="text-xs font-medium text-slate-500">Mapeamento de rotas e checklists de montagem final. Juca no comando da obra.</p>
      </div>
    </div>
  </div>
);

/**
 * Fix: Added missing MarceneiroCRMBancada component.
 */
const MarceneiroCRMBancada = () => (
  <div className="space-y-6 text-zinc-900 text-left">
    <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center gap-4 shadow-sm">
      <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center"><Users size={40}/></div>
      <div>
        <h3 className="text-xl font-black uppercase italic">Funil de Vendas Industrial</h3>
        <p className="text-xs font-medium text-slate-500">Gestão de leads e contratos ativos. Monitoramento de conversão por projeto.</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// [4. COMPONENTES DE BANCADA (TOOLS)]
// ============================================================================

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
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><Package size={20}/></div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">DNA Extraído por IA</h3>
        {state.messages.filter(m => m.project).map((msg, idx) => (
          <div key={idx} className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:border-orange-200 transition-colors">
             <div className="bg-zinc-900 p-4 text-white flex justify-between items-center">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-amber-500 uppercase leading-none">{msg.project!.title}</span>
                 <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">ID: {msg.project!.projectId}</span>
               </div>
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
           <h3 className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Inclusão de Peças Manual</h3>
        </div>
        <input placeholder="Descrição (Ex: Tampo Ilha)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none border-2 border-transparent focus:border-orange-500" value={newP.n} onChange={e => setNewP({...newP, n: e.target.value})} />
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
             <span className="text-[8px] font-black text-zinc-400 uppercase ml-2">Largura</span>
             <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newP.w} onChange={e => setNewP({...newP, w: e.target.value})} />
          </div>
          <div className="space-y-1">
             <span className="text-[8px] font-black text-zinc-400 uppercase ml-2">Altura</span>
             <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newP.h} onChange={e => setNewP({...newP, h: e.target.value})} />
          </div>
          <div className="space-y-1">
             <span className="text-[8px] font-black text-zinc-400 uppercase ml-2">Qtd</span>
             <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newP.q} onChange={e => setNewP({...newP, q: parseInt(e.target.value) || 1})} />
          </div>
        </div>
        <button onClick={() => { if(parseFloat(newP.w) > 0) { setManualParts([...manualParts, {...newP, id: Date.now(), w: parseFloat(newP.w), h: parseFloat(newP.h)}]); setNewP({n:'',w:'',h:'',q:1}); notify("Bancada Sincronizada!"); } }} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-orange-700 transition-all active:scale-95 text-[10px] uppercase tracking-widest">Registrar Manualmente</button>
        <div className="space-y-2 mt-4">
          {manualParts.map((p: any) => (
             <div key={p.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right-4">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-zinc-800">{p.n || "Peça Manual"}</span>
                 <span className="text-[8px] text-zinc-400 font-bold uppercase">Ajuste de Projeto</span>
               </div>
               <div className="flex items-center gap-4">
                 <span className="text-[10px] font-mono text-amber-600 font-black">{p.w}x{p.h} (x{p.q})</span>
                 <button onClick={() => setManualParts(manualParts.filter((x: any) => x.id !== p.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-all"><Trash2 size={16}/></button>
               </div>
             </div>
          ))}
        </div>
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
             <p className="text-[10px] font-black uppercase text-slate-400 mb-1 leading-none tracking-widest">Lucro Operacional</p>
             <h3 className={`text-4xl font-black tracking-tighter italic ${financeiro.isLowProfit ? 'text-red-600' : 'text-emerald-600'}`}>R$ {financeiro.lucro.toLocaleString('pt-BR')}</h3>
             {financeiro.isLowProfit && <p className="text-[9px] font-bold text-red-400 mt-2 uppercase">Atenção: Margem abaixo do ideal industrial.</p>}
           </div>
           <div className={`p-4 rounded-2xl ${financeiro.isLowProfit ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
             {financeiro.isLowProfit ? <AlertTriangle size={24} /> : <TrendingUp size={24} />}
           </div>
        </div>
      </div>

      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-center shadow-2xl">
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 leading-none">Venda Master Estimada</p>
        <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">R$ {financeiro.venda.toLocaleString('pt-BR')}</h2>
      </div>

      <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-5 shadow-sm">
        <div className="flex justify-between items-center">
           <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Markup de Obra (Estela)</h3>
           <span className="bg-emerald-600 text-white px-3 py-1 rounded-full font-black text-[10px]">{industrialRates.markup}x</span>
        </div>
        <input 
          type="range" min="1.1" max="4" step="0.1" 
          className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
          value={industrialRates.markup} 
          onChange={(e: any) => setIndustrialRates({...industrialRates, markup: parseFloat(e.target.value)})} 
        />
        <div className="flex justify-between text-[8px] font-black text-zinc-300 uppercase">
          <span>Conservador</span>
          <span>Agressivo</span>
        </div>
      </div>

      <button onClick={() => notify("📄 Master Recall: Contrato Gerado!")} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-200">
        <FileSignature size={20} /> Emitir Contrato Industrial
      </button>
    </div>
  );
};

// ============================================================================
// [5. WORKSHOP FEED & UI MASTER]
// ============================================================================

const ChatMessage: React.FC<{ msg: Message; onImageClick: (url: string) => void }> = ({ msg, onImageClick }) => {
  const isUser = msg.type === MessageType.USER;
  const project = msg.project;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`max-w-[88%] p-5 rounded-[2.2rem] shadow-sm text-[13px] leading-relaxed relative ${
        isUser ? 'bg-[#09090b] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-zinc-800 rounded-tl-none shadow-sm'
      }`}>
        {msg.attachment?.type === 'image' && (
          <div className="relative mb-3 group cursor-pointer" onClick={() => onImageClick(msg.attachment!.url)}>
            <img src={msg.attachment.url} className="rounded-[1.5rem] w-full max-h-60 object-cover shadow-md group-hover:brightness-90 transition-all" />
            <div className="absolute top-2 left-2 bg-black/40 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest backdrop-blur-sm">Input de Referência</div>
          </div>
        )}
        
        <div className="text-left font-medium">{msg.content}</div>

        {project && (
          <div className="mt-5 bg-zinc-50 border border-zinc-100 rounded-[2.8rem] overflow-hidden shadow-inner text-zinc-900 text-left">
            <div className="bg-[#09090b] px-8 py-5 flex justify-between items-center text-white">
              <div className="flex flex-col">
                <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 truncate leading-none mb-1">{project.title}</h1>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Processamento v283</p>
              </div>
              <Eye size={22} className="text-amber-500" />
            </div>
            
            <div className="p-5 space-y-4">
              {project.render.status === 'processing' && (
                <div className="aspect-square bg-zinc-200 rounded-[2rem] animate-pulse flex flex-col items-center justify-center gap-3">
                  <RotateCcw size={32} className="animate-spin text-zinc-400" />
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Materializando 3D...</span>
                </div>
              )}
              {project.render.status === 'done' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.faithfulUrl!)}>
                    <img src={project.render.faithfulUrl} className="w-full aspect-square object-cover rounded-[1.8rem] shadow-md hover:scale-[1.02] transition-transform" />
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Render Fiel</span>
                  </div>
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.decoratedUrl!)}>
                    <img src={project.render.decoratedUrl} className="w-full aspect-square object-cover rounded-[1.8rem] shadow-md hover:scale-[1.02] transition-transform" />
                    <span className="absolute bottom-2 left-2 bg-amber-600/80 text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Showroom Profissional</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t border-zinc-200 pt-5 mt-2">
                <div className="text-left">
                  <p className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest mb-1 leading-none">Venda Sugerida</p>
                  <p className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">R$ {project.pricing.finalPrice?.toLocaleString('pt-BR')}</p>
                </div>
                <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚀 MarcenApp: Projeto de ${project.title} orquestrado!`)}`, '_blank')} className="w-14 h-14 bg-[#09090b] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl active:scale-90 transition-all hover:bg-zinc-800">
                  <MessageSquare size={24} className="text-amber-500" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-[8px] opacity-30 text-right mt-2 font-mono uppercase tracking-widest">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isUser && <span className="ml-1 text-blue-500">✓✓</span>}
        </div>
      </div>
    </div>
  );
};

const WorkshopInner = () => {
  const { state, dispatch, financeiro, activeModal, setActiveModal, notify, industrialRates } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
        content: "YARA 3.0: Orquestrando dados técnicos e extraindo DNA industrial...", 
        timestamp: new Date(), 
        status: 'processing' 
      } 
    });

    try {
      // 1. Parse de DNA (YaraPipeline)
      const parsed = await YaraPipeline.parse({ text, attachment });
      if (parsed) {
        dispatch({ 
          type: 'PROGRESS_UPDATE', id: iaraId, 
          payload: { ...parsed, render: { status: 'processing' } },
          stepUpdate: { parsed: true }
        });

        // 2. Renderização Dual (RenderEngine)
        const renderRes = await RenderEngine.generate(parsed as ProjectData, attachment?.data);
        
        // 3. Otimização de Corte (CNCOptimizer)
        const cutPlan = await CNCOptimizer.optimize(parsed as ProjectData);

        // 4. Precificação Master (PricingEngine)
        const pricing = PricingEngine.calculate(parsed as ProjectData, industrialRates);

        const finalProject = { ...parsed, render: renderRes, pricing, cutPlan };

        dispatch({
          type: 'UPDATE_MESSAGE', id: iaraId,
          payload: { 
            content: "Engenharia Master concluída. Projeto materializado e precificado com sucesso.",
            project: finalProject,
            status: 'done'
          }
        });
        notify("🚀 Orquestração v283 Concluída!");
      }
    } catch (e) {
      console.error(e);
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Erro na orquestração industrial. Verifique o input.", status: 'error' } });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handlePipeline("", { 
        type: 'image', 
        url: URL.createObjectURL(file), 
        data: (ev.target?.result as string).split(',')[1] 
      });
    };
    reader.readAsDataURL(file);
  };

  const BANCADAS = [
    { id: 'BENTO', title: 'Engenharia Bento', color: 'bg-orange-600', icon: Wrench },
    { id: 'ESTELA', title: 'Financeiro Estela', color: 'bg-emerald-600', icon: DollarSign },
    { id: 'IARA', title: 'Preview IARA Vision', color: 'bg-purple-600', icon: Rotate3d },
    { id: 'JUCA', title: 'Instalação Juca', color: 'bg-slate-700', icon: HardHat },
    { id: 'CRM', title: 'Leads & Negócios', color: 'bg-blue-600', icon: Users },
    { id: 'ADMIN', title: 'Dashboard Master', color: 'bg-zinc-900', icon: BarChart3 }
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden relative font-sans text-left">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-white sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl relative border-zinc-900 sm:border-[12px]">
        {/* TOP COCKPIT */}
        <header className="bg-[#09090b] pt-14 pb-8 px-8 flex items-center justify-between text-white shadow-2xl z-30 shrink-0 border-b border-amber-600/10">
          <div className="flex items-center gap-4">
            <LogoSVG size={40} />
            <div className="flex flex-col">
              <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 leading-none mb-1">MARCENAPP SUPREME</h1>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">v283 INDUSTRIAL RECALL</p>
            </div>
          </div>
          <button onClick={() => setActiveModal('ADMIN')} className="p-3 bg-white/5 rounded-2xl text-amber-500 hover:bg-white/10 transition-all border border-white/5 shadow-xl"><LayoutDashboard size={20} /></button>
        </header>

        {/* FEED PRINCIPAL */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-10 bg-[#fdfdfd] custom-scrollbar pb-32">
          {state.messages.map((msg: Message) => <ChatMessage key={msg.id} msg={msg} onImageClick={setSelectedImage} />)}
        </main>

        {/* CONTROLES DE INPUT FLUTUANTES */}
        <footer className="bg-white/95 backdrop-blur-3xl px-4 py-4 border-t border-zinc-100 flex items-center gap-3 z-50 pb-8 sm:pb-6 shrink-0 shadow-[0_-15px_50px_rgba(0,0,0,0.08)]">
          <div className="relative">
            <button 
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)} 
              className={`w-12 h-12 flex items-center justify-center rounded-[1.3rem] transition-all shadow-xl active:scale-90 ${isToolsMenuOpen ? 'bg-zinc-900 rotate-45 text-white' : 'bg-orange-600 text-white shadow-orange-500/30'}`}
            >
              <Plus size={26} />
            </button>
          </div>

          <div className="flex-1 bg-zinc-100 rounded-2xl flex items-center px-4 py-2 border border-zinc-200 shadow-inner group focus-within:bg-white transition-all">
            <input 
              type="text" placeholder="Dite ou envie o DNA..." 
              className="w-full text-[13px] outline-none bg-transparent py-2 font-semibold placeholder-zinc-400" 
              value={inputText} onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} 
            />
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-2 transition-all"><Camera size={18} /></button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <button 
            onClick={() => handlePipeline(inputText)} 
            className={`w-12 h-12 rounded-[1.3rem] flex items-center justify-center active:scale-95 shadow-xl transition-all ${inputText.trim() ? 'bg-orange-600 text-white shadow-orange-500/20' : 'bg-zinc-900 text-white shadow-zinc-500/20'}`}
          >
            {inputText.trim() ? <Send size={20}/> : <Mic size={20}/>}
          </button>
        </footer>

        {/* TOOL PORTAL SELECTION */}
        {isToolsMenuOpen && (
          <div className="fixed inset-0 z-[100000] pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[6px] pointer-events-auto" onClick={() => setIsToolsMenuOpen(false)} />
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-[#09090b] border border-white/10 rounded-[3rem] shadow-2xl p-4 flex flex-col gap-2 pointer-events-auto animate-in slide-in-from-bottom-12 duration-500">
               <div className="px-6 py-2 mb-2"><p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em]">Cockpit Selection</p></div>
               {BANCADAS.map(tool => (
                 <button key={tool.id} onClick={() => { setActiveModal(tool.id); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-[2rem] transition-all text-left group">
                    <div className={`p-3.5 rounded-2xl ${tool.color} group-active:scale-90 transition-all shadow-lg ring-4 ring-black`}>
                      {React.createElement(tool.icon, { size: 20, className: "text-white" })}
                    </div>
                    <span className="text-[11px] font-black uppercase text-white tracking-[0.2em] group-hover:text-amber-500 transition-colors">{tool.title}</span>
                 </button>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* DRAWERS SUPREME */}
      <Drawer id="BENTO" title="Engenharia Bento" color="bg-orange-600" icon={Wrench}><BentoBancada /></Drawer>
      <Drawer id="ESTELA" title="Financeiro Estela" color="bg-emerald-600" icon={DollarSign}><EstelaBancada /></Drawer>
      <Drawer id="IARA" title="Preview IARA Vision" color="bg-purple-600" icon={Rotate3d}><IaraVisionBancada /></Drawer>
      <Drawer id="JUCA" title="Instalação Juca" color="bg-slate-700" icon={HardHat}><JucaBancada /></Drawer>
      <Drawer id="CRM" title="Gestão de Negócios" color="bg-blue-600" icon={Users}><MarceneiroCRMBancada /></Drawer>
      <Drawer id="ADMIN" title="Dashboard Master" color="bg-zinc-900" icon={BarChart3}>
        <div className="space-y-4">
          <MetricCard label="Faturamento em Carteira" value={`R$ ${financeiro.venda.toLocaleString('pt-BR')}`} icon={<Package size={22}/>} color="bg-blue-50" />
          <MetricCard label="Lucro Projeto v283" value={`R$ ${financeiro.lucro.toLocaleString('pt-BR')}`} icon={<TrendingUp size={22}/>} color="bg-green-50" highlight />
          <MetricCard label="Área de Produção" value={`${financeiro.area.toFixed(2)} m²`} icon={<Hammer size={22}/>} color="bg-amber-50" />
          <div className="p-8 bg-zinc-900 rounded-[2.8rem] mt-6 flex items-center justify-between text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-1 opacity-10"><LogoSVG size={100}/></div>
             <div className="text-left relative z-10">
               <p className="text-[10px] font-black uppercase text-amber-500 italic mb-1 tracking-widest">Patente Industrial</p>
               <h4 className="text-xl font-black italic tracking-tighter uppercase">Operação Supreme v283</h4>
             </div>
             <Award className="text-amber-500 relative z-10" size={36} />
          </div>
        </div>
      </Drawer>

      {/* VIEWER FOTORREALISTA */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-700" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center">
            <img src={selectedImage} className="max-w-full max-h-[82vh] rounded-[3.5rem] shadow-2xl border border-white/5 transition-all duration-1000 hover:scale-[1.02] select-none shadow-[0_50px_100px_rgba(0,0,0,0.5)]" />
            <div className="absolute top-10 right-0">
               <button className="p-6 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md border border-white/10" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}><X size={36}/></button>
            </div>
            <div className="mt-10 flex gap-6">
               <button className="px-10 py-5 bg-white/5 text-white rounded-full font-black uppercase text-[10px] tracking-[0.3em] border border-white/10 hover:bg-white/10 transition-all active:scale-95">Salvar Projeto</button>
               <button className="px-10 py-5 bg-amber-600 text-white rounded-full font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-amber-600/30 active:scale-95 transition-all hover:bg-amber-500">Enviar para Cliente</button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RECALL BUTTON */}
      <button onClick={() => window.location.reload()} className="fixed bottom-6 left-6 p-5 bg-slate-900/40 text-white rounded-full backdrop-blur-xl opacity-20 hover:opacity-100 transition-all z-[100000] flex items-center justify-center shadow-2xl border border-white/10 hover:scale-110 active:rotate-180"><RotateCcw size={20} /></button>
    </div>
  );
};

// ============================================================================
// [6. ENTRY POINT]
// ============================================================================

const App: React.FC = () => {
  const [state, dispatch] = useReducer(marcenaReducer, {
    messages: [{ 
      id: 'welcome', type: MessageType.IARA, 
      content: 'Mestre, Cockpit v283 Supreme em prumo. YARA 3.0 orquestrada e aguardando comando industrial.', 
      timestamp: new Date(), status: 'done' 
    }],
    isLoading: false,
    isAdminMode: false
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [manualParts, setManualParts] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [industrialRates, setIndustrialRates] = useState({ mdf: MDF_SHEET_PRICE, markup: 1.8 });

  const notify = useCallback((text: string) => {
    const toast = document.createElement('div');
    toast.className = "fixed top-36 left-1/2 -translate-x-1/2 z-[130000] bg-[#09090b] text-white text-[11px] font-black px-14 py-7 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-6 border border-amber-600/40 uppercase tracking-[0.3em] text-center whitespace-nowrap shadow-[0_20px_60px_rgba(0,0,0,0.3)]";
    toast.innerText = text;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-6');
      setTimeout(() => toast.remove(), 700);
    }, 4000);
  }, []);

  const financeiro = useFinanceiro(state.messages, industrialRates, manualParts);

  return (
    <MarcenaContext.Provider value={{ 
      state, dispatch, financeiro, activeModal, setActiveModal, 
      manualParts, setManualParts, industrialRates, setIndustrialRates,
      deliveryDate, setDeliveryDate, notify 
    }}>
      <WorkshopInner />
    </MarcenaContext.Provider>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
