
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X, Mic, ShieldCheck, Plus, Menu, Image as LucideImage, Send, Loader2, Sparkles, 
  Scissors, Wallet, LogOut, LogIn, Key, DollarSign, Settings2, UserPlus, Zap, ExternalLink,
  Users, Package, Briefcase, Search, AlertCircle
} from "lucide-react";
import { useStore } from "../store/yaraStore";
import { ChatFlowService } from "../services/chatFlow";
import { UploadService } from "../services/uploadService";
import { supabase } from "../lib/supabase";
import { LogoSVG, BrandHeading } from "../components/ui/Logo";
import { Drawer } from "../components/tools/Drawer";
import { MessageBubble } from "../components/chat/MessageBubble";
import { AdminDashboard } from "../components/admin/AdminDashboard";

export default function Workshop() {
  const store = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const galInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        store.setUser(session.user);
        store.syncUserFromDB();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      store.setUser(session?.user ?? null);
      if (session) store.syncUserFromDB();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [store.messages, store.loadingAI]);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError("Formato de e-mail inválido.");
      return false;
    }
    if (password.length < 6) {
      setAuthError("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }
    setAuthError("");
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setAuthLoading(true);
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setAuthError("FALHA NO REGISTRO: " + error.message);
        } else if (data.user) {
          alert("CONTA CRIADA! Verifique seu e-mail ou faça login.");
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setAuthError("ACESSO NEGADO: " + error.message);
        }
      }
    } catch (err) {
      setAuthError("Erro inesperado no workshop.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail("evaldo@marcenapp.com.br");
    setPassword("123456");
    setAuthLoading(true);
    setTimeout(() => {
      const demoUser = {
        id: 'demo-master-id',
        email: 'evaldo@marcenapp.com.br',
        user_metadata: { full_name: 'Evaldo Master' }
      };
      store.setUser(demoUser);
      useStore.setState({ credits: 99999, currentPlan: 'enterprise' });
      setAuthLoading(false);
    }, 800);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    store.setUser(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const base64 = await UploadService.toBase64(new File([audioBlob], "voice.webm"));
        ChatFlowService.executeVoicePipeline(base64.split(',')[1]);
      };
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) { alert("Hardware de áudio bloqueado."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handlePipeline = async (txt: string, img: string | null = null) => {
    if (!store.user) return;
    const finalTxt = txt.trim() || (img ? "Escaneamento solicitado." : "");
    if (!finalTxt && !img) return;
    store.addMessage({ from: "user", text: finalTxt, src: img || undefined });
    setInput(""); setPreview(null);
    store.setLoadingAI(true);
    await ChatFlowService.executeMaterialization(finalTxt, img);
  };

  const filteredMessages = useMemo(() => {
    if (!store.searchQuery) return store.messages;
    const q = store.searchQuery.toLowerCase();
    return store.messages.filter(m => 
      m.text?.toLowerCase().includes(q) || 
      m.project?.title?.toLowerCase().includes(q) || 
      m.project?.description?.toLowerCase().includes(q)
    );
  }, [store.messages, store.searchQuery]);

  const activeProject = useMemo(() => store.messages.slice().reverse().find(m => m.project)?.project, [store.messages]);

  if (!store.user) return (
    <div className="h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#D9770608_0%,_transparent_70%)]" />
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 sm:p-12 space-y-10 shadow-2xl relative z-10 animate-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center gap-6">
          <LogoSVG size={100} />
          <div className="text-center">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">MARCENAPP HUB</h1>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mt-2">Engenharia Digital v6.0</p>
          </div>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400 ml-4">E-mail Corporativo</label>
            <input 
              type="email" placeholder="nome@empresa.com" 
              className={`w-full p-6 bg-zinc-100 rounded-3xl outline-none font-bold text-zinc-900 border ${authError && !email ? 'border-red-500' : 'border-transparent'} focus:border-amber-500/30 transition-all`} 
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400 ml-4">Chave Mestra</label>
            <input 
              type="password" placeholder="••••••" 
              className={`w-full p-6 bg-zinc-100 rounded-3xl outline-none font-bold text-zinc-900 border ${authError && password.length < 6 ? 'border-red-500' : 'border-transparent'} focus:border-amber-500/30 transition-all`} 
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          {authError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={14}/> {authError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <button disabled={authLoading} className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-zinc-200">
              {authLoading ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? <UserPlus size={24} /> : <LogIn size={24} />)} 
              {isSignUp ? "Cadastrar no Hub" : "Acessar Workshop"}
            </button>
            <button type="button" onClick={handleDemoLogin} className="w-full py-5 bg-amber-500 text-black rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-200">
              <Sparkles size={20} className="fill-current" />
              Demo Login Master
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-[11px] font-black uppercase text-zinc-400 hover:text-amber-600 transition-colors">
            {isSignUp ? "Já tenho acesso • Fazer Login" : "Não tenho conta • Cadastrar agora"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-[#09090b] font-sans overflow-hidden">
      <nav className={`fixed inset-y-0 left-0 z-[90000] w-80 bg-[#09090b] transition-transform duration-500 border-r border-white/5 ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-8 h-full flex flex-col text-white">
          <div className="flex justify-between items-center mb-10"><LogoSVG size={44} /><button onClick={() => setSidebar(false)} className="lg:hidden text-zinc-500"><X /></button></div>
          
          <div className="bg-zinc-900/50 border border-white/5 p-7 rounded-[2.5rem] mb-10 space-y-3 shrink-0">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">SALDO DO HUB</span>
            <h4 className="text-3xl font-black italic text-amber-500">{store.credits === 99999 ? '∞' : store.credits} <span className="text-[10px] not-italic opacity-40">CR</span></h4>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4 ml-2">Navegação</h3>
              <button title="Ver todos os projetos salvos" className="w-full flex items-center gap-4 p-5 hover:bg-white/5 rounded-2xl transition-all group">
                <Package size={20} className="text-zinc-500 group-hover:text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Projetos</span>
              </button>
              <button title="Gerenciar carteira de clientes" onClick={() => setSidebar(false)} className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-2xl transition-all group border border-white/5 shadow-lg">
                <Users size={20} className="text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Clientes</span>
              </button>
              <button title="Acessar núcleo de administração" onClick={() => { store.setModal('ADMIN'); setSidebar(false); }} className="w-full flex items-center gap-4 p-5 hover:bg-white/5 rounded-2xl transition-all group">
                <Settings2 size={20} className="text-zinc-500 group-hover:text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Configurações</span>
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4 ml-2">Carteira de Leads</h3>
              {store.clients.map(c => (
                <button key={c.id} title={`Selecionar cliente: ${c.name}`} onClick={() => { store.setClient(c.id); setSidebar(false); }} className={`w-full text-left p-5 rounded-[1.8rem] border transition-all flex items-center gap-4 ${store.activeClientId === c.id ? "bg-amber-600 border-amber-600 text-white shadow-xl" : "bg-zinc-900/40 border-white/5 text-zinc-500 opacity-70"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black ${store.activeClientId === c.id ? "bg-white text-amber-600" : "bg-zinc-800"}`}>DNA</div>
                  <p className="font-black text-[11px] uppercase truncate tracking-tight">{c.name}</p>
                </button>
              ))}
            </div>
          </div>

          <button title="Encerrar sessão de trabalho" onClick={handleSignOut} className="mt-6 w-full py-5 bg-white/5 border border-white/10 text-zinc-500 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0"><LogOut size={16} /> Encerrar</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col relative h-[100dvh] bg-white lg:rounded-l-[4rem] shadow-2xl overflow-hidden">
        <header className="bg-[#09090b] pt-safe py-4 px-8 flex items-center justify-between text-white border-b border-white/5 z-[100]">
          <div className="flex items-center gap-5">
            <button title="Abrir menu lateral" onClick={() => setSidebar(true)} className="lg:hidden p-1 text-amber-500"><Menu size={32} /></button>
            <LogoSVG size={40} /><BrandHeading />
          </div>

          <div className="hidden sm:flex flex-1 max-w-md mx-8">
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 flex items-center gap-4">
              <Search size={18} className="text-zinc-500" />
              <input 
                type="text"
                placeholder="Filtrar projetos ou mensagens..."
                className="bg-transparent flex-1 py-3 text-[11px] font-bold uppercase tracking-widest outline-none"
                value={store.searchQuery}
                onChange={e => store.setSearchQuery(e.target.value)}
              />
              {store.searchQuery && <button onClick={() => store.setSearchQuery("")}><X size={14} className="text-zinc-500"/></button>}
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div title="Saldo de créditos do Hub" className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all" onClick={() => store.setModal('BILLING')}>
               <Wallet size={16} className="text-amber-500" />
               <span className="text-[11px] font-black italic text-amber-500">{store.credits === 99999 ? '∞' : store.credits}</span>
             </div>
             <button title="Abrir Núcleo de Administração" onClick={() => store.setModal('ADMIN')} className="p-3 bg-white/5 rounded-2xl text-emerald-500 border border-emerald-500/10"><ShieldCheck size={22} /></button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-12 space-y-12 bg-[#f4f7f9] custom-scrollbar pb-60">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 animate-in fade-in duration-1000">
               <LogoSVG size={140} /><p className="text-[14px] font-black uppercase tracking-[0.4em] text-zinc-900 mt-10">Engenharia Digital v6.0</p>
               {store.searchQuery && <p className="mt-4 text-[10px] font-black text-amber-600 uppercase tracking-widest">Nenhum DNA encontrado para '{store.searchQuery}'</p>}
            </div>
          ) : (
            filteredMessages.map((m: any) => <MessageBubble key={m.id} message={m} onPreview={(src) => store.setPreview(src)} />)
          )}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-white/80 backdrop-blur-3xl border-t border-slate-100 z-[150] pb-safe">
          <div className="max-w-5xl mx-auto flex gap-4 items-end">
            <button title="Exibir ferramentas de apoio" onClick={() => setIsToolsOpen(!isToolsOpen)} className={`w-16 h-16 shrink-0 flex items-center justify-center rounded-[2rem] shadow-2xl transition-all ${isToolsOpen ? "bg-red-500 text-white rotate-45" : "bg-zinc-900 text-amber-500"}`}><Plus size={28} /></button>
            <div className={`flex-1 rounded-[2rem] flex flex-col border transition-all duration-500 shadow-2xl overflow-hidden ${isListening ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'}`}>
              {preview && (
                <div className="p-4 bg-zinc-50 border-b border-slate-200 flex gap-4">
                  <div className="relative w-24 h-24"><img src={preview} className="w-full h-full object-cover rounded-2xl border-4 border-white shadow-xl" /><button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5"><X size={14}/></button></div>
                </div>
              )}
              <div className="flex items-center px-6">
                <button title="Anexar foto ou rascunho" onClick={() => galInputRef.current?.click()} className="p-4 text-slate-400 hover:text-amber-600"><LucideImage size={26}/></button>
                <input 
                  placeholder={isListening ? "Ouvindo Frequência Industrial..." : "Descreva medidas ou confirme projeto"} 
                  className="flex-1 bg-transparent py-6 text-base font-bold outline-none text-zinc-900" 
                  value={input} onChange={e => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === "Enter" && handlePipeline(input, preview)} 
                />
                <button title="Ativar comando de voz (segure para falar)" onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-4 transition-all ${isListening ? "text-red-500 scale-125 animate-pulse" : "text-slate-400 hover:text-amber-600"}`}><Mic size={30}/></button>
              </div>
            </div>
            <button title="Enviar comando para YARA" onClick={() => handlePipeline(input, preview)} disabled={store.loadingAI || (!input.trim() && !preview)} className="w-16 h-16 shrink-0 flex items-center justify-center rounded-[2rem] shadow-2xl bg-zinc-900 text-amber-500 active:scale-90 disabled:opacity-30">
              {store.loadingAI ? <Loader2 className="animate-spin" size={28} /> : <Send size={28} />}
            </button>
          </div>
        </footer>

        <input type="file" ref={galInputRef} hidden accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setPreview(await UploadService.toBase64(file)); }} />

        {isToolsOpen && (
          <div className="fixed inset-0 z-[200]">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsToolsOpen(false)} />
            <div className="absolute bottom-40 left-8 sm:left-12 w-80 bg-[#09090b] border border-white/10 rounded-[3rem] shadow-2xl p-5 flex flex-col gap-2">
              {[
                { id: 'BILLING', label: 'Créditos Hub', icon: Wallet, color: 'bg-amber-600', desc: 'Comprar créditos' },
                { id: 'BENTO', label: 'Corte CNC Pro', icon: Scissors, color: 'bg-blue-600', desc: 'Ver plano de corte' },
                { id: 'ESTELA', label: 'Orçamentos Master', icon: DollarSign, color: 'bg-emerald-600', desc: 'Resumo financeiro' },
                { id: 'ADMIN', label: 'Núcleo Técnico', icon: Settings2, color: 'bg-slate-700', desc: 'Configurações API' },
              ].map(tool => (
                <button key={tool.id} title={tool.desc} onClick={() => { store.setModal(tool.id); setIsToolsOpen(false); }} className="w-full flex items-center gap-5 p-5 hover:bg-white/5 rounded-[2.2rem] text-white transition-all group">
                  <div className={`p-4 rounded-2xl ${tool.color} group-hover:scale-110 transition-transform`}><tool.icon size={20} /></div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Drawer id="BILLING" title="Recarga do Hub" color="bg-amber-600" icon={Wallet}><BillingContent /></Drawer>
        <Drawer id="BENTO" title="Plano de Corte CNC" color="bg-blue-600" icon={Scissors}><CutPlanContent activeProject={activeProject} /></Drawer>
        <Drawer id="ADMIN" title="ADMIN MASTER" color="bg-zinc-900" icon={ShieldCheck} noPadding><AdminDashboard /></Drawer>
      </div>
    </div>
  );
}

const BillingContent = () => {
  const store = useStore();
  return (
    <div className="space-y-8 p-2">
      <div className="p-12 bg-amber-600 rounded-[3.5rem] text-black shadow-2xl relative overflow-hidden">
        <Sparkles size={120} className="absolute -bottom-8 -right-8 opacity-10" />
        <span className="text-[11px] font-black uppercase opacity-60 mb-3 block">Saldo Hub</span>
        <h3 className="text-6xl font-black italic">{store.credits === 99999 ? '∞' : store.credits} <span className="text-xl not-italic opacity-50">UN</span></h3>
      </div>
      {['BASIC', 'PRO', 'STUDIO'].map(key => (
        <button key={key} onClick={() => store.changePlan(key as any)} className="w-full p-8 rounded-[2.8rem] border-2 bg-white border-slate-100 flex justify-between items-center hover:border-amber-600 transition-all">
          <div className="text-left"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1 block">{key} PACK</span><div className="text-3xl font-black italic text-zinc-900">{key === 'BASIC' ? '50' : key === 'PRO' ? '150' : '400'} CR</div></div>
          <span className="text-xl font-black text-amber-600">R$ {key === 'BASIC' ? '99' : key === 'PRO' ? '249' : '599'}</span>
        </button>
      ))}
    </div>
  );
};

const CutPlanContent = ({ activeProject }: any) => (
  <div className="space-y-6 p-2 text-zinc-800">
    <div className="p-10 bg-blue-600 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase opacity-60 tracking-widest">Aproveitamento</span>
          <h3 className="text-5xl font-black italic">{activeProject?.cutPlan?.optimizationScore || 0}%</h3>
        </div>
        <Scissors size={60} className="opacity-20" />
      </div>
    </div>
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
       {activeProject?.cutPlan?.boards?.map((board: any, idx: number) => (
         <div key={idx} className="space-y-3">
           <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>CHAPA #{board.id}</span><span>{board.items.length} PEÇAS</span></div>
           <div className="grid grid-cols-1 gap-2">
              {board.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-zinc-600">{item.n}</span>
                  <span className="text-[11px] font-black text-blue-600">{item.w} x {item.h} mm</span>
                </div>
              ))}
           </div>
         </div>
       ))}
    </div>
  </div>
);
