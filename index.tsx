
import React, { useState, useRef, useEffect, useReducer, createContext, useContext, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Wrench, DollarSign, Eye, HardHat, X, Mic, Calendar,
  TrendingUp, Users, RotateCcw, Rotate3d, Package, FileSignature, 
  CheckCircle, ArrowUpRight, Cpu, Menu, Award, PlayCircle, 
  Image as LucideImage, Camera, Send, Trash2, AlertTriangle, BarChart3,
  Plus, Search, Filter, ClipboardList, Hammer, Zap, UserPlus,
  ChevronRight, Smartphone, LayoutDashboard, MessageSquare, Download, Share2,
  LayoutGrid, FlipHorizontal, Settings
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

// ============================================================================
// [0. GERENCIAMENTO DE ESTADO - REDUCER]
// ============================================================================

const marcenaReducer = (state: MarcenaState, action: any): MarcenaState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE': {
      const newMessages = [...state.messages, action.payload];
      localStorage.setItem('marcenapp_messages', JSON.stringify(newMessages));
      return { ...state, messages: newMessages };
    }
    case 'UPDATE_MESSAGE': {
      const updatedMessages = state.messages.map(m => (m.id === action.id ? { ...m, ...action.payload } : m));
      localStorage.setItem('marcenapp_messages', JSON.stringify(updatedMessages));
      return { ...state, messages: updatedMessages };
    }
    case 'PROGRESS_UPDATE': {
      const progressedMessages = state.messages.map(m => (m.id === action.id ? { 
        ...m, 
        project: { ...(m.project || {}), ...action.payload } as ProjectData,
        progressiveSteps: { ...(m.progressiveSteps || {}), ...action.stepUpdate } as any
      } : m));
      localStorage.setItem('marcenapp_messages', JSON.stringify(progressedMessages));
      return { ...state, messages: progressedMessages };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_HISTORY':
      localStorage.removeItem('marcenapp_messages');
      return { ...state, messages: [] };
    default:
      return state;
  }
};

// ============================================================================
// [1. CONTEXTO E LOGICA DE NEGÓCIO]
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
// [2. MOTORES DE INTELIGÊNCIA (YARA ENGINE)]
// ============================================================================

const YaraPipeline = {
  parse: async (input: { text?: string; attachment?: Attachment }): Promise<Partial<ProjectData> | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: input.text || "Análise técnica de projeto para marcenaria profissional." }];
    if (input.attachment?.data) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: input.attachment.data } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts }],
      config: { 
        systemInstruction: IARA_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;

    try {
      const data = JSON.parse(text);
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
    } catch (e) { 
      console.error("Erro no parsing do JSON da Yara:", e);
      return null; 
    }
  }
};

const RenderEngine = {
  generate: async (project: ProjectData, sketchData?: string) => {
    const getImg = async (prompt: string, ref?: string) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        `Technical 3D woodworking render. Object: ${project.title}. High fidelity to the provided sketch. Professional carpentry studio lighting, detailed MDF textures, clean joinery, industrial aesthetic. Background: Workbench and woodworking tools. 8k resolution.`, 
        sketchData
      ),
      getImg(
        `Professional high-end interior design photography. Modern room with the finished ${project.title} furniture. Luxury home staging, soft cinematic sunlight, architectural magazine quality, 8k resolution, photorealistic material rendering.`,
        sketchData
      )
    ]);

    return { status: 'done', faithfulUrl: faithful, decoratedUrl: decorated };
  }
};

// ============================================================================
// [3. COMPONENTES DE INTERFACE SUPREME]
// ============================================================================

const LogoSVG = ({ size = 24, className = "" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl overflow-visible">
      <rect width="100" height="100" rx="24" fill="#09090b" />
      <path d="M30 70V30H45L50 40L55 30H70V70H60V45L50 60L40 45V70H30Z" fill="white" />
      <path d="M15 15L35 15" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
      <path d="M65 85L85 85" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="85" r="4" fill="#D97706" />
    </svg>
  </div>
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
  <div className={`p-6 rounded-[2.5rem] shadow-sm border border-slate-100 bg-white flex items-center justify-between ${highlight ? 'ring-2 ring-green-500/20' : ''} text-zinc-900 text-left`}>  
    <div className="text-left">  
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
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar text-zinc-900 text-left">
          {children}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// [4. MÓDULOS DE BANCADA (INTERNOS)]
// ============================================================================

const BentoBancada = () => {
  const { state, financeiro, manualParts, setManualParts, notify } = useContext(MarcenaContext);
  const [newP, setNewP] = useState({ n: '', w: '', h: '', q: 1 });

  return (
    <div className="space-y-6 text-zinc-900 text-left">
      <div className="p-6 bg-white rounded-3xl border shadow-sm">
        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Previsão de Suprimentos</p>
            <p className="text-3xl font-black text-slate-800 leading-none">{financeiro?.chapas || 0} Chapas MDF</p>
          </div>
          <Package size={32} className="text-orange-500" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] px-2 flex items-center gap-2">
           <LogoSVG size={16} /> Engenharia IA (DNA Extraído)
        </h3>
        {state.messages.filter(m => m.project).map((msg, idx) => (
          <div key={idx} className="bg-white border-2 rounded-[2.5rem] overflow-hidden shadow-sm">
             <div className="bg-zinc-900 p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <LogoSVG size={32} />
                 <BrandHeading title={msg.project!.title} subtitle="Lista de Corte Industrial" />
               </div>
               <Cpu size={20} className="text-amber-500" />
             </div>
             <div className="p-4 overflow-x-auto">
               <table className="w-full text-left text-[11px] min-w-[300px]">
                 <thead>
                   <tr className="text-zinc-400 font-black uppercase text-[9px] border-b">
                     <th className="pb-3 px-2">Componente</th>
                     <th className="pb-3 text-center">Medidas (mm)</th>
                     <th className="pb-3 text-center">Qtd</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y text-zinc-900">
                   {msg.project!.modules.map((p: any, i: number) => (
                     <tr key={i} className="hover:bg-slate-50">
                       <td className="py-4 px-2 font-bold uppercase">{p.type}</td>
                       <td className="py-4 text-amber-700 font-mono text-center font-bold">{p.dimensions.w} x {p.dimensions.h}</td>
                       <td className="py-4 font-black text-center">1</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-orange-200 space-y-6">
        <div className="flex items-center gap-3 text-orange-600">
          <Hammer size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest">Adição Manual Bento</h3>
        </div>
        <input 
          placeholder="Nome da Peça (Ex: Prateleira de Vidro)" 
          className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500 transition-all" 
          value={newP.n} onChange={e => setNewP({...newP, n: e.target.value})} 
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase text-zinc-400 ml-2">Largura</span>
            <input type="number" placeholder="L" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" value={newP.w} onChange={e => setNewP({...newP, w: e.target.value})} />
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase text-zinc-400 ml-2">Altura</span>
            <input type="number" placeholder="A" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" value={newP.h} onChange={e => setNewP({...newP, h: e.target.value})} />
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase text-zinc-400 ml-2">Qtd</span>
            <input type="number" placeholder="Q" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" value={newP.q} onChange={e => setNewP({...newP, q: parseInt(e.target.value) || 1})} />
          </div>
        </div>
        <button 
          onClick={() => { if(parseFloat(newP.w) > 0) { setManualParts([...manualParts, {...newP, id: Date.now(), w: parseFloat(newP.w), h: parseFloat(newP.h)}]); setNewP({n:'',w:'',h:'',q:1}); notify("Peça Registrada!"); } }} 
          className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-orange-700 transition-all active:scale-95"
        >
          REGISTRAR PEÇA NA BANCADA
        </button>
      </div>
    </div>
  );
};

const EstelaBancada = () => {
  const { financeiro, industrialRates, setIndustrialRates, notify } = useContext(MarcenaContext);
  
  return (
    <div className="space-y-8 text-zinc-900 text-left">
      <div className={`p-8 rounded-[3rem] border-l-[12px] shadow-2xl transition-all ${financeiro.isLowProfit ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Lucro Projetado (Líquido)</p>
            <h3 className={`text-4xl font-black italic tracking-tighter leading-tight ${financeiro.isLowProfit ? 'text-red-600' : 'text-green-600'}`}>R$ {financeiro.lucro.toLocaleString('pt-BR')}</h3>
          </div>
          {financeiro.isLowProfit ? <AlertTriangle className="text-red-500" size={48} /> : <Award className="text-green-500" size={48} />}
        </div>
      </div>

      <div className="p-10 bg-zinc-900 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 p-4 opacity-10"><LogoSVG size={120} /></div>
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={80} className="text-white"/></div>
        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em] mb-3">Total do Orçamento Industrial</p>
        <h2 className="text-5xl font-black text-white italic tracking-tighter">R$ {financeiro.venda.toLocaleString('pt-BR')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard label="Custo Materiais" value={`R$ ${financeiro.custo.toLocaleString('pt-BR')}`} icon={<Package size={20}/>} color="bg-blue-50" />
        <MetricCard label="Área de Produção" value={`${financeiro.area.toFixed(2)} m²`} icon={<Hammer size={20}/>} color="bg-amber-50" />
      </div>

      <div className="p-8 bg-white rounded-3xl border shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Ajuste de Markup Master</h3>
          <span className="bg-emerald-600 text-white px-4 py-1 rounded-full font-black text-xs">{industrialRates.markup}x</span>
        </div>
        <input 
          type="range" min="1.2" max="4.0" step="0.1" 
          className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
          value={industrialRates.markup} 
          onChange={(e: any) => setIndustrialRates({...industrialRates, markup: parseFloat(e.target.value)})} 
        />
      </div>

      <button onClick={() => notify("📄 Contrato Estela Gerado!")} className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl active:scale-95 transition-all">
        <FileSignature size={24} /> Gerar Proposta Comercial PDF
      </button>
    </div>
  );
};

const JucaBancada = () => {
  const { deliveryDate, setDeliveryDate, notify } = useContext(MarcenaContext);
  const tasks = [
    { label: 'Corte e Bordagem Industrial', status: 'done', date: 'Hoje' },
    { label: 'Usinagem e Furação CNC', status: 'processing', date: 'Amanhã' },
    { label: 'Pré-montagem na Oficina', status: 'pending', date: '16/10' },
    { label: 'Logística e Instalação', status: 'pending', date: deliveryDate || '20/10' }
  ];

  return (
    <div className="space-y-8 text-zinc-900 text-left">
      <div className="p-8 bg-white rounded-[2.5rem] border shadow-sm space-y-4">
        <div className="flex items-center gap-3 text-slate-700 mb-2">
          <Calendar size={22} className="text-blue-600" />
          <h3 className="text-xs font-black uppercase tracking-widest">Cronograma de Entrega Final</h3>
        </div>
        <input 
          type="date" 
          className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] px-2 flex items-center gap-2">
          <HardHat size={16} /> Pipeline de Produção Juca
        </h3>
        <div className="space-y-3">
          {tasks.map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-[1.8rem] border flex items-center justify-between shadow-sm group hover:border-blue-200 transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-3.5 h-3.5 rounded-full ${t.status === 'done' ? 'bg-green-500 shadow-green-200 shadow-lg' : t.status === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'}`} />
                <div className="text-left">
                  <p className="text-sm font-black uppercase text-zinc-800 tracking-tight">{t.label}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.date}</p>
                </div>
              </div>
              {t.status === 'done' && <CheckCircle size={20} className="text-green-500" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CRMBancada = () => {
  const leads = [
    { name: "Carlos Ferreira", project: "Cozinha Americana Premium", status: "Orçamento", value: 12500, avatar: "CF" },
    { name: "Amanda Souza", project: "Dormitório Casal Master", status: "Produção", value: 8900, avatar: "AS" },
    { name: "Ricardo Oliveira", project: "Painel Home Office", status: "Lead", value: 4200, avatar: "RO" }
  ];

  return (
    <div className="space-y-8 text-left">
      <div className="flex gap-4">
        <div className="flex-1 relative">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={20}/>
           <input className="w-full bg-white p-5 pl-14 rounded-[1.8rem] shadow-sm font-bold text-sm outline-none border-none focus:ring-2 ring-blue-500/10 transition-all" placeholder="Buscar cliente ou projeto..." />
        </div>
        <button className="p-5 bg-blue-600 text-white rounded-[1.8rem] shadow-lg active:scale-95 transition-all"><UserPlus size={22}/></button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {leads.map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between group hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer">
             <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-zinc-100 rounded-[1.5rem] flex items-center justify-center text-zinc-900 font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">{c.avatar}</div>
                <div className="text-left">
                  <p className="font-black text-zinc-900 uppercase text-sm tracking-tighter leading-none mb-1">{c.name}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{c.project}</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-lg font-black text-zinc-900 tracking-tighter">R$ {c.value.toLocaleString('pt-BR')}</p>
                <ChevronRight size={20} className="text-zinc-300 ml-auto mt-2" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IaraVisionBancada = () => {
  const { state, setActiveModal } = useContext(MarcenaContext);
  const projects = useMemo(() => state.messages.filter(m => m.project && m.project.render.status === 'done'), [state.messages]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.length === 0 && (
          <div className="col-span-full py-32 text-center space-y-6">
             <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto animate-bounce"><Rotate3d size={48}/></div>
             <p className="font-black text-zinc-400 uppercase text-xs tracking-[0.4em]">Nenhum Render Localizado</p>
             <button onClick={() => setActiveModal(null)} className="px-8 py-4 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-widest">Voltar ao Workshop</button>
          </div>
        )}
        {projects.map((msg: Message, idx: number) => (
          <div key={idx} className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-100 group transition-all hover:scale-[1.01]">
             <div className="p-8 bg-zinc-900 text-white flex justify-between items-center">
                <BrandHeading title={msg.project!.title} subtitle="Galeria Showroom Vision" />
                <Award size={24} className="text-amber-500" />
             </div>
             <div className="p-6 grid grid-cols-1 gap-6">
                <img src={msg.project!.render.faithfulUrl} className="w-full aspect-square object-cover rounded-[2rem] shadow-inner border border-zinc-100" alt="Technical Render" />
                <img src={msg.project!.render.decoratedUrl} className="w-full aspect-square object-cover rounded-[2rem] shadow-inner border border-zinc-100" alt="Showroom Render" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// [5. CHAT FEED E INPUTS (WORKSHOP)]
// ============================================================================

const CameraModal: React.FC<{ isOpen: boolean; onClose: () => void; onCapture: (data: string) => void }> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera access denied", err);
          alert("Acesso à câmera negado. Verifique as permissões.");
          onClose();
        });
    } else {
      if (stream) stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [isOpen]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        onCapture(data);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120000] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg aspect-[3/4] bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-x-0 bottom-10 flex justify-center items-center gap-10">
          <button onClick={onClose} className="p-6 bg-white/10 text-white rounded-full backdrop-blur-md active:scale-90 transition-all">
            <X size={32} />
          </button>
          <button onClick={capture} className="w-24 h-24 bg-white rounded-full border-[6px] border-zinc-900/50 shadow-2xl active:scale-95 transition-all flex items-center justify-center">
            <div className="w-16 h-16 bg-orange-600 rounded-full" />
          </button>
          <div className="w-12 h-12" />
        </div>
      </div>
      <p className="mt-8 text-white/50 font-black uppercase text-[10px] tracking-[0.4em] text-center">Posicione o rascunho ou ambiente para o escaneamento YARA</p>
    </div>
  );
};

const ChatMessage: React.FC<{ msg: Message; onImageClick: (url: string) => void }> = ({ msg, onImageClick }) => {
  const { setActiveModal } = useContext(MarcenaContext);
  const isUser = msg.type === MessageType.USER;
  const project = msg.project;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`max-w-[90%] p-6 rounded-[2.5rem] shadow-sm text-[13px] leading-relaxed relative ${
        isUser ? 'bg-[#09090b] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-zinc-800 rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
      }`}>
        {!isUser && (
          <div className="absolute -left-3 -top-3">
             <LogoSVG size={28} />
          </div>
        )}
        {msg.attachment?.type === 'image' && (
          <div className="relative mb-4 group overflow-hidden rounded-[1.8rem]">
            <img src={msg.attachment.url} className="w-full max-h-64 object-cover cursor-pointer shadow-md group-hover:scale-105 transition-all duration-700" onClick={() => onImageClick(msg.attachment.url)} alt="Attachment" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest">DNA Sincronizado</div>
          </div>
        )}
        
        <div className="text-left font-medium tracking-tight whitespace-pre-wrap">{msg.content}</div>

        {project && (
          <div className="mt-6 bg-[#fcfcfc] border border-zinc-100 rounded-[3rem] overflow-hidden shadow-inner text-zinc-900 text-left">
            <div className="bg-[#09090b] px-8 py-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <LogoSVG size={32} />
                <BrandHeading title={project.title} subtitle="Renderização v283 Supreme" />
              </div>
              <Award size={22} className="text-amber-500 animate-pulse" />
            </div>
            
            <div className="p-6 space-y-5">
              {project.render.status === 'done' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group cursor-pointer overflow-hidden rounded-[2rem]" onClick={() => onImageClick(project.render.faithfulUrl!)}>
                    <img src={project.render.faithfulUrl} className="w-full aspect-square object-cover shadow-lg group-hover:scale-110 transition-all duration-700" alt="Technical" />
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Fiel</span>
                  </div>
                  <div className="relative group cursor-pointer overflow-hidden rounded-[2rem]" onClick={() => onImageClick(project.render.decoratedUrl!)}>
                    <img src={project.render.decoratedUrl} className="w-full aspect-square object-cover shadow-lg group-hover:scale-110 transition-all duration-700" alt="Decorated" />
                    <span className="absolute bottom-3 left-3 bg-amber-600/80 backdrop-blur-md text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Showroom</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-end border-t border-zinc-100 pt-6 mt-2">
                <div className="text-left">
                  <p className="text-[9px] font-black text-zinc-300 uppercase italic tracking-[0.3em] mb-2 leading-none">Orçamento Estimado</p>
                  <p className="text-4xl font-black text-zinc-900 tracking-tighter leading-none">R$ {project.pricing.finalPrice?.toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setActiveModal('IARA')} className="w-14 h-14 bg-purple-100 text-purple-600 rounded-[1.8rem] flex items-center justify-center shadow-lg active:scale-90 transition-all">
                     <LayoutGrid size={24} />
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

const WorkshopInner = () => {
  const { state, dispatch, financeiro, activeModal, setActiveModal, notify } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.messages]);

  const handlePipeline = async (text: string, attachment?: Attachment) => {
    if (!text && !attachment) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      type: MessageType.USER,
      content: text || "Input multimodal sincronizado.",
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
        content: "YARA 3.0: Iniciando processamento de DNA...", 
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
            content: "Análise técnica concluída. Os ativos de produção e renderização já estão disponíveis na galeria e nas bancadas.",
            project: { ...finalProject, pricing },
            status: 'done'
          }
        });
        notify("🚀 Orquestração Finalizada!");
      }
    } catch (e) {
      dispatch({ type: 'UPDATE_MESSAGE', id: iaraId, payload: { content: "Erro crítico no motor Yara. Tente reenviar o DNA do projeto.", status: 'error' } });
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
    { id: 'IARA', title: 'Galeria Master Vision', color: 'bg-purple-600', icon: LucideImage },
    { id: 'BENTO', title: 'Engenharia Bento', color: 'bg-orange-600', icon: Wrench },
    { id: 'ESTELA', title: 'Financeiro Estela', color: 'bg-emerald-600', icon: DollarSign },
    { id: 'JUCA', title: 'Agenda Juca', color: 'bg-slate-700', icon: HardHat },
    { id: 'CRM', title: 'Gestão CRM Master', color: 'bg-blue-600', icon: Users },
    { id: 'ADMIN', title: 'Painel Master Admin', color: 'bg-zinc-900', icon: BarChart3 }
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden relative font-sans text-left">
      <div className="w-full max-w-[500px] mx-auto h-screen bg-white sm:rounded-[4rem] overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative border-zinc-900 sm:border-[12px] sm:my-auto">
        
        {/* HEADER SUPREME */}
        <header className="bg-[#09090b] pt-8 pb-10 px-10 flex items-center justify-between text-white shadow-2xl z-30 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-5 relative">
            <LogoSVG size={44} />
            <BrandHeading title="MARCENAPP SUPREME" subtitle="V283 INDUSTRIAL Cockpit" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveModal('IARA')} className={`p-4 rounded-2xl transition-all relative ${activeModal === 'IARA' ? 'bg-purple-600 text-white' : 'bg-white/5 text-purple-400 hover:bg-white/10'}`}>
              <LayoutGrid size={24} />
            </button>
            <button onClick={() => setActiveModal('ADMIN')} className="p-4 bg-white/5 rounded-2xl text-amber-500 hover:bg-white/10 transition-all relative">
              <BarChart3 size={24} />
            </button>
          </div>
        </header>

        {/* FEED PRINCIPAL */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-12 bg-[#fdfdfd] custom-scrollbar pb-36">
          {state.messages.map((msg) => <ChatMessage key={msg.id} msg={msg} onImageClick={setSelectedImage} />)}
        </main>

        {/* FOOTER INPUTS */}
        <footer className="bg-white/95 backdrop-blur-3xl px-6 py-6 border-t border-zinc-50 flex items-center gap-4 z-50 pb-12 sm:pb-8 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.08)]">
          <button 
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)} 
            className={`w-14 h-14 flex items-center justify-center rounded-[1.4rem] transition-all shadow-xl active:scale-90 ${isToolsMenuOpen ? 'bg-zinc-900 rotate-45 text-white' : 'bg-orange-600 text-white shadow-orange-500/30'}`}
          >
            <Plus size={28} />
          </button>

          <div className="flex-1 bg-zinc-100/80 rounded-[1.4rem] flex items-center px-5 py-3 border border-zinc-200 shadow-inner group focus-within:bg-white transition-all">
            <input 
              type="text" placeholder="DNA ou comando..." 
              className="w-full text-sm outline-none bg-transparent py-1 font-bold" 
              value={inputText} onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} 
            />
            <div className="flex items-center gap-2 ml-3">
              <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-orange-600 p-2 transition-all"><LucideImage size={22} /></button>
              <button onClick={() => setIsCameraOpen(true)} className="text-zinc-400 hover:text-orange-600 p-2 transition-all"><Camera size={22} /></button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <button 
            onClick={() => handlePipeline(inputText)} 
            className="w-14 h-14 rounded-[1.4rem] flex items-center justify-center active:scale-95 shadow-xl transition-all bg-orange-600 text-white"
          >
            <Send size={22}/>
          </button>
        </footer>

        {/* CAMERA MODAL */}
        <CameraModal 
          isOpen={isCameraOpen} 
          onClose={() => setIsCameraOpen(false)} 
          onCapture={(data) => handlePipeline("Captura de câmera industrial para análise YARA.", { type: 'image', url: 'camera_capture.jpg', data })} 
        />

        {/* PORTAL DE BANCADAS */}
        {isToolsMenuOpen && (
          <div className="fixed inset-0 z-[100000] pointer-events-none">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px] pointer-events-auto" onClick={() => setIsToolsMenuOpen(false)} />
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-[#09090b] border border-white/10 rounded-[3.5rem] shadow-2xl p-6 flex flex-col gap-3 pointer-events-auto animate-in slide-in-from-bottom-20 duration-500">
               <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] flex items-center gap-2"><LogoSVG size={14} /> Cockpit Central</span>
                  <X size={16} className="text-zinc-500 cursor-pointer" onClick={() => setIsToolsMenuOpen(false)} />
               </div>
               {BANCADAS.map(tool => (
                 <button key={tool.id} onClick={() => { setActiveModal(tool.id); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-5 p-5 hover:bg-white/5 rounded-[1.8rem] transition-all text-left group">
                    <div className={`p-4 rounded-[1.2rem] ${tool.color} group-active:scale-90 transition-all shadow-xl`}>
                      {React.createElement(tool.icon, { size: 24, className: "text-white" })}
                    </div>
                    <span className="text-xs font-black uppercase text-white tracking-[0.2em]">{tool.title}</span>
                 </button>
               ))}
               <button onClick={() => { if(confirm('Limpar histórico industrial?')) dispatch({type:'CLEAR_HISTORY'}); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-5 p-5 hover:bg-red-500/10 rounded-[1.8rem] transition-all text-left group">
                  <div className="p-4 rounded-[1.2rem] bg-red-600 shadow-xl group-active:scale-90 transition-all">
                    <Trash2 size={24} className="text-white" />
                  </div>
                  <span className="text-xs font-black uppercase text-red-500 tracking-[0.2em]">Limpar Histórico</span>
               </button>
            </div>
          </div>
        )}
      </div>

      <Drawer id="BENTO" title="Engenharia Bento Master" color="bg-orange-600" icon={Wrench}><BentoBancada /></Drawer>
      <Drawer id="ESTELA" title="Gestão Financeira Estela" color="bg-emerald-600" icon={DollarSign}><EstelaBancada /></Drawer>
      <Drawer id="IARA" title="Galeria IARA Vision" color="bg-purple-600" icon={LayoutGrid}><IaraVisionBancada /></Drawer>
      <Drawer id="JUCA" title="Agenda Juca" color="bg-slate-700" icon={HardHat}><JucaBancada /></Drawer>
      <Drawer id="CRM" title="Gestão CRM Master" color="bg-blue-600" icon={Users}><CRMBancada /></Drawer>
      <Drawer id="ADMIN" title="Master Performance Panel" color="bg-zinc-900" icon={BarChart3}>
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
             <LogoSVG size={64} />
             <div>
                <h3 className="text-xl font-black text-white italic tracking-tighter">MarcenApp Supreme</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Versão Industrial v283.4</p>
             </div>
          </div>
          <MetricCard label="Faturamento Previsto" value={`R$ ${financeiro.venda.toLocaleString('pt-BR')}`} icon={<Package size={24}/>} color="bg-blue-50" />
          <MetricCard label="Rentabilidade v283" value={`R$ ${financeiro.lucro.toLocaleString('pt-BR')}`} icon={<TrendingUp size={24}/>} color="bg-green-50" highlight />
          
          <div className="p-8 bg-zinc-100 rounded-[2.5rem] border space-y-4">
             <div className="flex items-center gap-3 text-zinc-900">
               <Smartphone size={20} />
               <h4 className="text-xs font-black uppercase tracking-widest">Configurações PWA</h4>
             </div>
             <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">Adicione à tela inicial para acesso instantâneo via WhatsApp ou Desktop.</p>
             <button onClick={() => notify("📱 Siga as instruções do navegador para instalar")} className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Instalar no Dispositivo</button>
          </div>
        </div>
      </Drawer>

      {selectedImage && (
        <div className="fixed inset-0 z-[110000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in" onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} className="max-w-full max-h-[80vh] rounded-[3.5rem] shadow-2xl border border-white/10" alt="Viewer" />
            <button className="mt-8 p-6 bg-white/10 text-white rounded-full"><X size={32}/></button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(marcenaReducer, {
    messages: [],
    isLoading: false,
    isAdminMode: false
  });

  useEffect(() => {
    // Registro de PWA e Carregamento de Histórico
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    const saved = localStorage.getItem('marcenapp_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'SET_MESSAGES', payload: parsed });
      } catch (e) { console.error(e); }
    } else {
      dispatch({ 
        type: 'SET_MESSAGES', 
        payload: [{ 
          id: 'welcome', type: MessageType.IARA, 
          content: 'Mestre, Cockpit v283 Supreme em prumo. YARA 3.0 restaurou seu histórico e atualizou o motor visual para o padrão Industrial.', 
          timestamp: new Date(), status: 'done' 
        }]
      });
    }
  }, []);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [manualParts, setManualParts] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [industrialRates, setIndustrialRates] = useState({ mdf: MDF_SHEET_PRICE, markup: 1.8 });

  const notify = useCallback((text: string) => {
    const toast = document.createElement('div');
    toast.className = "fixed top-20 left-1/2 -translate-x-1/2 z-[200000] bg-zinc-900 text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl border border-white/10 text-center";
    toast.innerText = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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
