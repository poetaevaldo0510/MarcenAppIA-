
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
// [1. CONTEXTO & HOOKS DE INTELIGÊNCIA]
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

      const custoMDF = (totalAreaM2 / MDF_SHEET_AREA) * industrialRates.mdf;
      const custoTotal = custoMDF * 1.35; 
      const lucro = (custoTotal * industrialRates.markup) - custoTotal;
      const precoVenda = custoTotal + lucro;
      
      return { 
        area: totalAreaM2,
        custo: custoTotal,
        venda: precoVenda,
        lucro: lucro,
        chapas: Math.ceil(totalAreaM2 / (MDF_SHEET_AREA * 0.85)),
        isLowProfit: lucro < (custoTotal * 0.35)
      };
    } catch (e) { 
      return { venda: 0, lucro: 0, area: 0, chapas: 0, isLowProfit: false }; 
    }
  }, [messages, industrialRates, manualParts]);
}

// ============================================================================
// [2. MOTORES DE IA E RENDER]
// ============================================================================

const YaraPipeline = {
  parse: async (input: { text?: string; attachment?: Attachment }): Promise<Partial<ProjectData> | null> => {
    const parts: any[] = [{ text: input.text || "Análise técnica de projeto para marcenaria." }];
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

const RenderEngine = {
  generate: async (project: ProjectData, sketchData?: string) => {
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

    const [faithful, decorated] = await Promise.all([
      getImg(
        `Technical 3D woodworking render. Piece: ${project.title}. High fidelity to the provided sketch. Professional studio lighting, clean backgrounds, realistic textures of ${project.modules[0]?.material || 'MDF'}.`, 
        sketchData
      ),
      getImg(
        `Professional interior design photography. Modern room with the ${project.title} furniture. Luxury home staging, soft sunlight, architectural photography style, 8k resolution.`,
        sketchData
      )
    ]);

    return { status: 'done', faithfulUrl: faithful, decoratedUrl: decorated };
  }
};

// ============================================================================
// [3. COMPONENTES DE UI SUPREME]
// ============================================================================

const LogoSVG = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#09090b" />
    <path d="M25 75V25H45L50 40L55 25H75V75H62V40L50 65L38 40V75H25Z" fill="white" />
    <circle cx="50" cy="15" r="4" fill="#D97706" />
  </svg>
);

const BrandHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col text-left">  
    <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 truncate max-w-[180px] leading-none mb-1">  
      {title}  
    </h1>  
    {subtitle && <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{subtitle}</p>}  
  </div>
);

const MetricCard = ({ label, value, icon, color, highlight }: any) => (
  <div className={`p-6 rounded-[32px] shadow-sm border border-slate-100 bg-white flex items-center justify-between ${highlight ? 'ring-2 ring-green-500/20' : ''} text-zinc-900 text-left`}>  
    <div className="text-left text-zinc-900">  
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3 text-zinc-800`}>{icon}</div>  
      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>  
      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h4>  
    </div>  
    <ArrowUpRight size={18} className="text-slate-300" />  
  </div>
);

const Drawer: React.FC<{ id: string; title: string; color: string; icon: any; children: React.ReactNode }> = ({ id, title, color, icon: Icon, children }) => {
  const { activeModal, setActiveModal } = useContext(MarcenaContext);
  if (activeModal !== id) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in" onClick={() => setActiveModal(null)} />
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden text-zinc-900">
        <header className={`${color} p-6 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-4">
            {Icon && <Icon size={24} />}
            <h2 className="text-lg font-black uppercase tracking-tight font-mono text-white">{title}</h2>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-2 bg-white/20 rounded-full active:scale-95 text-white transition-all"><X size={20}/></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar text-zinc-900 text-left">
          {children}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// [4. BANCADAS E MODAIS]
// ============================================================================

const BentoBancada = () => {
  const { state, financeiro, manualParts, setManualParts, notify } = useContext(MarcenaContext);
  const [newP, setNewP] = useState({ n: '', w: '', h: '', q: 1 });

  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="p-6 bg-white rounded-3xl border shadow-sm">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Reserva MDF</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{financeiro?.chapas || 0} Chapas</p>
          </div>
          <div className="text-right text-[10px] font-black text-orange-600 italic">Industrial Master</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Peças de Engenharia (IA)</h3>
        {state.messages.filter(m => m.project).map((msg, idx) => (
          <div key={idx} className="bg-white border-2 rounded-[2.5rem] overflow-hidden shadow-sm">
             <div className="bg-zinc-900 p-5 text-white flex justify-between items-center">
               <BrandHeading title={msg.project!.title} subtitle="Extração DNA" />
               <Cpu size={18} className="text-amber-500" />
             </div>
             <div className="p-4 overflow-x-auto">
               <table className="w-full text-left text-[11px]">
                 <thead>
                   <tr className="text-zinc-400 font-black uppercase text-[9px] border-b">
                     <th className="pb-2">Módulo</th>
                     <th className="pb-2 text-center">Medidas</th>
                     <th className="pb-2 text-center">Qtd</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y text-zinc-900">
                   {msg.project!.modules.map((p: any, i: number) => (
                     <tr key={i}>
                       <td className="py-3 font-bold uppercase">{p.type}</td>
                       <td className="py-3 text-amber-700 font-mono text-center">{p.dimensions.w}x{p.dimensions.h}</td>
                       <td className="py-3 font-black text-center">1</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white rounded-3xl border-2 border-dashed border-orange-200 space-y-4">
        <h3 className="text-xs font-black uppercase text-orange-600">Acrescentar Manualmente</h3>
        <input placeholder="Descrição da Peça" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500" value={newP.n} onChange={e => setNewP({...newP, n: e.target.value})} />
        <div className="flex gap-3">
          <input type="number" placeholder="Largura (mm)" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-xs" value={newP.w} onChange={e => setNewP({...newP, w: e.target.value})} />
          <input type="number" placeholder="Altura (mm)" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-xs" value={newP.h} onChange={e => setNewP({...newP, h: e.target.value})} />
          <input type="number" placeholder="Qtd" className="w-20 p-3 bg-slate-50 rounded-xl font-bold text-xs" value={newP.q} onChange={e => setNewP({...newP, q: parseInt(e.target.value) || 1})} />
        </div>
        <button onClick={() => { if(parseFloat(newP.w) > 0) { setManualParts([...manualParts, {...newP, id: Date.now(), w: parseFloat(newP.w), h: parseFloat(newP.h)}]); setNewP({n:'',w:'',h:'',q:1}); notify("Bancada Atualizada!"); } }} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-orange-700 transition-all active:scale-95">REGISTRAR PEÇA</button>
        <div className="space-y-2">
          {manualParts.map((p: any) => (
             <div key={p.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
               <div className="flex flex-col">
                 <span className="text-xs font-black uppercase text-zinc-800">{p.n || "Item Manual"}</span>
                 <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Acabamento Padrão</span>
               </div>
               <div className="flex items-center gap-4">
                 <span className="text-xs font-mono text-amber-600 font-black">{p.w}x{p.h} (x{p.q})</span>
                 <button onClick={() => setManualParts(manualParts.filter((x: any) => x.id !== p.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-all"><Trash2 size={16}/></button>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const IaraVisionBancada = () => {
  const { state } = useContext(MarcenaContext);
  const projects = state.messages.filter(m => m.project && m.project.render.status === 'done');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
             <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto"><Rotate3d size={40}/></div>
             <p className="font-black text-zinc-400 uppercase text-xs tracking-[0.2em]">Nenhum render orquestrado ainda</p>
          </div>
        )}
        {projects.map((msg: Message, idx: number) => (
          <div key={idx} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-zinc-100 group">
             <div className="p-6 bg-zinc-900 text-white flex justify-between items-center">
                <BrandHeading title={msg.project!.title} subtitle="Showroom Vision" />
                <Eye size={20} className="text-amber-500" />
             </div>
             <div className="p-2 space-y-2">
                <img src={msg.project!.render.faithfulUrl} className="w-full aspect-square object-cover rounded-[2rem] shadow-inner" />
                <img src={msg.project!.render.decoratedUrl} className="w-full aspect-square object-cover rounded-[2rem] shadow-inner" />
             </div>
             <div className="p-6 border-t flex justify-between items-center">
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-zinc-400">Ambiente</p>
                  <p className="font-black text-zinc-900 text-sm">{msg.project!.environment.width}x{msg.project!.environment.height} mm</p>
                </div>
                <button className="p-4 bg-purple-600 text-white rounded-full active:scale-95 transition-all shadow-lg shadow-purple-200">
                  <Zap size={20} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarceneiroCRMBancada = () => {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
           <input className="w-full bg-white p-4 pl-12 rounded-2xl border-none shadow-sm font-bold text-sm outline-none focus:ring-2 ring-blue-500/20" placeholder="Buscar cliente ou projeto..." />
        </div>
        <button className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><UserPlus size={20}/></button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { name: "Carlos Ferreira", project: "Cozinha Americana Premium", status: "Orçamento", value: 12500, date: "Hoje" },
          { name: "Amanda Souza", project: "Dormitório Master", status: "Produção", value: 8900, date: "Ontem" },
          { name: "Roberto Marinho", project: "Closet Integrado", status: "Lead", value: 22000, date: "2 dias atrás" }
        ].map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-blue-500/50 transition-all cursor-pointer">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">{c.name[0]}</div>
                <div className="text-left">
                  <p className="font-black text-zinc-900 uppercase text-xs tracking-tight">{c.name}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">{c.project}</p>
                  <div className="flex gap-2">
                    <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{c.status}</span>
                    <span className="text-[8px] font-black text-zinc-300 uppercase italic">{c.date}</span>
                  </div>
                </div>
             </div>
             <div className="text-right">
                <p className="text-sm font-black text-zinc-900">R$ {c.value.toLocaleString('pt-BR')}</p>
                <ChevronRight size={18} className="text-zinc-300 ml-auto mt-1" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Fix: Added missing EstelaBancada component for financial management.
 */
const EstelaBancada = () => {
  const { financeiro, industrialRates, setIndustrialRates } = useContext(MarcenaContext);
  
  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard label="Custo Materiais" value={`R$ ${financeiro.custo.toLocaleString('pt-BR')}`} icon={<DollarSign size={22}/>} color="bg-red-50" />
        <MetricCard label="Preço Sugerido" value={`R$ ${financeiro.venda.toLocaleString('pt-BR')}`} icon={<TrendingUp size={22}/>} color="bg-green-50" />
      </div>

      <div className="p-6 bg-white rounded-3xl border shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Configuração de Markup</h3>
        <div className="flex items-center gap-4">
          <input 
            type="range" min="1.2" max="3.5" step="0.1" 
            className="flex-1 accent-emerald-600"
            value={industrialRates.markup} 
            onChange={(e: any) => setIndustrialRates({...industrialRates, markup: parseFloat(e.target.value)})} 
          />
          <span className="font-black text-emerald-600 text-xl">{industrialRates.markup}x</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-bold uppercase">Ajuste o multiplicador para atingir a margem desejada considerando impostos e logística.</p>
      </div>

      <div className="p-6 bg-[#09090b] text-white rounded-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <BrandHeading title="PROJEÇÃO DE LUCRO" subtitle="Estela Finance" />
          <TrendingUp className="text-emerald-500" size={24} />
        </div>
        <div className="space-y-2">
           <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
             <span>Líquido Estimado</span>
             <span>ROI %</span>
           </div>
           <div className="flex justify-between items-end">
             <span className="text-3xl font-black">R$ {financeiro.lucro.toLocaleString('pt-BR')}</span>
             <span className="text-emerald-400 font-black text-sm">+{financeiro.custo > 0 ? ((financeiro.lucro / financeiro.custo) * 100).toFixed(0) : 0}%</span>
           </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Fix: Added missing JucaBancada component for installation management.
 */
const JucaBancada = () => {
  const { deliveryDate, setDeliveryDate } = useContext(MarcenaContext);

  const tasks = [
    { label: 'Entrega de Chapas', status: 'done', date: '12/10' },
    { label: 'Corte e Bordagem', status: 'processing', date: '14/10' },
    { label: 'Montagem Prévia', status: 'pending', date: '16/10' },
    { label: 'Instalação Cliente', status: 'pending', date: '18/10' }
  ];

  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="p-6 bg-white rounded-3xl border shadow-sm space-y-4">
        <div className="flex items-center gap-3 text-slate-700">
          <Calendar size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest">Data de Entrega Final</h3>
        </div>
        <input 
          type="date" 
          className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-500"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Cronograma de Obra</h3>
        <div className="space-y-3">
          {tasks.map((t, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${t.status === 'done' ? 'bg-green-500' : t.status === 'processing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'}`} />
                <div className="text-left">
                  <p className="text-xs font-black uppercase text-zinc-800">{t.label}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">{t.date}</p>
                </div>
              </div>
              {t.status === 'done' && <CheckCircle size={18} className="text-green-500" />}
            </div>
          ))}
        </div>
      </div>

      <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
        <HardHat size={18} className="text-amber-500" />
        Confirmar Roteiro de Montagem
      </button>
    </div>
  );
};

// ============================================================================
// [5. WORKSHOP FEED E INPUTS]
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
          <div className="relative mb-3 group">
            <img src={msg.attachment.url} className="rounded-[1.5rem] w-full max-h-60 object-cover cursor-pointer shadow-md group-hover:brightness-90 transition-all" onClick={() => onImageClick(msg.attachment.url)} />
            <div className="absolute top-2 left-2 bg-black/40 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Input Industrial</div>
          </div>
        )}
        
        <div className="text-left font-medium">{msg.content}</div>

        {project && (
          <div className="mt-5 bg-zinc-50 border border-zinc-100 rounded-[2.8rem] overflow-hidden shadow-inner text-zinc-900 text-left">
            <div className="bg-[#09090b] px-8 py-5 flex justify-between items-center text-white">
              <BrandHeading title={project.title} subtitle="Orquestração Industrial" />
              <Eye size={22} className="text-amber-500" />
            </div>
            
            <div className="p-5 space-y-4">
              {project.render.status === 'processing' && (
                <div className="aspect-square bg-zinc-200 rounded-[2rem] animate-pulse flex flex-col items-center justify-center gap-3">
                  <RotateCcw size={32} className="animate-spin text-zinc-400" />
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Renderizando 3D...</span>
                </div>
              )}
              {project.render.status === 'done' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.faithfulUrl!)}>
                    <img src={project.render.faithfulUrl} className="w-full aspect-square object-cover rounded-[1.8rem] shadow-md hover:scale-[1.02] transition-transform" />
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">Técnico</span>
                  </div>
                  <div className="relative group cursor-pointer" onClick={() => onImageClick(project.render.decoratedUrl!)}>
                    <img src={project.render.decoratedUrl} className="w-full aspect-square object-cover rounded-[1.8rem] shadow-md hover:scale-[1.02] transition-transform" />
                    <span className="absolute bottom-2 left-2 bg-amber-600/80 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">Showroom</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t border-zinc-200 pt-5 mt-2">
                <div className="text-left">
                  <p className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest mb-1 leading-none">Previsão Industrial</p>
                  <p className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">R$ {project.pricing.finalPrice?.toLocaleString('pt-BR')}</p>
                </div>
                <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚀 MarcenApp: Projeto de ${project.title} finalizado!`)}`, '_blank')} className="w-14 h-14 bg-[#09090b] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl active:scale-90 transition-all">
                  <MessageSquare size={24} className="text-amber-500" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-[8px] opacity-40 text-right mt-2 font-mono uppercase tracking-widest">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isUser && <span className="ml-1 text-blue-500">✓✓</span>}
        </div>
      </div>
    </div>
  );
};

const WorkshopInner = () => {
  const { state, dispatch, financeiro, activeModal, setActiveModal, notify } = useContext(MarcenaContext);
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
      content: text || "Anexo multimodal recebido.",
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
        content: "YARA 3.0: Iniciando extração de DNA industrial...", 
        timestamp: new Date(), 
        status: 'processing' 
      } 
    });

    try {
      const parsed = await YaraPipeline.parse({ text, attachment });
      if (parsed) {
        dispatch({ 
          type: 'PROGRESS_UPDATE', id: iaraId, 
          payload: { ...parsed, render: { status: 'processing' } },
          stepUpdate: { parsed: true }
        });

        const renderRes = await RenderEngine.generate(parsed as ProjectData, attachment?.data);
        const finalProject = { ...parsed, render: renderRes };
        
        const area = (finalProject.modules || []).reduce((s, m) => s + (m.dimensions.w * m.dimensions.h / 1000000), 0);
        const pricing = {
          status: 'done',
          finalPrice: (area * LABOR_RATE_M2 + (Math.ceil(area / MDF_SHEET_AREA) * MDF_SHEET_PRICE)) / (1 - DEFAULT_MARGIN)
        };

        dispatch({
          type: 'UPDATE_MESSAGE', id: iaraId,
          payload: { 
            content: "Engenharia Bento: Projeto materializado. Cockpit industrial atualizado.",
            project: { ...finalProject, pricing },
            status: 'done'
          }
        });
        notify("🚀 Render Finalizado!");
      }
    } catch (e) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Erro no processamento industrial.", status: 'error' } });
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
    { id: 'IARA', title: 'IARA Vision', color: 'bg-purple-600', icon: Rotate3d },
    { id: 'JUCA', title: 'Instalação Juca', color: 'bg-slate-700', icon: HardHat },
    { id: 'CRM', title: 'Gestão CRM', color: 'bg-blue-600', icon: Users },
    { id: 'ADMIN', title: 'Dashboard Master', color: 'bg-zinc-900', icon: BarChart3 }
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden relative font-sans text-left">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-white sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl relative border-zinc-900 sm:border-[10px]">
        {/* HEADER COCKPIT */}
        <header className="bg-[#09090b] pt-14 pb-8 px-8 flex items-center justify-between text-white shadow-2xl z-30 shrink-0 border-b border-amber-600/20">
          <div className="flex items-center gap-4">
            <LogoSVG size={40} />
            <BrandHeading title="MARCENAPP SUPREME" subtitle="V283 MASTER RECALL" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveModal('ADMIN')} className="p-3 bg-white/5 rounded-2xl text-amber-500 hover:bg-white/10 transition-all"><BarChart3 size={20} /></button>
          </div>
        </header>

        {/* FEED PRINCIPAL */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-10 bg-[#fdfdfd] custom-scrollbar pb-32">
          {state.messages.map((msg) => <ChatMessage key={msg.id} msg={msg} onImageClick={setSelectedImage} />)}
        </main>

        {/* BARRA DE INPUT INDUSTRIAL */}
        <footer className="bg-white/95 backdrop-blur-3xl px-4 py-4 border-t border-zinc-100 flex items-center gap-3 z-50 pb-8 sm:pb-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="relative">
            <button 
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)} 
              className={`w-12 h-12 flex items-center justify-center rounded-[1.2rem] transition-all shadow-lg active:scale-90 ${isToolsMenuOpen ? 'bg-zinc-900 rotate-45 text-white' : 'bg-orange-600 text-white shadow-orange-500/20'}`}
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="flex-1 bg-zinc-100 rounded-2xl flex items-center px-4 py-2 border border-zinc-200 shadow-inner group focus-within:bg-white transition-all">
            <input 
              type="text" placeholder="Dite comando ou envie DNA..." 
              className="w-full text-[13px] outline-none bg-transparent py-1 font-semibold placeholder-zinc-400" 
              value={inputText} onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} 
            />
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-1.5 transition-all"><LucideImage size={18} /></button>
              <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-1.5 transition-all"><Camera size={18} /></button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <button 
            onClick={() => handlePipeline(inputText)} 
            className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center active:scale-95 shadow-lg transition-all ${inputText.trim() ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-white'}`}
          >
            {inputText.trim() ? <Send size={20}/> : <Mic size={20}/>}
          </button>
        </footer>

        {/* PORTAL DE FERRAMENTAS FLUTUANTE */}
        {isToolsMenuOpen && (
          <div className="fixed inset-0 z-[100000] pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] pointer-events-auto" onClick={() => setIsToolsMenuOpen(false)} />
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[88%] max-w-[360px] bg-[#09090b] border border-white/10 rounded-[2.8rem] shadow-2xl p-4 flex flex-col gap-2 pointer-events-auto animate-in slide-in-from-bottom-10 duration-300">
               {BANCADAS.map(tool => (
                 <button key={tool.id} onClick={() => { setActiveModal(tool.id); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-3xl transition-all text-left group">
                    <div className={`p-3 rounded-2xl ${tool.color} group-active:scale-90 transition-all shadow-lg`}>
                      {React.createElement(tool.icon, { size: 20, className: "text-white" })}
                    </div>
                    <span className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{tool.title}</span>
                 </button>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAIS SUPREME DRAWERS */}
      <Drawer id="BENTO" title="Engenharia Bento" color="bg-orange-600" icon={Wrench}><BentoBancada /></Drawer>
      <Drawer id="ESTELA" title="Financeiro Estela" color="bg-emerald-600" icon={DollarSign}><EstelaBancada /></Drawer>
      <Drawer id="IARA" title="Preview IARA Vision" color="bg-purple-600" icon={Rotate3d}><IaraVisionBancada /></Drawer>
      <Drawer id="JUCA" title="Instalação Juca" color="bg-slate-700" icon={HardHat}><JucaBancada /></Drawer>
      <Drawer id="CRM" title="Gestão de Negócios" color="bg-blue-600" icon={Users}><MarceneiroCRMBancada /></Drawer>
      <Drawer id="ADMIN" title="Cockpit Master Dashboard" color="bg-zinc-900" icon={BarChart3}>
        <div className="space-y-4">
          <MetricCard label="Volume Negociado" value={`R$ ${financeiro.venda.toLocaleString('pt-BR')}`} icon={<Package size={22}/>} color="bg-blue-50" />
          <MetricCard label="Lucro em Carteira" value={`R$ ${financeiro.lucro.toLocaleString('pt-BR')}`} icon={<TrendingUp size={22}/>} color="bg-green-50" highlight />
          <MetricCard label="Área de Produção" value={`${financeiro.area.toFixed(2)} m²`} icon={<Hammer size={22}/>} color="bg-amber-50" />
          <div className="p-8 bg-zinc-900 rounded-[2.5rem] mt-6 flex items-center justify-between text-white">
             <div className="text-left">
               <p className="text-[10px] font-black uppercase text-zinc-500 italic mb-1">Mestre da Serragem</p>
               <h4 className="text-xl font-black italic">Operação v283</h4>
             </div>
             <Award className="text-amber-500" size={32} />
          </div>
        </div>
      </Drawer>

      {/* FULL PREVIEW VIEWER */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center">
            <img src={selectedImage} className="max-w-full max-h-[80vh] rounded-[3rem] shadow-2xl border border-white/5 transition-all duration-700 hover:scale-[1.03] select-none" />
            <div className="absolute top-10 right-0">
               <button className="p-5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-90"><X size={32}/></button>
            </div>
            <div className="mt-8 flex gap-4">
               <button className="px-8 py-4 bg-white/5 text-white rounded-full font-black uppercase text-[10px] tracking-widest border border-white/10 hover:bg-white/10 transition-all">Download</button>
               <button className="px-8 py-4 bg-orange-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">Compartilhar</button>
            </div>
          </div>
        </div>
      )}

      {/* RECALL RECARGA RÁPIDA */}
      <button onClick={() => window.location.reload()} className="fixed bottom-6 left-6 p-4 bg-slate-900/40 text-white rounded-full backdrop-blur-md opacity-20 hover:opacity-100 transition-all z-[100000] flex items-center justify-center shadow-xl border border-white/10 hover:scale-110 active:scale-90"><RotateCcw size={18} /></button>
    </div>
  );
};

// ============================================================================
// [6. ENTRY POINT DO APP]
// ============================================================================

const App: React.FC = () => {
  const [state, dispatch] = useReducer(marcenaReducer, {
    messages: [{ 
      id: 'welcome', type: MessageType.IARA, 
      content: 'Mestre, Cockpit v283 Supreme em prumo. YARA 3.0 aguardando comando multimodal.', 
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
    toast.className = "fixed top-36 left-1/2 -translate-x-1/2 z-[130000] bg-[#09090b] text-white text-[11px] font-black px-12 py-6 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 border border-amber-600/40 uppercase tracking-widest text-center whitespace-nowrap";
    toast.innerText = text;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-4');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
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
