
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Wrench, DollarSign, X, Mic, TrendingUp, ShieldCheck, Plus, Package, Menu,
  Image as LucideImage, Camera, Send, Loader2, Sparkles, Maximize, MapPin,
  Layers, ChevronRight, Scissors, Download, Share2, RotateCcw, Users, Zap,
  Settings, Award, Key, FileJson, Wallet, History, CreditCard, ShoppingCart,
  MessageSquarePlus, Calendar, TrendingDown, MicOff, Search, CheckCircle2, Hammer, LogIn, Volume2, ShieldAlert
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
  const [isListening, setIsListening] = useState(false);
  const [isYaraSpeaking, setIsYaraSpeaking] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const galInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [store.messages, store.loadingAI]);

  // Captura de Voz Industrial (Backend-Centric)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          ChatFlowService.executeVoicePipeline(base64);
        };
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      alert("Microfone bloqueado pelo Hardware local.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!store.activeClientId) return alert("Selecione um lead.");
    const finalTxt = txt.trim() || (img ? "Escaneamento de rascunho solicitado." : "");
    if (!finalTxt && !img) return;

    store.addMessage({ from: "user", text: finalTxt, src: img || undefined });
    setInput(""); setPreview(null);
    store.setLoadingAI(true);
    await ChatFlowService.executeMaterialization(finalTxt, img);
  };

  const activeProject = useMemo(() => {
    return store.messages.slice().reverse().find(m => m.project)?.project;
  }, [store.messages]);

  const financeiroTotal = useMemo(() => activeProject?.pricing || { finalPrice: 0, profit: 0, margin: 0 }, [activeProject]);

  return (
    <div className="flex h-[100dvh] bg-[#09090b] font-sans overflow-hidden">
      {/* Sidebar Industrial */}
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-72 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white pt-safe pb-safe">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={40} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500"><X /></button></div>
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] mb-8 space-y-3">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none">CRÉDITOS INDUSTRIAL</span>
            <h4 className="text-2xl font-black italic">{store.credits} <span className="text-[10px] uppercase not-italic opacity-40">un</span></h4>
          </div>
          <button onClick={() => store.addClient(prompt("Identificação do Lead:") || "Lead s/ Nome")} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase mb-4 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-zinc-100"><Plus size={16} /> Novo Lead</button>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4">Leads em Carteira</h3>
            {store.clients.map(c => (
              <button key={c.id} onClick={() => { store.setClient(c.id); setSidebar(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${store.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-lg" : "bg-zinc-900 border-white/5 text-zinc-500 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${store.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>DNA</div>
                <p className="font-black text-[11px] uppercase truncate">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Workshop */}
      <div className="flex-1 flex flex-col relative h-[100dvh] bg-white lg:rounded-l-[3.5rem] shadow-2xl overflow-hidden">
        <header className="bg-[#09090b] pt-safe py-3 px-6 flex items-center justify-between text-white border-b border-white/5 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500"><Menu size={32} /></button>
            <div className="flex items-center gap-2"><LogoSVG size={36} /><div className="hidden sm:block"><BrandHeading /></div></div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={() => store.setModal('BILLING')} className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-amber-500 font-black text-[11px] flex items-center gap-2 active:scale-95 transition-all">
               <Wallet size={14} /> {store.credits}
             </button>
             <button onClick={() => store.setModal('ADMIN')} className="p-2.5 bg-white/5 rounded-xl text-emerald-500 border border-emerald-500/10 active:scale-95 transition-all"><ShieldCheck size={20} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-10 bg-[#f8fafc] custom-scrollbar pb-52">
          {store.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 animate-in zoom-in-95 duration-1000">
               <LogoSVG size={120} />
               <div className="mt-8 space-y-2">
                 <p className="text-[13px] font-black uppercase tracking-[0.3em] text-zinc-900">Engenharia Digital v6.0</p>
                 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">PROTOCOLO DE DNA LOCK & SEED DETERMINÍSTICA</p>
               </div>
            </div>
          ) : (
            store.messages.map((m: any) => <MessageBubble key={m.id} message={m} onPreview={(src) => store.setPreview(src)} />)
          )}
        </main>

        {/* Footer Reativo Industrial */}
        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-t border-slate-100 z-[60] pb-safe">
          <div className="max-w-4xl mx-auto flex gap-4 items-end">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.8rem] shadow-xl transition-all ${isToolsOpen ? "bg-red-500 text-white" : "bg-[#09090b] text-amber-500"}`}>
              <Plus size={26} className={isToolsOpen ? "rotate-45" : ""} />
            </button>
            
            <div className={`flex-1 rounded-[1.8rem] flex flex-col border transition-all duration-300 shadow-inner overflow-hidden ${isListening ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-500/10' : 'bg-slate-100 border-slate-200'}`}>
              {preview && (
                <div className="p-3 bg-white/30 border-b border-slate-200 flex gap-2">
                  <div className="relative w-20 h-20"><img src={preview} className="w-full h-full object-cover rounded-xl border-4 border-white shadow-lg" /><button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X size={12}/></button></div>
                </div>
              )}
              <div className="flex items-center px-4">
                <button onClick={() => galInputRef.current?.click()} className="p-3 text-slate-400 hover:text-amber-500 transition-colors"><LucideImage size={24}/></button>
                <input 
                  placeholder={isListening ? "Processando Frequência Industrial..." : "Diga medidas ou confirme projeto"} 
                  className={`flex-1 bg-transparent py-5 text-sm sm:text-base font-bold outline-none text-zinc-900 ${isListening ? 'text-amber-700 italic placeholder-amber-400' : ''}`} 
                  value={input} onChange={e => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} 
                />
                <button 
                  onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording}
                  onTouchStart={startRecording} onTouchEnd={stopRecording}
                  className={`p-3 transition-all ${isListening ? "text-red-500 scale-125 animate-pulse" : "text-slate-400 hover:text-amber-500"}`}
                >
                  {isListening ? <MicOff size={28}/> : <Mic size={28}/>}
                </button>
              </div>
            </div>

            <button onClick={() => handlePipeline(input, preview)} disabled={store.loadingAI || (!input.trim() && !preview)} className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-[1.8rem] shadow-2xl transition-all ${store.loadingAI || (!input.trim() && !preview) ? "bg-slate-200 text-slate-400" : "bg-zinc-900 text-amber-500 active:scale-90"}`}>
              {store.loadingAI ? <Loader2 className="animate-spin" size={26} /> : <Send size={26} />}
            </button>
          </div>
          {isListening && <div className="text-center mt-3 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse flex items-center justify-center gap-2"><Volume2 size={12}/> SCANNER VOCAL ATIVO</div>}
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setPreview(await UploadService.toBase64(file)); }} />

        {/* Menu Industrial flutuante */}
        {isToolsOpen && (
          <div className="fixed inset-0 z-[95000]">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-36 left-4 sm:left-10 w-72 bg-[#09090b] border border-white/10 rounded-[2.5rem] shadow-2xl p-4 flex flex-col gap-1 animate-in slide-in-from-bottom-5">
              {[
                { id: 'BILLING', label: 'Hub de Créditos', icon: Wallet, color: 'bg-amber-600' },
                { id: 'BENTO', label: 'Corte CNC Pro', icon: Scissors, color: 'bg-blue-600' },
                { id: 'ESTELA', label: 'Financeiro Hub', icon: DollarSign, color: 'bg-emerald-600' },
                { id: 'ADMIN', label: 'Núcleo Industrial', icon: Settings, color: 'bg-slate-700' },
              ].map(tool => (
                <button key={tool.id} onClick={() => { store.setModal(tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-5 p-4 hover:bg-white/5 rounded-[1.8rem] text-white transition-all group text-left">
                  <div className={`p-3 rounded-2xl ${tool.color} group-hover:scale-110 transition-transform shadow-lg`}><tool.icon size={18} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drawers Técnicos */}
        <Drawer id="BILLING" title="Créditos Hub" color="bg-amber-600" icon={Wallet}><BillingContent /></Drawer>
        <Drawer id="BENTO" title="Plano de Corte" color="bg-blue-600" icon={Scissors}><CutPlanContent activeProject={activeProject} /></Drawer>
        <Drawer id="ESTELA" title="Orçamento Executivo" color="bg-emerald-600" icon={DollarSign}><BudgetContent financeiroTotal={financeiroTotal} /></Drawer>
        <Drawer id="ADMIN" title="YARA MASTER ADM" color="bg-zinc-900" icon={ShieldCheck} noPadding><AdminDashboard /></Drawer>
      </div>
    </div>
  );
}

const BillingContent = () => {
  const store = useStore();
  return (
    <div className="space-y-6 p-2">
      <div className="p-10 bg-amber-600 rounded-[3rem] text-black shadow-2xl relative overflow-hidden">
        <Sparkles size={100} className="absolute -bottom-6 -right-6 opacity-10" />
        <span className="text-[11px] font-black uppercase opacity-60 mb-2 block tracking-widest">Saldo Workshop</span>
        <h3 className="text-5xl font-black italic">{store.credits} <span className="text-base not-italic uppercase opacity-50">créditos</span></h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {['BASIC', 'PRO', 'STUDIO'].map(key => (
          <button key={key} onClick={() => store.changePlan(key as any)} className={`p-8 rounded-[2.5rem] border-2 transition-all flex justify-between items-center ${store.currentPlan === key ? "bg-amber-50 border-amber-600 shadow-xl" : "bg-white border-slate-100 shadow-sm hover:border-slate-200"}`}>
            <div className="text-left"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1 block">{key} PACK</span><div className="text-2xl font-black italic text-zinc-900">{key === 'BASIC' ? '50' : key === 'PRO' ? '150' : '400'} un</div></div>
            <span className="text-xl font-black text-amber-600">R$ {key === 'BASIC' ? '99' : key === 'PRO' ? '249' : '599'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const BudgetContent = ({ financeiroTotal }: any) => (
  <div className="space-y-6 p-2">
    <div className="p-10 bg-emerald-600 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
      <DollarSign size={100} className="absolute -bottom-6 -right-6 opacity-10" />
      <span className="text-[11px] font-black uppercase opacity-60 mb-2 block tracking-widest">Venda Sugerida Hub</span>
      <h3 className="text-5xl font-black italic">R$ {financeiroTotal.finalPrice?.toLocaleString('pt-BR')}</h3>
    </div>
    <div className="grid grid-cols-2 gap-4">
       <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-lg text-left">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Lucro</span>
          <p className="text-2xl font-black italic text-zinc-900">R$ {financeiroTotal.profit?.toLocaleString('pt-BR')}</p>
       </div>
       <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-lg text-left">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Margem</span>
          <p className="text-2xl font-black italic text-zinc-900">{financeiroTotal.margin?.toFixed(1)}%</p>
       </div>
    </div>
    <button className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
       <Share2 size={24}/> Exportar Proposta Industrial
    </button>
  </div>
);

const CutPlanContent = ({ activeProject }: any) => (
  <div className="space-y-6 p-2">
    <div className="p-10 bg-blue-600 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase opacity-60 tracking-widest">Eficiência CNC</span>
          <h3 className="text-5xl font-black italic">{activeProject?.cutPlan?.optimizationScore || 0}%</h3>
        </div>
        <Scissors size={60} className="opacity-20" />
      </div>
    </div>
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
       <div className="flex items-center gap-3 text-zinc-900 border-b border-slate-100 pb-4">
         <Package size={20} />
         <h4 className="text-[11px] font-black uppercase tracking-widest">Mapa de Chapas (MDF)</h4>
       </div>
       {activeProject?.cutPlan?.boards?.map((board: any, idx: number) => (
         <div key={idx} className="space-y-3">
           <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <span>CHAPA #{board.id}</span>
             <span>{board.items.length} PEÇAS</span>
           </div>
           <div className="grid grid-cols-1 gap-2">
              {board.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                  <span className="text-[11px] font-bold text-zinc-600">{item.n}</span>
                  <span className="text-[11px] font-black text-blue-600 tracking-tighter">{item.w} x {item.h} mm</span>
                </div>
              ))}
           </div>
         </div>
       ))}
    </div>
  </div>
);
