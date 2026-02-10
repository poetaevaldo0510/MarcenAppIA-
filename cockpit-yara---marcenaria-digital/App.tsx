import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  X, Mic, Trash2 as Trash, Hammer, 
  ChevronRight, Camera, Send, 
  UserPlus, Contact, Terminal, 
  Coins, Loader2, PlusCircle, FolderOpen, AlertCircle, CloudOff, Cloud, StoreIcon
} from 'lucide-react';
import { YaraAI } from './services/geminiService';
import { fileToBase64 } from './utils/helpers';
import { getHistory, addProjectToHistory, getCarpenterProfile } from './services/historyService';
import { CommercialDepartment } from './components/CommercialDepartment';
import type { ProjectHistoryItem, UserProfile } from './types';

// Safely obtain Firebase configuration
const getFirebaseConfig = () => {
  try {
    const config = (window as any).__firebase_config;
    if (!config) return null;
    if (typeof config === 'string') return JSON.parse(config);
    return config;
  } catch (e) {
    return null;
  }
};

const firebaseConfig = getFirebaseConfig();
// Access is liberated - configuration is optional
const isFirebasePossible = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.length > 15 && !firebaseConfig.apiKey.includes("AIzaSyDFx"));

let fbApp: any = null;
let auth: any = null;
let db: any = null;

if (isFirebasePossible) {
  try {
    fbApp = getApps().length === 0 ? initializeApp(firebaseConfig!) : getApp();
    auth = getAuth(fbApp);
    db = getFirestore(fbApp);
  } catch (e) {
    console.warn("Firebase failed to init, entering Local Mode.", e);
  }
}

const appId = (window as any).__app_id || 'marcenapp-cockpit-v1';
const MarcenaContext = createContext<any>(null);

const UI = {
  Logo: ({ size = 24, color = "#D97706", onClick }: any) => (
    <svg 
      width={size} height={size} viewBox="0 0 100 100" fill="none" 
      onClick={onClick} 
      className={onClick ? "cursor-pointer active:scale-95 transition-transform" : ""}
    >
      <rect width="100" height="100" rx="28" fill="#09090b" />
      <path d="M25 75V25H45L50 40L55 25H75V75H62V40L50 65L38 40V75H25Z" fill="white" />
      <circle cx="50" cy="15" r="6" fill={color} />
    </svg>
  ),

  Metric: ({ label, value, icon: Icon, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-2 transition-all ${onClick ? 'cursor-pointer hover:shadow-md active:scale-95' : ''}`}
    >
      <div className={`p-2 rounded-lg ${color} text-white w-fit shadow-md`}><Icon size={16} /></div>
      <div className="text-zinc-900 text-left">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{String(label)}</p>
        <h4 className="text-lg font-black tracking-tighter leading-none">{String(value)}</h4>
      </div>
    </div>
  ),

  Drawer: ({ id, title, color, icon: Icon, activeModal, setActiveModal, children }: any) => {
    if (activeModal !== id) return null;
    return (
      <div className="fixed inset-0 z-[100000] flex justify-end">
        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md transition-opacity" onClick={() => setActiveModal(null)} />
        <div className="relative w-full max-w-xl bg-[#F8FAFC] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
           <header className={`${color} p-6 text-white flex justify-between items-center shrink-0 shadow-lg`}>
              <div className="flex items-center gap-4">{Icon && <Icon size={24} />}<h2 className="text-lg font-black uppercase tracking-tight">{String(title)}</h2></div>
              <button onClick={() => setActiveModal(null)} className="p-2 bg-white/20 rounded-full active:scale-90 transition-all"><X size={20}/></button>
           </header>
           <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
        </div>
      </div>
    );
  }
};

function ManagementHub({ forceCreation }: any) {
  const { totalRevenue, activeProjects, clients, setActiveClientId, setActiveModal, currentUser, notify, activeClientId: currentId, setClients, setIsCommercialOpen, activeClientData } = useContext(MarcenaContext);
  const [activeTab, setActiveTab] = useState('clientes');
  const [isCreating, setIsCreating] = useState(forceCreation || false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });

  const handlePickContact = async () => {
    if (!('contacts' in navigator && 'select' in (navigator as any).contacts)) {
      notify("Indisponível no navegador.");
      return;
    }
    try {
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
      if (contacts.length > 0) {
        setNewClient({ 
          name: contacts[0].name?.[0] || '', 
          phone: contacts[0].tel?.[0] || '' 
        });
        notify("Dados sintonizados!");
      }
    } catch (e) { notify("Erro ao aceder agenda."); }
  };

  const handleAddClient = async (e: any) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    
    const clientData = {
      ...newClient, 
      status: 'Lead', 
      valor_estimado: 0, 
      updatedAt: Date.now(),
      messages: [{ id: 'init', from: 'yara', text: `Canal master estabelecido para ${newClient.name}.`, timestamp: Date.now() }]
    };

    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), {
          ...clientData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setActiveClientId(docRef.id);
      } catch (e) {
        notify("Erro na Nuvem. Salvando local...");
        saveLocalClient(clientData);
      }
    } else {
      saveLocalClient(clientData);
    }
    
    setIsCreating(false);
    setNewClient({ name: '', phone: '' });
    setActiveModal(null);
    notify("Conectado!");
  };

  const saveLocalClient = (data: any) => {
    const id = `local_${Date.now()}`;
    const newEntry = { id, ...data };
    setClients((prev: any) => [newEntry, ...prev]);
    setActiveClientId(id);
  };

  const menuTabs = useMemo(() => {
    const base = ['clientes', 'oficina', 'admin'];
    if (currentUser?.isAdmin) return base;
    return ['clientes', 'oficina'];
  }, [currentUser]);

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      <nav className="flex bg-zinc-900 p-1.5 gap-1 overflow-x-auto no-scrollbar shrink-0 shadow-lg">
        {menuTabs.map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setIsCreating(false); }} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>{t}</button>
        ))}
      </nav>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
        {activeTab === 'clientes' && (
           <div className="space-y-4 animate-in fade-in">
              {isCreating ? (
                <form onSubmit={handleAddClient} className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-5 border border-slate-100 text-left">
                   <h3 className="text-xs font-black uppercase text-amber-600 mb-2">Manifestar Novo Cliente</h3>
                   <button type="button" onClick={handlePickContact} className="w-full p-4 bg-amber-50 text-amber-600 rounded-2xl border-2 border-dashed border-amber-200 flex items-center justify-center gap-3 font-black uppercase text-[10px] active:scale-95 transition-all"><Contact size={18} /> Puxar dos Contactos</button>
                   <input required placeholder="Nome do Cliente" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-zinc-900 border-2 border-transparent focus:border-amber-500 transition-all text-left" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                   <input placeholder="WhatsApp" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-zinc-900 border-2 border-transparent focus:border-amber-500 transition-all text-left" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                   <button type="submit" className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[11px] shadow-lg active:scale-95 text-white">Ativar Canal Master</button>
                   <button type="button" onClick={() => setIsCreating(false)} className="w-full py-2 text-zinc-400 font-bold uppercase text-[9px]">Cancelar</button>
                </form>
              ) : (
                <div className="space-y-3">
                   <button onClick={() => setIsCreating(true)} className="w-full p-5 bg-zinc-900 text-white rounded-[2.5rem] font-black uppercase text-[11px] flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95 text-white"><UserPlus size={20}/> Novo Canal Yara</button>
                   {clients.map((c: any) => (
                      <div key={c.id} className={`p-5 rounded-[2.5rem] border flex items-center gap-5 cursor-pointer transition-all ${currentId === c.id ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 shadow-sm'}`} onClick={() => { setActiveClientId(c.id); setActiveModal(null); }}>
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg ${currentId === c.id ? 'bg-amber-600' : 'bg-zinc-900'}`}>M</div>
                         <div className="flex-1 text-left"><p className="font-black text-sm text-zinc-900 leading-tight">{String(c.name)}</p><p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">{String(c.status || 'Lead')}</p></div>
                         <ChevronRight size={20} className="text-slate-200" />
                      </div>
                   ))}
                </div>
              )}
           </div>
        )}

        {activeTab === 'oficina' && (
           <div className="grid grid-cols-2 gap-4 animate-in fade-in text-left">
              <UI.Metric label="Receita" value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} icon={Coins} color="bg-emerald-600" />
              <UI.Metric label="Projetos" value={String(activeProjects)} icon={Hammer} color="bg-orange-600" />
              <UI.Metric 
                label="Produção" 
                value="CorteCloud" 
                icon={StoreIcon} 
                color="bg-blue-600" 
                onClick={() => {
                  if (!activeClientData) { notify("Selecione um projeto primeiro."); return; }
                  setIsCommercialOpen(true);
                  setActiveModal(null);
                }} 
              />
           </div>
        )}

        {activeTab === 'admin' && (
           <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-white space-y-4 text-left">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 text-left"><Terminal size={20} className="text-amber-500" /><h3 className="text-sm font-black uppercase tracking-widest leading-none">Mestre Terminal</h3></div>
              <p className="font-mono text-[10px] text-emerald-500 animate-pulse"># Cockpit Ativo...</p>
           </div>
        )}
      </div>
    </div>
  );
}

function WorkshopInner() {
  const { messages, activeClientData, activeClientId, setActiveModal, notify, setMessages } = useContext(MarcenaContext);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handlePipeline = async (text: string, base64: string | null = null) => {
    if (!activeClientId) { notify("Sintonize um cliente."); return; }
    setIsProcessing(true);
    const userMsg = { id: Date.now(), from: 'user', text: String(text || "[Mídia Sintonizada]"), type: base64 ? 'image' : 'text', src: base64 ? `data:image/png;base64,${base64}` : null };
    const history = [...messages, userMsg];
    setMessages(history);
    try {
      const resp = await YaraAI.analyze(text || "Analise técnica fiel ao rascunho.", base64);
      const yaraMsg = { id: Date.now()+1, from: 'yara', text: String(resp) };
      const finalHistory = [...history, yaraMsg];
      setMessages(finalHistory);
      await YaraAI.speak(resp);
      
      if (db && !activeClientId.startsWith('local_')) {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', activeClientId), { 
                messages: finalHistory, 
                updatedAt: serverTimestamp() 
            });
        } catch(e) {}
      }
    } catch (e) { notify("Erro Yara."); }
    finally { setIsProcessing(false); }
  };

  const startListening = () => {
    const Rec = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!Rec) return;
    const rec = new Rec(); rec.lang = 'pt-BR';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => { handlePipeline(e.results[0][0].transcript); setIsListening(false); };
    rec.start();
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden text-zinc-900 relative text-left">
      <div className="w-full max-w-[480px] mx-auto h-screen bg-white sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl border-zinc-900 sm:border-[12px] relative">
        
        <header className="bg-zinc-900 pt-16 pb-8 px-10 flex items-center justify-between text-white shrink-0 shadow-xl z-20">
          <div className="flex items-center gap-5 text-left">
            <UI.Logo size={40} />
            <div className="flex flex-col text-left">
               <h1 className="text-[12px] font-black uppercase tracking-[0.4em] truncate max-w-[160px] mb-1 text-white">{String(activeClientData?.name || "Cockpit Yara")}</h1>
               <div className="flex items-center gap-2">
                 <p className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest text-left">Sintonia Operacional</p>
                 {db ? <Cloud size={10} className="text-emerald-500" /> : <CloudOff size={10} className="text-amber-500" />}
               </div>
            </div>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 bg-[#fdfdfd] pb-44 flex flex-col custom-scrollbar text-left">
          {!activeClientId && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700 text-center">
              <UI.Logo size={120} />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Evaldo.OS Orquestração</p>
                <h2 className="text-xl font-black italic tracking-tighter text-zinc-300">Oficina Pronta</h2>
              </div>
              <button onClick={() => { setActiveModal('CABINET_HUB'); }} className="px-10 py-5 bg-zinc-900 text-white rounded-full text-[11px] font-black uppercase shadow-2xl active:scale-95 flex items-center gap-3 border border-white/5 active:scale-95 transition-all text-white">
                <PlusCircle size={20} className="text-amber-500" /> Manifestar Novo Canal
              </button>
            </div>
          )}
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex w-full ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in text-left`}>
               <div className={`max-w-[85%] flex flex-col gap-2 ${msg.from === 'user' ? 'items-end' : 'items-start'} text-left`}>
                  {msg.type === 'image' && <div className="bg-zinc-900 p-1.5 rounded-[2rem] shadow-2xl overflow-hidden max-w-[280px] border border-white/5 text-center"><img src={String(msg.src)} className="w-full h-auto rounded-[1.8rem]" alt="Rascunho" /></div>}
                  {msg.text && (
                    <div className={`p-5 rounded-[2rem] text-[13.5px] leading-relaxed font-medium text-left ${msg.from === 'yara' ? 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none shadow-sm' : 'bg-zinc-900 text-white rounded-tr-none shadow-xl text-white'}`}>
                      {String(msg.text)}
                    </div>
                  )}
               </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-3 px-5 py-3 bg-zinc-50 rounded-full self-start border border-zinc-100 animate-pulse text-left"><Loader2 className="animate-spin text-amber-500" size={14} /><span className="text-[9px] font-black uppercase text-zinc-400">Yara Orquestrando...</span></div>
          )}
        </main>

        <footer className="bg-white/95 backdrop-blur-md px-5 py-5 border-t border-zinc-100 flex items-center gap-4 shrink-0 shadow-2xl absolute bottom-0 w-full z-50 text-left">
          <button onClick={() => setActiveModal('CABINET_HUB')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl active:scale-90 transition-all text-white">
            <PlusCircle size={28} />
          </button>
          
          <div className="flex-1 bg-zinc-100 rounded-[1.5rem] flex items-center px-4 py-1.5 border border-zinc-200 text-left">
            <input type="text" placeholder="Comande a Yara..." className="flex-1 text-xs outline-none bg-transparent py-3 font-medium text-left text-zinc-800" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePipeline(inputText)} />
            <div className="flex items-center gap-2 text-zinc-400">
               <button onClick={() => galRef.current?.click()} className="p-1 hover:text-amber-600 transition-all active:scale-90"><FolderOpen size={20} /></button>
               <button onClick={() => camRef.current?.click()} className="p-1 hover:text-amber-600 transition-all active:scale-90"><Camera size={20} /></button>
            </div>
          </div>

          <button 
            onClick={inputText.trim() ? () => { const t=inputText; setInputText(""); handlePipeline(t); } : startListening} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-95 ${inputText.trim() ? 'bg-amber-600 shadow-amber-500/20' : (isListening ? 'bg-red-500 animate-pulse shadow-red-500/40' : 'bg-zinc-800')} text-white`}
          >
            {inputText.trim() ? <Send size={22}/> : <Mic size={22} />}
          </button>
        </footer>
      </div>
      
      <input type="file" ref={camRef} className="hidden" accept="image/*" capture="environment" onChange={async (e) => { const b = await fileToBase64(e.target.files![0]); handlePipeline("", b.data); }} />
      <input type="file" ref={galRef} className="hidden" accept="image/*" onChange={async (e) => { const b = await fileToBase64(e.target.files![0]); handlePipeline("", b.data); }} />
    </div>
  );
}

function LoginScreen({ onLogin }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const quickStart = () => {
    onLogin({ email: 'mestre@marcenapp.com.br', isAdmin: true });
  };

  return (
    <div className="fixed inset-0 z-[90000] bg-white flex flex-col items-center justify-center p-10 animate-in fade-in text-zinc-900">
      <div className="w-full max-w-[400px] space-y-12 text-center text-zinc-900">
        <UI.Logo size={100} onClick={quickStart} />
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 leading-none">Cockpit Yara</h2>
        <form onSubmit={(e) => { e.preventDefault(); setLoading(true); setTimeout(() => onLogin({ email, isAdmin: email === 'evaldo@marcenapp.com.br' }), 800); }} className="space-y-6 text-left">
          <input type="email" required className="w-full p-5 bg-zinc-100 rounded-[2rem] border-2 border-transparent focus:border-amber-500 outline-none font-bold text-zinc-900 text-left" placeholder="E-mail Master" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full p-5 bg-zinc-100 rounded-[2rem] border-2 border-transparent focus:border-amber-500 outline-none font-bold text-zinc-900 text-left" placeholder="Senha Master" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-xs shadow-2xl active:scale-95 transition-all text-white hover:bg-black">{loading ? "Sintonizando..." : "Entrar no Cockpit"}</button>
          <button type="button" onClick={quickStart} className="w-full py-2 text-zinc-400 font-bold uppercase text-[9px] hover:text-amber-600 transition-colors">Acesso Rápido de Mestre</button>
        </form>
      </div>
    </div>
  );
}

export function App() {
  const [view, setView] = useState('splash');
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientData, setActiveClientData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isCommercialOpen, setIsCommercialOpen] = useState(false);

  const notify = useCallback((text: string) => { setShowToast(String(text)); setTimeout(() => setShowToast(null), 3000); }, []);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => { 
      try { 
        await signInAnonymously(auth); 
      } catch (e) {
        console.warn("Cloud Auth failed, staying in Local Mode.");
      } 
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'clients');
    return onSnapshot(q, (snap) => { 
        const cloudClients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setClients((prev) => {
            const localOnly = prev.filter(c => c.id.startsWith('local_'));
            return [...localOnly, ...cloudClients].sort((a: any, b: any) => (b.updatedAt?.seconds || b.updatedAt || 0) - (a.updatedAt?.seconds || a.updatedAt || 0));
        });
    });
  }, [user]);

  useEffect(() => {
    if (!activeClientId) return;
    
    if (activeClientId.startsWith('local_')) {
        const localData = clients.find(c => c.id === activeClientId);
        if (localData) {
            setActiveClientData(localData);
            setMessages(localData.messages || []);
        }
        return;
    }

    if (!user || !db) return;
    const dRef = doc(db, 'artifacts', appId, 'public', 'data', 'clients', activeClientId);
    return onSnapshot(dRef, (snap) => { if (snap.exists()) { const d = snap.data(); setActiveClientData(d); setMessages(d.messages || []); } });
  }, [user, activeClientId, clients]);

  const stats = useMemo(() => {
    const s = { totalRevenue: 0, activeProjects: 0 };
    clients.forEach(c => {
      s.totalRevenue += parseFloat(c.valor_estimado || 0);
      if (['Produção', 'Instalação'].includes(c.status)) s.activeProjects++;
    });
    return s;
  }, [clients]);

  // Map active client to a project history item structure for sub-components
  const activeProject = useMemo(() => {
    if (!activeClientData) return null;
    return {
      ...activeClientData,
      id: activeClientId,
      name: activeClientData.name || "Projeto Sem Título",
      views3d: activeClientData.views3d || [activeClientData.messages?.find((m: any) => m.type === 'image')?.src].filter(Boolean) || [],
      bom: activeClientData.bom || "",
      technicalSpec: activeClientData.technicalSpec || {
        budgetPreview: {
          materialCost: activeClientData.custo_material || 0,
          laborCost: activeClientData.custo_mao_obra || 0,
          total: activeClientData.valor_estimado || 0
        },
        components: activeClientData.pecas || []
      }
    } as ProjectHistoryItem;
  }, [activeClientData, activeClientId]);

  if (view === 'splash') return (
    <div className="fixed inset-0 z-[99999] bg-[#09090b] flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-amber-600/5 blur-[120px] animate-pulse rounded-full" />
      <UI.Logo size={120} onClick={() => setView('login')} />
      <h1 className="text-4xl font-black italic text-white mt-10 tracking-tighter uppercase text-white">MARCENA<span className="text-amber-600">PP</span></h1>
      <button onClick={() => setView('login')} className="mt-16 px-12 py-4 bg-white/5 text-zinc-500 rounded-full text-[11px] font-black uppercase tracking-[0.5em] active:scale-95 transition-all text-zinc-500 hover:text-white border border-white/5">Iniciar Orquestração</button>
    </div>
  );

  if (!currentUser) return <LoginScreen onLogin={(u: any) => { setCurrentUser(u); setView('workshop'); }} />;

  return (
    <MarcenaContext.Provider value={{ 
      clients, setClients, activeClientId, activeClientData, messages, currentUser, 
      setView, setActiveClientId, activeModal, setActiveModal, setMessages, 
      setActiveClientData, setCurrentUser, notify, setIsCommercialOpen, ...stats 
    }}>
      <div className="relative h-screen w-full font-sans overflow-hidden bg-slate-100">
        <WorkshopInner />
        <UI.Drawer id="CABINET_HUB" title="Gestão da Oficina" color="bg-zinc-900" icon={PlusCircle} activeModal={activeModal} setActiveModal={setActiveModal}>
          <ManagementHub forceCreation={!activeClientId} />
        </UI.Drawer>
        
        {isCommercialOpen && activeProject && currentUser && (
          <CommercialDepartment 
            isOpen={isCommercialOpen}
            project={activeProject}
            profile={currentUser}
            onClose={() => setIsCommercialOpen(false)}
            showAlert={(msg) => notify(msg)}
          />
        )}

        {showToast && <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[300000] bg-zinc-900 text-white px-10 py-5 rounded-full shadow-2xl border border-amber-600/40 text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4">{String(showToast)}</div>}
      </div>
    </MarcenaContext.Provider>
  );
}
