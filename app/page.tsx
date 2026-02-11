
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Wrench, DollarSign, X, Mic, TrendingUp, ShieldCheck, Plus, Package, Menu,
  Image as LucideImage, Camera, Send, Loader2, Sparkles, Maximize, MapPin,
  Layers, ChevronRight, Scissors, Download, Share2, RotateCcw, Users, Zap,
  Settings, Award, Key, FileJson, Wallet, History, CreditCard, ShoppingCart,
  MessageSquarePlus, Calendar, TrendingDown, MicOff, Search, CheckCircle2, Hammer, LogIn
} from "lucide-react";
import { useStore } from "../store/yaraStore";
import { ChatFlowService } from "../services/chatFlow";
import { UploadService } from "../services/uploadService";
import { startYaraVoice } from "../utils/yaraVoice";
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
  const [isListening, setIsListening] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Mock para fluxo SaaS

  const scrollRef = useRef<HTMLDivElement>(null);
  const galInputRef = useRef<HTMLInputElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        store.setHasKey(hasKey);
        if (hasKey) store.setKeyStatus('active');
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [store.messages, store.loadingAI]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current = startYaraVoice(
        (text, isFinal) => {
          setInput(text);
          if (isFinal) {
            setIsListening(false);
          }
        },
        (err) => {
          console.error(err);
          setIsListening(false);
        }
      );
    }
  };

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!store.activeClientId) return alert("Selecione um lead para prosseguir.");

    const finalTxt = txt.trim() || (img ? "Analise este rascunho." : "");
    if (!finalTxt && !img) return;

    store.addMessage({ 
      from: "user", 
      type: img ? 'image' : 'text',
      text: finalTxt, 
      src: img || undefined, 
      status: 'done' 
    });

    setInput(""); 
    setPreview(null);
    store.setLoadingAI(true);
    
    await ChatFlowService.executeMaterialization(finalTxt, img);
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

  const filteredMessages = useMemo(() => {
    if (!store.searchQuery) return store.messages;
    const query = store.searchQuery.toLowerCase();
    return store.messages.filter(m => 
      m.text?.toLowerCase().includes(query) || 
      m.project?.title?.toLowerCase().includes(query)
    );
  }, [store.messages, store.searchQuery]);

  const financeiroTotal = useMemo(() => activeProject?.pricing || { finalPrice: 0, profit: 0, margin: 0, chapas: 0 }, [activeProject]);

  if (!isLoggedIn) return (
    <div className="h-screen bg-[#09090b] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95">
        <div className="flex flex-col items-center gap-4">
          <LogoSVG size={80} />
          <div className="text-center">
            <h2 className="text-2xl font-black italic text-zinc-900">MarcenApp Pro</h2>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Acesse seu Hub Industrial</p>
          </div>
        </div>
        <button onClick={() => setIsLoggedIn(true)} className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
          <LogIn size={20} /> Entrar no Workshop
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-[#09090b] font-sans overflow-hidden">
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white text-left pt-safe pb-safe">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500"><X /></button></div>
          
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] mb-8 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none">HUB BALANCE</span>
              <Wallet size={14} className="text-amber-500" />
            </div>
            <h4 className="text-2xl font-black italic">{store.credits} <span className="text-[10px] uppercase not-italic opacity-40">credits</span></h4>
            <button onClick={() => store.setModal('BILLING')} className="w-full py-3 bg-amber-600 text-black rounded-xl font-black text-[9px] uppercase hover:bg-amber-500 transition-colors shadow-lg active:scale-95">Recarregar</button>
          </div>

          <button onClick={() => { const n = prompt("Nome do Lead:"); if(n) store.addClient(n); }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-4 flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-200 active:scale-95 transition-transform">
            <Plus size={16} /> Novo Lead
          </button>

          <button onClick={() => store.startNewConversation()} className="w-full py-4 bg-zinc-800 text-amber-500 border border-amber-500/20 rounded-2xl font-black text-[9px] uppercase mb-8 flex items-center justify-center gap-2 hover:bg-zinc-700 active:scale-95 transition-transform">
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
        <header className="bg-[#09090b] pt-safe py-3 px-6 flex items-center justify-between text-white shrink-0 z-50 transition-all duration-300 border-b border-white/5">
          <div className="flex items-center gap-4 flex-1">
            {!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500 active:scale-90 transition-transform"><Menu size={32} /></button>}
            {showSearch ? (
              <div className="flex-1 flex items-center bg-white/10 rounded-xl px-3 border border-white/10 animate-in slide-in-from-left-2">
                <Search size={16} className="text-zinc-500" />
                <input 
                  autoFocus
                  placeholder="Buscar projetos..." 
                  className="bg-transparent border-none outline-none text-[12px] font-bold p-2 w-full text-white placeholder:text-zinc-600"
                  value={store.searchQuery}
                  onChange={e => store.setSearchQuery(e.target.value)}
                />
                <button onClick={() => { store.setSearchQuery(""); setShowSearch(false); }} className="p-1 text-zinc-500 hover:text-white"><X size={16}/></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in">
                <LogoSVG size={36} />
                <div className="hidden sm:block"><BrandHeading /></div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
             {!showSearch && (
               <button onClick={() => setShowSearch(true)} className="p-2.5 bg-white/5 rounded-xl text-zinc-400 border border-white/10 active:scale-95 transition-all">
                 <Search size={20} />
               </button>
             )}
             <button onClick={() => store.setModal('BILLING')} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-95">
               <Wallet size={16} className="text-amber-500" />
               <span className="text-[10px] font-black tracking-tight">{store.credits}</span>
             </button>
             <button onClick={() => store.setModal('ADMIN')} className="p-2.5 bg-white/5 rounded-xl text-emerald-500 border border-emerald-500/10 active:scale-95 transition-all flex items-center gap-2">
               <ShieldCheck size={20} />
               {!store.hasKey && !store.manualApiKey && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
             </button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#f8fafc] custom-scrollbar pb-48">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30 animate-in fade-in zoom-in-95 duration-700">
               <LogoSVG size={100} />
               <div className="space-y-1">
                 <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-900">
                   SaaS Industrial v6.0
                 </p>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                   Hardware de Renderização e Persistência Supabase Ativos.
                 </p>
               </div>
            </div>
          ) : (
            filteredMessages.map((m: any) => (
              <MessageBubble key={m.id} message={m} onPreview={(src) => store.setPreview(src)} />
            ))
          )}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[60] pb-safe">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <button 
              onClick={() => setIsToolsOpen(!isToolsOpen)} 
              className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-[1.2rem] sm:rounded-[1.5rem] shadow-xl transition-all ${isToolsOpen ? "bg-red-500 text-white" : "bg-[#09090b] text-amber-500"}`}
            >
              <Plus size={24} className={isToolsOpen ? "rotate-45" : "transition-transform"} />
            </button>
            
            <div className="flex-1 bg-slate-100 rounded-[1.2rem] sm:rounded-[1.5rem] flex flex-col border border-slate-200 shadow-inner overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
              {preview && (
                <div className="p-3 bg-white/50 border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
                  <div className="relative w-16 h-16 shrink-0 group animate-in zoom-in-50">
                    <img src={preview} className="w-full h-full object-cover rounded-lg border-2 border-amber-500 shadow-sm" />
                    <button onClick={() => setPreview(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={10}/></button>
                  </div>
                </div>
              )}
              <div className="flex items-center px-2 sm:px-4">
                <button onClick={() => galInputRef.current?.click()} className="p-3 text-slate-400 hover:text-amber-500 active:scale-90 transition-all"><LucideImage size={22}/></button>
                <button onClick={() => camInputRef.current?.click()} className="p-3 text-slate-400 hover:text-amber-500 active:scale-90 transition-all"><Camera size={22}/></button>
                <input 
                  placeholder={isListening ? "Ouvindo Mestre..." : "Diga medidas ou envie rascunho"} 
                  className={`flex-1 bg-transparent px-2 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-bold outline-none text-zinc-900 placeholder-slate-400 transition-colors ${isListening ? 'text-amber-600 font-black' : ''}`} 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} 
                />
                <button 
                  onClick={toggleVoice} 
                  className={`p-3 transition-all active:scale-90 ${isListening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-amber-500"}`}
                >
                  {isListening ? <MicOff size={22}/> : <Mic size={22}/>}
                </button>
              </div>
            </div>

            <button 
              onClick={() => handlePipeline(input, preview)} 
              disabled={store.loadingAI || (!input.trim() && !preview)} 
              className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-[1.2rem] sm:rounded-[1.5rem] shadow-2xl transition-all ${store.loadingAI || (!input.trim() && !preview) ? "bg-slate-200 text-slate-400" : "bg-amber-600 text-black active:scale-95"}`}
            >
              {store.loadingAI ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            </button>
          </div>
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={handleFileChange} />
        <input type="file" ref={camInputRef} hidden accept="image/*" capture="environment" onChange={handleFileChange} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-32 left-4 sm:left-8 w-64 sm:w-72 bg-[#09090b] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-3 sm:p-4 flex flex-col gap-1 animate-in slide-in-from-bottom-5">
              {[
                { id: 'BILLING', label: 'Hub Financeiro', icon: Wallet, color: 'bg-amber-600' },
                { id: 'BENTO', label: 'Corte CNC', icon: Scissors, color: 'bg-blue-600' },
                { id: 'ESTELA', label: 'Orçamentos Pro', icon: DollarSign, color: 'bg-emerald-600' },
                { id: 'ADMIN', label: 'Engenharia Hub', icon: Settings, color: 'bg-slate-700' },
              ].map(tool => (
                <button key={tool.id} onClick={() => { store.setModal(tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 p-3 sm:p-4 hover:bg-white/5 rounded-[1.5rem] sm:rounded-[1.8rem] text-white transition-all group text-left active:bg-white/10">
                  <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon size={18} /></div>
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
        <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in" onClick={() => store.setPreview(null)}>
          <div className="relative w-full h-full flex items-center justify-center group">
             <img 
               src={store.selectedImage} 
               className="max-w-full max-h-[85vh] rounded-[2rem] sm:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 transition-transform duration-500 hover:scale-[1.05]" 
               alt="Zoomed View"
             />
             <button onClick={(e) => { e.stopPropagation(); store.setPreview(null); }} className="absolute top-4 right-4 p-4 text-white/50 hover:text-amber-500 transition-colors active:scale-90"><X size={32}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

const BillingContent = () => {
  const store = useStore();
  return (
    <div className="space-y-6 p-2">
      <div className="p-8 bg-amber-600 rounded-[2.5rem] text-black shadow-xl relative overflow-hidden">
        <Sparkles size={80} className="absolute -bottom-4 -right-4 opacity-10" />
        <span className="text-[10px] font-black uppercase opacity-60 mb-2 block tracking-widest">Saldo Hub</span>
        <h3 className="text-4xl font-black italic">{store.credits} <span className="text-sm not-italic uppercase opacity-50">créditos</span></h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {(Object.entries(CreditsEngine.PLANS) as [any, any][]).map(([key, plan]) => (
          <button key={key} onClick={() => { store.changePlan(key); store.addCredits(plan.credits, `Upgrade ${plan.name}`); }} className={`p-6 rounded-[2rem] border-2 transition-all flex justify-between items-center active:scale-[0.98] ${store.currentPlan === key ? "bg-amber-50 border-amber-600 shadow-md" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="text-left">
              <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 block ${store.currentPlan === key ? 'text-amber-600' : 'text-slate-400'}`}>{plan.name}</span>
              <div className="text-xl font-black italic text-slate-900">{plan.credits} credits</div>
            </div>
            <div className="text-right">
               <span className="text-lg font-black text-amber-600">R$ {plan.price}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const CutPlanContent = ({ activeProject }: any) => (
  <div className="space-y-6 p-2">
    <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Otimização CNC</span>
          <h3 className="text-4xl font-black italic">{activeProject?.cutPlan?.optimizationScore || 0}%</h3>
        </div>
        <Scissors size={40} className="opacity-20" />
      </div>
    </div>
    <div className="space-y-3">
      {activeProject?.cutPlan?.boards?.map((board: any, idx: number) => (
        <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
          <div className="flex justify-between items-center mb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
             <p>Chapa #{board.id} - Industrial</p>
          </div>
          <div className="space-y-2">
            {board.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-[11px] p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-600 truncate max-w-[150px]">{item.n}</span>
                <span className="font-black text-blue-600 shrink-0 tabular-nums">{item.w}x{item.h} mm</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BudgetContent = ({ financeiroTotal, activeProject }: any) => (
  <div className="space-y-6 p-2">
    <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
      <DollarSign size={80} className="absolute -bottom-4 -right-4 opacity-10" />
      <span className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-2 block">Venda Sugerida Hub</span>
      <h3 className="text-4xl font-black italic tabular-nums">R$ {financeiroTotal.finalPrice?.toLocaleString('pt-BR')}</h3>
    </div>

    <div className="grid grid-cols-2 gap-3">
       <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-left">
          <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Lucro</span>
          <p className="text-xl font-black italic text-zinc-900 tabular-nums">R$ {financeiroTotal.profit?.toLocaleString('pt-BR')}</p>
       </div>
       <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-left">
          <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Margem</span>
          <p className="text-xl font-black italic text-zinc-900 tabular-nums">{financeiroTotal.margin?.toFixed(1)}%</p>
       </div>
    </div>
    
    <button className="w-full py-5 bg-zinc-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
       <Share2 size={20}/> Gerar Proposta Comercial
    </button>
  </div>
);
