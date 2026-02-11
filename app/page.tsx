
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Wrench, DollarSign, X, Mic, TrendingUp, ShieldCheck, Plus, Package, Menu,
  Image as LucideImage, Camera, Send, Loader2, Sparkles, Maximize, MapPin,
  Layers, ChevronRight, Scissors, Download, Share2, RotateCcw, Users, Zap,
  Settings, Award, Key, FileJson
} from "lucide-react";
import { useStore } from "../store/yaraStore";
import { ChatFlowService } from "../services/chatFlow";
import { UploadService } from "../services/uploadService";
import { LogoSVG, BrandHeading } from "../components/ui/Logo";
import { Drawer } from "../components/tools/Drawer";
import { MessageBubble } from "../components/chat/MessageBubble";

export default function Workshop() {
  const store = useStore();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const galInputRef = useRef<HTMLInputElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null);

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
      text: txt || "Materializando rascunho...", 
      src: img, 
      timestamp: new Date().toISOString(), 
      status: 'done' 
    });

    store.addMessage({ 
      id: iaraId, 
      from: "iara", 
      text: "Ativando núcleos Yara Hub v3.83...", 
      timestamp: new Date().toISOString(), 
      status: 'processing',
      progressiveSteps: { parsed: 'active', pricing: false, cutPlan: false, render: false } 
    });
    
    setInput(""); setPreview(null);
    store.setLoadingAI(true);

    try {
      const finalProject = await ChatFlowService.executeMaterialization(txt, img, (update) => {
        if (update.step === 'parsed') {
          store.updateMessage(iaraId, { 
            project: update.project, 
            progressiveSteps: { parsed: 'done', pricing: 'active', cutPlan: false, render: false } 
          });
        } else if (update.step === 'pricing') {
          store.updateMessage(iaraId, { 
            project: update.project, 
            progressiveSteps: { parsed: 'done', pricing: 'done', cutPlan: 'active', render: 'active' } 
          });
        }
      });

      store.updateMessage(iaraId, { 
        text: "Projeto materializado com fidelidade 8K. Orçamento e plano de corte sincronizados.",
        project: finalProject, 
        progressiveSteps: { parsed: 'done', pricing: 'done', cutPlan: 'done', render: 'done' },
        status: 'done'
      });

    } catch (e: any) {
      console.error("Pipeline Failure:", e);
      let errorMsg = "Ocorreu um erro no hardware Yara.";
      if (e?.message?.includes("403") || e?.message?.toLowerCase().includes("permission")) {
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

  const financeiroTotal = useMemo(() => {
    return store.messages.find(m => m.project)?.project?.pricing || { finalPrice: 0, chapas: 0 };
  }, [store.messages]);

  return (
    <div className="flex h-[100dvh] bg-[#09090b] font-sans overflow-hidden">
      {needsKey && (
        <div className="fixed inset-0 z-[200000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 p-10 rounded-[3rem] text-center space-y-8">
            <div className="mx-auto w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
              <Key size={40} />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase text-white tracking-tighter italic">Hardware Bloqueado</h2>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">Conecte sua chave GCP para liberar os renders fotorrealistas.</p>
            </div>
            <button onClick={handleOpenKeySelector} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-xs active:scale-95 transition-all flex items-center justify-center gap-3">
              <Sparkles size={18} /> Conectar Hardware Master
            </button>
          </div>
        </div>
      )}

      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white text-left">
          <div className="flex justify-between items-center mb-10">
            <LogoSVG size={40} />
            <button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500"><X /></button>
          </div>
          <button onClick={() => { const n = prompt("Cliente:"); if(n) store.addClient(n); }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-8 flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-200">
            <Plus size={16} /> Novo Projeto
          </button>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4 flex items-center gap-2"><Users size={12}/> Leads Hub</h3>
            {store.clients.map(c => (
              <button key={c.id} onClick={() => { store.setClient(c.id); setSidebar(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${store.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white" : "bg-zinc-900 border-white/5 text-zinc-500 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${store.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>M</div>
                <p className="font-black text-[11px] uppercase truncate">{c.name}</p>
              </button>
            ))}
          </div>
          <button onClick={handleOpenKeySelector} className={`mt-8 p-4 flex items-center gap-3 ${store.hasKey ? "text-emerald-500" : "text-amber-500"}`}>
            <Key size={20} /> <span className="text-[10px] font-black uppercase">Hardware Key</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col relative h-[100dvh] bg-white lg:rounded-l-[3.5rem] shadow-2xl overflow-hidden">
        <header className="bg-[#09090b] py-3 px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-4">
            {!sidebar && <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500"><Menu size={32} /></button>}
            <LogoSVG size={45} /><BrandHeading />
          </div>
          <button onClick={() => store.setModal('ADMIN')} className="p-2 bg-white/5 rounded-xl text-emerald-500 border border-emerald-500/10"><ShieldCheck size={24} /></button>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-12 bg-[#f8fafc] custom-scrollbar pb-40">
          {store.messages.map((m: any) => (
            <MessageBubble key={m.id} message={m} onPreview={(src) => store.setPreview(src)} />
          ))}
          {store.loadingAI && (
            <div className="flex items-center gap-3 bg-white w-fit p-4 rounded-3xl shadow-lg border border-slate-100 animate-pulse">
              <Loader2 size={16} className="animate-spin text-amber-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Hardware Yara...</span>
            </div>
          )}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <div className="max-w-3xl mx-auto flex gap-4 items-end">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-xl bg-[#09090b] text-amber-500">
              <Plus size={28} className={isToolsOpen ? "rotate-45" : ""} />
            </button>
            <div className="flex-1 bg-slate-100 rounded-[1.5rem] flex items-center px-4 py-1 border border-slate-200">
               <button onClick={() => galInputRef.current?.click()} className="p-3 text-slate-400 hover:text-amber-500"><LucideImage size={24}/></button>
               <input 
                placeholder="Descreva seu projeto ou anexe rascunho..." 
                className="flex-1 bg-transparent px-4 py-4 text-base font-bold outline-none text-zinc-900" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} 
               />
            </div>
            <button 
              onClick={() => handlePipeline(input, preview)} 
              disabled={store.loadingAI}
              className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.5rem] shadow-2xl transition-all ${store.loadingAI ? "bg-slate-200 text-slate-400" : "bg-amber-600 text-black"}`}
            >
              <Send size={28} />
            </button>
          </div>
          {preview && (
            <div className="max-w-3xl mx-auto mt-4">
              <div className="relative w-24 h-24">
                <img src={preview} className="w-full h-full object-cover rounded-xl border-2 border-amber-500 shadow-md" />
                <button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14}/></button>
              </div>
            </div>
          )}
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={handleFileChange} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-32 left-8 w-72 bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-bottom-5">
              {[
                { id: 'ESTELA', label: 'Financeiro Hub', icon: DollarSign, color: 'bg-emerald-600' },
                { id: 'ADMIN', label: 'Configurações', icon: Settings, color: 'bg-slate-700' },
              ].map(tool => (
                <button key={tool.id} onClick={() => { store.setModal(tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.8rem] text-white">
                  <div className={`p-3 rounded-2xl ${tool.color}`}><tool.icon size={20} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Drawer id="ESTELA" title="Hub Financeiro" color="bg-emerald-600" icon={DollarSign}>
           <div className="space-y-6">
              <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl">
                <span className="text-[10px] font-black uppercase opacity-60">Venda Estimada v3.83</span>
                <h3 className="text-4xl font-black italic">R$ {financeiroTotal.finalPrice?.toLocaleString('pt-BR')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-100 rounded-[2rem]">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Custo MDF</span>
                  <p className="text-xl font-black text-slate-800">R$ {(financeiroTotal.finalPrice / 2.2).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="p-6 bg-slate-100 rounded-[2rem]">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Mão de Obra</span>
                  <p className="text-xl font-black text-emerald-600">R$ {(financeiroTotal.finalPrice * 0.35).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
              <button className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3">
                <Download size={20}/> Exportar Orçamento Pro
              </button>
           </div>
        </Drawer>

        <Drawer id="ADMIN" title="Hardware Master" color="bg-slate-900" icon={ShieldCheck}>
           <div className="space-y-8">
             <div className="p-8 bg-slate-100 rounded-[2.5rem] space-y-6">
                <h3 className="text-[10px] font-black uppercase text-zinc-400">Parâmetros de Produção</h3>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Chapa MDF (Preço Base)</span>
                    <input type="number" className="mt-2 w-full p-4 rounded-xl bg-white border border-slate-200 font-black" value={store.industrialRates.mdf} onChange={e => store.updateRates({ mdf: Number(e.target.value) })} />
                  </label>
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Markup Hub (Margem)</span>
                    <input type="number" step="0.1" className="mt-2 w-full p-4 rounded-xl bg-white border border-slate-200 font-black text-amber-600" value={store.industrialRates.markup} onChange={e => store.updateRates({ markup: Number(e.target.value) })} />
                  </label>
                </div>
             </div>
             <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center gap-4">
                <Zap className="text-amber-500" size={24} />
                <span className="text-[10px] font-black uppercase text-zinc-600">Yara Pipeline Sync v3.83 Operacional</span>
             </div>
           </div>
        </Drawer>
      </div>

      {store.selectedImage && (
        <div className="fixed inset-0 z-[150000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8" onClick={() => store.setPreview(null)}>
          <img src={store.selectedImage} className="max-w-full max-h-[85vh] rounded-[3rem] shadow-2xl border border-white/10 cursor-zoom-out" />
          <button className="absolute top-10 right-10 p-4 text-white hover:text-amber-500"><X size={32}/></button>
        </div>
      )}
    </div>
  );
}
