
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Wrench, DollarSign, X, Mic, TrendingUp, ShieldCheck, Plus, Package, Menu,
  Image as LucideImage, Camera, Send, Loader2, Sparkles, Maximize, MapPin,
  Layers, ChevronRight, Scissors, Download, Share2, RotateCcw, Users, Zap,
  Settings, Award, Key, FileJson, Wallet, History, CreditCard, ShoppingCart
} from "lucide-react";
import { useStore } from "../store/yaraStore";
import { ChatFlowService } from "../services/chatFlow";
import { UploadService } from "../services/uploadService";
import { CreditsEngine } from "../core/yara-engine/creditsEngine";
import { LogoSVG, BrandHeading } from "../components/ui/Logo";
import { Drawer } from "../components/tools/Drawer";
import { MessageBubble } from "../components/chat/MessageBubble";

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

    const userMsgId = `user-${Date.now()}`;
    const iaraId = `iara-${Date.now()}`;
    
    store.addMessage({ 
      id: userMsgId, 
      from: "user", 
      text: txt || "Materializando rascunho industrial...", 
      src: img, 
      timestamp: new Date().toISOString(), 
      status: 'done' 
    });

    store.addMessage({ 
      id: iaraId, 
      from: "iara", 
      text: "Sequência Industrial Iniciada: Parser -> JSON Único -> Render -> Orçamento -> Corte.", 
      timestamp: new Date().toISOString(), 
      status: 'processing',
      progressiveSteps: { parsed: 'active', render: false, pricing: false, cutPlan: false } 
    });
    
    setInput(""); setPreview(null);
    store.setLoadingAI(true);

    try {
      const finalProject = await ChatFlowService.executeMaterialization(txt, img, (update) => {
        const steps: any = { parsed: 'done', render: false, pricing: false, cutPlan: false };
        if (update.step === 'parsed') steps.render = 'active';
        else if (update.step === 'render') { steps.render = 'done'; steps.pricing = 'active'; }
        else if (update.step === 'pricing') { steps.render = 'done'; steps.pricing = 'done'; steps.cutPlan = 'active'; }

        store.updateMessage(iaraId, { project: update.project, progressiveSteps: steps });
      });

      store.updateMessage(iaraId, { 
        text: "Pipeline industrial concluído. Todas as especificações técnicas, renders fotorrealistas e planos de corte estão sincronizados no Hub.",
        project: finalProject, 
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'done' },
        status: 'done'
      });

    } catch (e: any) {
      console.error("Pipeline Failure:", e);
      let errorMsg = e.message || "Ocorreu um erro no hardware Yara.";
      if (e?.message?.includes("403")) {
        errorMsg = "Acesso Negado (403). Verifique o faturamento da sua chave Master.";
        setNeedsKey(true);
        store.setHasKey(false);
      }
      store.updateMessage(iaraId, { text: errorMsg, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
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

  const financeiroTotal = useMemo(() => activeProject?.pricing || { finalPrice: 0, chapas: 0 }, [activeProject]);

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

          <button onClick={() => { const n = prompt("Nome do Lead:"); if(n) store.addClient(n); }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-8 flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-200">
            <Plus size={16} /> Novo Projeto
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
          <button onClick={handleOpenKeySelector} className={`mt-8 p-4 flex items-center gap-3 ${store.hasKey ? "text-emerald-500" : "text-amber-500"}`}>
            <Key size={20} /> <span className="text-[10px] font-black uppercase tracking-widest leading-none">Hardware Master</span>
          </button>
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
          {store.messages.map((m: any) => (
            <MessageBubble key={m.id} message={m} onPreview={(src) => store.setPreview(src)} />
          ))}
          {store.loadingAI && (
            <div className="flex items-center gap-3 bg-white w-fit p-4 rounded-3xl shadow-lg border border-slate-100 animate-pulse">
              <Loader2 size={16} className="animate-spin text-amber-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Pipeline Industrial...</span>
            </div>
          )}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <div className="max-w-3xl mx-auto flex gap-4 items-end">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-xl transition-all ${isToolsOpen ? "bg-red-500 text-white" : "bg-[#09090b] text-amber-500"}`}>
              <Plus size={28} className={isToolsOpen ? "rotate-45" : ""} />
            </button>
            <div className="flex-1 bg-slate-100 rounded-[1.5rem] flex items-center px-4 py-1 border border-slate-200">
               <button onClick={() => galInputRef.current?.click()} className="p-3 text-slate-400 hover:text-amber-500"><LucideImage size={24}/></button>
               <input placeholder="INPUT (Texto/Foto/Voz) -> YARA PARSER..." className="flex-1 bg-transparent px-4 py-4 text-base font-bold outline-none text-zinc-900 placeholder-slate-400" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} />
            </div>
            <button onClick={() => handlePipeline(input, preview)} disabled={store.loadingAI || (!input.trim() && !preview)} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-2xl transition-all ${store.loadingAI ? "bg-slate-200 text-slate-400" : "bg-amber-600 text-black active:scale-95"}`}><Send size={28} /></button>
          </div>
          {preview && <div className="max-w-3xl mx-auto mt-4"><div className="relative w-24 h-24 group"><img src={preview} className="w-full h-full object-cover rounded-xl border-2 border-amber-500 shadow-lg" /><button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"><X size={14}/></button></div></div>}
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

        {/* HUB FINANCEIRO / BILLING DRAWER */}
        <Drawer id="BILLING" title="Recarga do Hub" color="bg-amber-600" icon={Wallet}>
           <div className="space-y-8">
              <div className="p-8 bg-amber-600 rounded-[2.5rem] text-black shadow-xl relative overflow-hidden">
                <Sparkles size={80} className="absolute -bottom-4 -right-4 opacity-10" />
                <span className="text-[10px] font-black uppercase opacity-60 mb-2 block">Saldo de Créditos Yara</span>
                <h3 className="text-4xl font-black italic">{store.credits}</h3>
                <p className="text-[10px] font-bold uppercase opacity-60 mt-2 tracking-widest">Hardware Master v3.83</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2"><ShoppingCart size={14}/> Selecione um Plano Industrial</h4>
                <div className="grid grid-cols-1 gap-4">
                  {(Object.entries(CreditsEngine.PLANS) as [keyof typeof CreditsEngine.PLANS, any][]).map(([key, plan]) => (
                    <button 
                      key={key} 
                      onClick={() => {
                        if (confirm(`Confirmar upgrade para Plano ${plan.name} por R$ ${plan.price}?`)) {
                          store.changePlan(key as any);
                          store.addCredits(plan.credits, `Upgrade Plano: ${plan.name}`);
                          alert("Pipeline Financeiro Sincronizado!");
                        }
                      }}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex justify-between items-center group ${store.currentPlan === key ? "bg-amber-50 border-amber-600" : "bg-white border-slate-100 hover:border-amber-200"}`}
                    >
                      <div className="text-left">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${store.currentPlan === key ? "text-amber-600" : "text-slate-400"}`}>{plan.name}</span>
                        <div className="text-xl font-black italic text-zinc-900">{plan.credits} <span className="text-[10px] opacity-40 uppercase not-italic">credits</span></div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-600">R$ {plan.price}</span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Faturamento Mensal</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2"><History size={14}/> Histórico do Hub</h4>
                <div className="space-y-2">
                  {store.transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                      <div className="text-left">
                        <p className="text-[11px] font-black text-zinc-800 uppercase leading-none mb-1">{tx.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">{new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <span className={`text-xs font-black italic ${tx.type === 'consumption' ? "text-red-500" : "text-emerald-500"}`}>
                        {tx.type === 'consumption' ? '-' : '+'}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </Drawer>

        <Drawer id="BENTO" title="Otimização Plano de Corte" color="bg-blue-600" icon={Scissors}>
           <div className="space-y-6">
              <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <Scissors size={80} className="absolute -bottom-4 -right-4 opacity-10" />
                <span className="text-[10px] font-black uppercase opacity-60 mb-2 block">Score de Otimização</span>
                <h3 className="text-4xl font-black italic">{activeProject?.cutPlan?.optimizationScore || 0}%</h3>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400">Chapas Necessárias: {activeProject?.cutPlan?.boards?.length || 0}</h4>
                {activeProject?.cutPlan?.boards?.map((board: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Chapa #{board.id} - 2750x1840mm</p>
                    <div className="grid grid-cols-1 gap-2">
                      {board.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                          <span className="font-bold truncate">{item.n}</span>
                          <span className="font-black text-blue-600 shrink-0 ml-4">{item.w}x{item.h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3"><FileJson size={20}/> Exportar para CNC (DXF/JSON)</button>
           </div>
        </Drawer>

        <Drawer id="ESTELA" title="Orçamentos Industriais" color="bg-emerald-600" icon={DollarSign}>
           <div className="space-y-6">
              <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl">
                <span className="text-[10px] font-black uppercase opacity-60">Valor Master de Venda</span>
                <h3 className="text-4xl font-black italic">R$ {financeiroTotal.finalPrice?.toLocaleString('pt-BR')}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-100 rounded-[2rem]">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Custo de Chapas</span>
                  <p className="text-xl font-black text-slate-800">R$ {((activeProject?.cutPlan?.boards?.length || 0) * store.industrialRates.mdf).toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-6 bg-slate-100 rounded-[2rem]">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Margem Operacional</span>
                  <p className="text-xl font-black text-emerald-600">{(store.industrialRates.markup - 1).toLocaleString('pt-BR', { style: 'percent' })}</p>
                </div>
              </div>
              <button className="w-full py-6 bg-white text-black border-2 border-slate-900 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors shadow-lg"><Download size={20}/> Gerar PDF Proposta</button>
           </div>
        </Drawer>

        <Drawer id="ADMIN" title="Engenharia Yara Master" color="bg-slate-900" icon={ShieldCheck}>
           <div className="space-y-8">
             <div className="p-8 bg-slate-100 rounded-[2.5rem] space-y-6">
                <h3 className="text-[10px] font-black uppercase text-zinc-400">Hardware de Produção</h3>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MDF Chapa Industrial (Preço)</span>
                    <div className="mt-2 flex items-center bg-white p-4 rounded-xl border border-slate-200">
                      <span className="mr-2 text-slate-400 font-black">R$</span>
                      <input type="number" className="w-full bg-transparent font-black text-lg outline-none" value={store.industrialRates.mdf} onChange={e => store.updateRates({ mdf: Number(e.target.value) })} />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Markup Industrial Hub</span>
                    <div className="mt-2 flex items-center bg-white p-4 rounded-xl border border-slate-200">
                      <input type="number" step="0.1" className="w-full bg-transparent font-black text-lg outline-none text-amber-600" value={store.industrialRates.markup} onChange={e => store.updateRates({ markup: Number(e.target.value) })} />
                    </div>
                  </label>
                </div>
             </div>
             <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex items-center gap-4">
                <Zap className="text-blue-500" size={24} />
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-zinc-600">Status Operacional</span><span className="text-[9px] font-bold text-slate-400 uppercase italic">Yara Pipeline v3.83 Online</span></div>
             </div>
           </div>
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
