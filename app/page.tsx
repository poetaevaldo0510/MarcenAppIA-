
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Wrench, DollarSign, X, Mic, TrendingUp, ShieldCheck, Plus, Package, Menu,
  Image as LucideImage, Camera, Send, Loader2, Sparkles, Maximize, MapPin,
  Layers, ChevronRight, Scissors, Download, Share2, RotateCcw, Users, Zap,
  Settings, Award, Key, FileJson, Wallet, History, CreditCard, ShoppingCart,
  MessageSquarePlus, Calendar, TrendingDown
} from "lucide-react";
import { useStore } from "../store/yaraStore";
import { ChatFlowService } from "../services/chatFlow";
import { UploadService } from "../services/uploadService";
import { CreditsEngine } from "../core/yara-engine/creditsEngine";
import { LogoSVG, BrandHeading } from "../components/ui/Logo";
import { Drawer } from "../components/tools/Drawer";
import { MessageBubble } from "../components/chat/MessageBubble";
import { AdminDashboard } from "../components/admin/AdminDashboard";

export default function Workshop() {
  const store = useStore();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const galInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        store.setHasKey(hasKey);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [store.messages, store.loadingAI]);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      store.setHasKey(true);
      setNeedsKey(false);
    }
  };

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!store.activeClientId) return alert("Selecione um cliente.");
    if (!store.hasKey) {
      setNeedsKey(true);
      return;
    }

    store.addMessage({ 
      from: "user", 
      type: img ? 'image' : 'text',
      text: txt, 
      src: img, 
      status: 'done' 
    });

    setInput(""); setPreview(null);
    store.setLoadingAI(true);
    
    await ChatFlowService.executeMaterialization(txt, img);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await UploadService.toBase64(file);
      setPreview(base64);
    }
  };

  const activeProject = useMemo(() => {
    return store.messages.slice().reverse().find(m => m.project)?.project;
  }, [store.messages]);

  const financeiroTotal = useMemo(() => activeProject?.pricing || { finalPrice: 0, profit: 0, margin: 0, chapas: 0 }, [activeProject]);

  return (
    <div className="flex h-[100dvh] bg-[#09090b] font-sans overflow-hidden">
      {needsKey && (
        <div className="fixed inset-0 z-[200000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 p-10 rounded-[3rem] text-center space-y-8 shadow-[0_0_100px_rgba(217,119,6,0.15)]">
            <div className="mx-auto w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse"><Key size={40} /></div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase text-white tracking-tighter italic">Hardware Bloqueado</h2>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">Conecte sua chave Master do Google Cloud para liberar os motores de renderização e análise 8K.</p>
            </div>
            <button onClick={handleOpenKeySelector} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-xs active:scale-95 transition-all flex items-center justify-center gap-3">
              <Sparkles size={18} /> Conectar Hardware Master
            </button>
          </div>
        </div>
      )}

      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white text-left">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500"><X /></button></div>
          
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] mb-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none">HUB BALANCE</span>
              <Wallet size={14} className="text-amber-500" />
            </div>
            <h4 className="text-2xl font-black italic">{store.credits} <span className="text-[10px] uppercase not-italic opacity-40">credits</span></h4>
            <button onClick={() => store.setModal('BILLING')} className="w-full py-3 bg-amber-600 text-black rounded-xl font-black text-[9px] uppercase hover:bg-amber-500 transition-colors">Recarregar</button>
          </div>

          <button onClick={() => { const n = prompt("Nome do Lead:"); if(n) store.addClient(n); }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-4 flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-200">
            <Plus size={16} /> Novo Lead
          </button>

          <button onClick={() => store.startNewConversation()} className="w-full py-4 bg-zinc-800 text-amber-500 border border-amber-500/20 rounded-2xl font-black text-[9px] uppercase mb-8 flex items-center justify-center gap-2 hover:bg-zinc-700">
            <MessageSquarePlus size={16} /> Nova Conversa
          </button>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4 flex items-center gap-2"><Users size={12}/> Leads Hub</h3>
            {store.clients.map(c => (
              <button key={c.id} onClick={() => { store.setClient(c.id); setSidebar(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${store.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-lg" : "bg-zinc-900 border-white/5 text-zinc-500 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${store.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>M</div>
                <p className="font-black text-[11px] uppercase truncate">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col relative h-[100dvh] bg-white lg:rounded-l-[3.5rem] shadow-2xl overflow-hidden">
        <header className="bg-[#09090b] py-3 px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-4">
            {!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500"><Menu size={32} /></button>}
            <LogoSVG size={45} /><BrandHeading />
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => store.setModal('BILLING')} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
               <Wallet size={18} className="text-amber-500" />
               <span className="text-xs font-black">{store.credits}</span>
             </button>
             <button onClick={() => store.setModal('ADMIN')} className="p-2 bg-white/5 rounded-xl text-emerald-500 border border-emerald-500/10 active:scale-95 transition-all"><ShieldCheck size={24} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-12 bg-[#f8fafc] custom-scrollbar pb-40">
          {store.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30">
               <LogoSVG size={100} />
               <p className="text-[12px] font-black uppercase tracking-widest text-zinc-900">Inicie seu projeto industrial com a Yara.</p>
            </div>
          ) : (
            store.messages.map((m: any) => (
              <MessageBubble key={m.id} message={m} onPreview={(src) => store.setPreview(src)} />
            ))
          )}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <div className="max-w-3xl mx-auto flex gap-4 items-end">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-xl transition-all ${isToolsOpen ? "bg-red-500 text-white" : "bg-[#09090b] text-amber-500"}`}>
              <Plus size={28} className={isToolsOpen ? "rotate-45" : ""} />
            </button>
            <div className="flex-1 bg-slate-100 rounded-[1.5rem] flex items-center px-4 py-1 border border-slate-200 shadow-inner focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
               <button onClick={() => galInputRef.current?.click()} className="p-3 text-slate-400 hover:text-amber-500 transition-colors"><LucideImage size={24}/></button>
               <input placeholder="Fale ou envie seu rascunho para a Yara..." className="flex-1 bg-transparent px-4 py-4 text-base font-bold outline-none text-zinc-900 placeholder-slate-400" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} />
            </div>
            <button onClick={() => handlePipeline(input, preview)} disabled={store.loadingAI || (!input.trim() && !preview)} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-2xl transition-all ${store.loadingAI ? "bg-slate-200 text-slate-400" : "bg-amber-600 text-black active:scale-95"}`}><Send size={28} /></button>
          </div>
          {preview && <div className="max-w-3xl mx-auto mt-4"><div className="relative w-24 h-24 group animate-in zoom-in-50"><img src={preview} className="w-full h-full object-cover rounded-xl border-2 border-amber-500 shadow-lg" /><button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"><X size={14}/></button></div></div>}
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={handleFileChange} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-32 left-8 w-72 bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-bottom-5">
              {[
                { id: 'BILLING', label: 'Hub Financeiro', icon: Wallet, color: 'bg-amber-600' },
                { id: 'BENTO', label: 'Corte CNC', icon: Scissors, color: 'bg-blue-600' },
                { id: 'ESTELA', label: 'Orçamentos Pro', icon: DollarSign, color: 'bg-emerald-600' },
                { id: 'ADMIN', label: 'Engenharia Hub', icon: Settings, color: 'bg-slate-700' },
              ].map(tool => (
                <button key={tool.id} onClick={() => { store.setModal(tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.8rem] text-white transition-all group text-left">
                  <div className={`p-3 rounded-2xl ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon size={20} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Drawer id="BILLING" title="Recarga do Hub" color="bg-amber-600" icon={Wallet}><BillingContent /></Drawer>
        <Drawer id="BENTO" title="Plano de Corte" color="bg-blue-600" icon={Scissors}><CutPlanContent activeProject={activeProject} /></Drawer>
        <Drawer id="ESTELA" title="Orçamento Master" color="bg-emerald-600" icon={DollarSign}><BudgetContent financeiroTotal={financeiroTotal} activeProject={activeProject} /></Drawer>
        
        <Drawer id="ADMIN" title="YARA MASTER ADM" color="bg-zinc-900" icon={ShieldCheck} noPadding>
          <AdminDashboard />
        </Drawer>
      </div>

      {store.selectedImage && (
        <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in" onClick={() => store.setPreview(null)}>
          <img src={store.selectedImage} className="max-w-full max-h-[85vh] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 cursor-zoom-out" />
          <button className="absolute top-10 right-10 p-4 text-white hover:text-amber-500 transition-colors"><X size={40}/></button>
          <div className="absolute bottom-10 flex gap-4">
            <button className="px-8 py-4 bg-white/10 text-white rounded-full font-black uppercase text-[10px] tracking-widest border border-white/20 backdrop-blur-xl flex items-center gap-2 hover:bg-white/20 transition-all"><Download size={18}/> Salvar Render 8K</button>
          </div>
        </div>
      )}
    </div>
  );
}

const BillingContent = () => {
  const store = useStore();
  return (
    <div className="space-y-8 p-6">
      <div className="p-8 bg-amber-600 rounded-[2.5rem] text-black shadow-xl relative overflow-hidden">
        <Sparkles size={80} className="absolute -bottom-4 -right-4 opacity-10" />
        <span className="text-[10px] font-black uppercase opacity-60 mb-2 block">Saldo de Créditos Yara</span>
        <h3 className="text-4xl font-black italic">{store.credits}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {(Object.entries(CreditsEngine.PLANS) as [any, any][]).map(([key, plan]) => (
          <button key={key} onClick={() => { store.changePlan(key); store.addCredits(plan.credits, `Upgrade ${plan.name}`); }} className={`p-6 rounded-[2rem] border-2 transition-all flex justify-between items-center ${store.currentPlan === key ? "bg-amber-50 border-amber-600" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{plan.name}</span>
              <div className="text-xl font-black italic">{plan.credits} credits</div>
            </div>
            <span className="text-lg font-black text-amber-600">R$ {plan.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const CutPlanContent = ({ activeProject }: any) => (
  <div className="space-y-6 p-6">
    <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
      <span className="text-[10px] font-black uppercase opacity-60">Aproveitamento Hub</span>
      <h3 className="text-4xl font-black italic">{activeProject?.cutPlan?.optimizationScore || 0}%</h3>
    </div>
    <div className="space-y-4">
      {activeProject?.cutPlan?.boards?.map((board: any, idx: number) => (
        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Chapa #{board.id} - Industrial 2.75x1.84</p>
          <div className="space-y-2">
            {board.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-600 truncate mr-4">{item.n}</span>
                <span className="font-black text-blue-600 shrink-0">{item.w}x{item.h} mm</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BudgetContent = ({ financeiroTotal, activeProject }: any) => (
  <div className="space-y-6 p-6">
    <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl">
      <span className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-2 block">Preço Final Sugerido</span>
      <h3 className="text-4xl font-black italic">R$ {financeiroTotal.finalPrice?.toLocaleString('pt-BR')}</h3>
    </div>

    <div className="grid grid-cols-2 gap-4">
       <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
             <TrendingUp size={14} className="text-emerald-500" />
             <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Lucro Real</span>
          </div>
          <p className="text-xl font-black italic text-zinc-900">R$ {financeiroTotal.profit?.toLocaleString('pt-BR')}</p>
       </div>
       <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
             <Award size={14} className="text-blue-500" />
             <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Margem (%)</span>
          </div>
          <p className="text-xl font-black italic text-zinc-900">{financeiroTotal.margin?.toFixed(1)}%</p>
       </div>
    </div>

    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
       <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2"><Calendar size={14} /> <span>Prazo Estimado</span></div>
          <span className="text-zinc-900">{activeProject?.pricing?.prazoDias || '--'} Dias</span>
       </div>
       <div className="space-y-3">
         <h4 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest">Detalhamento de Custos</h4>
         {activeProject?.pricing?.materials?.map((m: any, i: number) => (
           <div key={i} className="flex justify-between items-center text-xs">
             <span className="text-slate-500 font-bold uppercase tracking-tight">{m.name}</span>
             <span className="font-black text-zinc-900">R$ {m.cost.toLocaleString('pt-BR')}</span>
           </div>
         ))}
         <div className="flex justify-between items-center text-xs">
             <span className="text-slate-500 font-bold uppercase tracking-tight">Mão de Obra Master</span>
             <span className="font-black text-zinc-900">R$ {activeProject?.pricing?.labor?.toLocaleString('pt-BR')}</span>
         </div>
       </div>
       <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <TrendingDown size={14} className="text-red-500" />
             <span className="text-[10px] font-black uppercase text-red-500 tracking-widest leading-none">Custo Produção</span>
          </div>
          <span className="text-lg font-black text-zinc-900">R$ {activeProject?.pricing?.total?.toLocaleString('pt-BR')}</span>
       </div>
    </div>

    <div className="flex gap-3">
       <button className="flex-1 py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">Enviar via WhatsApp</button>
       <button className="p-5 bg-white border border-slate-100 text-zinc-900 rounded-2xl shadow-md hover:bg-slate-50 transition-all"><Download size={20}/></button>
    </div>
  </div>
);
