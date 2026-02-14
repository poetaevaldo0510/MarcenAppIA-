
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Loader2, Plus, Camera, Zap, ChevronLeft, 
  Settings, Mic, Image as ImageIcon, X, Share2, Sparkles, Wand2, UserPlus, Lock, FileUp, Key, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Button, Modal, InputGroup, Badge, Card } from '../components/UI';
import { Logo } from '../components/Logo';
import { analyzeSketchForDNA, generateYARARender } from '../geminiService';
import { useProjectStore } from '../store/useProjectStore';

export const Studio3D: React.FC<any> = ({ onNavigate }) => {
  const { 
    projects, activeProjectId, addMessage, updateActiveDNA, createProject,
    isAssistantActive, setAssistantActive
  } = useProjectStore();

  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showApiError, setShowApiError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [adjustmentPrompt, setAdjustmentPrompt] = useState('');
  const [newClient, setNewClient] = useState({ name: '', phone: '' });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const activeProject = projects.find(p => p.id === activeProjectId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeProject?.chatHistory?.length, loading]);

  const handleKeySelection = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setShowApiError(false);
      alert("Chave industrial vinculada! Tente materializar novamente.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;

    setLoading(true);
    setLoadingStep('Analisando rascunho...');
    setShowAddMenu(false);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fullBase64 = reader.result as string;
        const base64Data = fullBase64.split(',')[1];
        addMessage(activeProject.id, 'user', "Enviando rascunho...", fullBase64);

        const extractedDNA: any = await analyzeSketchForDNA(base64Data);
        updateActiveDNA(extractedDNA);

        setLoadingStep('Materializando em 4K...');
        const renderUrl = await generateYARARender(
          { ...activeProject.environments[0].dna, ...extractedDNA } as any, 
          `MATERIALIZAÇÃO INDUSTRIAL: Transforme este rascunho em uma foto real de marcenaria de luxo em um ambiente decorado.`,
          'decorated',
          'corner',
          base64Data
        );

        addMessage(activeProject.id, 'assistant', `Mestre, ambiente materializado!📐 ${extractedDNA.width || '2.4'}x${extractedDNA.height || '2.6'}m.`, renderUrl);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      if (err.message?.includes("permission") || err.message?.includes("key") || err.message?.includes("not found")) {
        setShowApiError(true);
      } else {
        addMessage(activeProject.id, 'assistant', 'Falha na leitura. Tente uma foto com mais luz.');
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleAdjustRender = async () => {
    if (!adjustmentPrompt || !activeProject) return;
    const prompt = adjustmentPrompt;
    setAdjustmentPrompt('');
    setShowAdjustModal(false);
    setLoading(true);
    setLoadingStep('Refinando acabamentos...');

    addMessage(activeProject.id, 'user', `Ajuste: ${prompt}`);
    
    try {
      const dna = activeProject.environments[0].dna;
      const newRender = await generateYARARender(
        dna as any, 
        `AJUSTE TÉCNICO: ${prompt}. Mantenha a estrutura anterior.`,
        'decorated',
        'corner',
        selectedImage?.split(',')[1]
      );
      addMessage(activeProject.id, 'assistant', `Refinamento concluído conforme seu comando.`, newRender);
    } catch (err: any) {
      if (err.message?.includes("permission")) setShowApiError(true);
      else addMessage(activeProject.id, 'assistant', 'Não consegui aplicar o ajuste.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  if (!activeProject && !showStartModal) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0d1418] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
           <div className="w-full h-full bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:30px_30px]"></div>
        </div>
        <div className="relative z-10 space-y-10 animate-in fade-in duration-1000">
           <div className="w-28 h-28 bg-indigo-600 rounded-[3rem] flex items-center justify-center text-white mx-auto shadow-[0_0_80px_rgba(79,70,229,0.3)]">
              <Zap size={56} fill="white" className="animate-pulse" />
           </div>
           <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">YARA.<span className="text-indigo-400">Studio</span></h2>
              <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.5em] mt-4">Laboratório de Materialização Industrial</p>
           </div>
           <Button variant="magic" className="h-20 px-16 rounded-[2.5rem] shadow-2xl" onClick={() => setShowStartModal(true)}>Iniciar Nova Obra</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1418] relative">
      <header className="px-6 h-20 bg-[#202c33]/90 backdrop-blur-xl flex items-center justify-between border-b border-white/5 z-50">
         <div className="flex items-center gap-5">
            <button onClick={() => onNavigate('dashboard')} className="p-2.5 bg-white/5 text-stone-400 hover:text-white rounded-2xl transition-all"><ChevronLeft size={24} /></button>
            <div className="flex items-center gap-4">
               <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">{activeProject?.clientName.charAt(0)}</div>
               <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">{activeProject?.clientName}</h2>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">YARA v5.0 Active</span>
                  </div>
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={() => onNavigate('crm')} className="p-3 bg-white/5 rounded-xl text-stone-400 hover:text-white transition-all shadow-lg"><UserPlus size={20}/></button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 wa-bg relative scrollbar-hide">
         <div className="relative z-10 max-w-4xl mx-auto pb-4">
            {activeProject?.chatHistory.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-10`}>
                <div className={`max-w-[85%] md:max-w-[70%] p-6 shadow-2xl relative transition-all animate-in slide-in-from-bottom-2 ${m.role === 'user' ? 'bubble-user text-white border-2 border-white/5' : 'bubble-bot text-stone-200 border-2 border-white/5 backdrop-blur-md'}`}>
                  {m.image && (
                    <div className="relative group cursor-pointer overflow-hidden rounded-[2rem] mb-5 border border-white/10 shadow-3xl" onClick={() => { setSelectedImage(m.image!); setShowAdjustModal(true); }}>
                       <img src={m.image} className="w-full h-auto transition-transform duration-[15s] group-hover:scale-110" alt="Projeto" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-6 opacity-0 group-hover:opacity-100 transition-all">
                          <div className="bg-amber-500 text-black px-6 py-3 rounded-full font-black text-[10px] uppercase flex items-center gap-3 shadow-2xl scale-90 group-hover:scale-100 transition-transform"><Wand2 size={16}/> Alterar Acabamentos</div>
                       </div>
                    </div>
                  )}
                  <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap italic">
                    {m.role === 'assistant' && !m.image ? `"${m.text}"` : m.text}
                  </p>
                  <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest absolute -bottom-6 left-2">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="bubble-bot p-6 flex flex-col gap-4 border-2 border-indigo-500/20 shadow-indigo-500/5 backdrop-blur-xl max-w-sm">
                    <div className="flex items-center gap-4">
                       <Loader2 className="animate-spin text-indigo-400" size={24}/>
                       <span className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.3em]">{loadingStep}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 animate-progress-indefinite"></div>
                    </div>
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
         </div>
      </div>

      <footer className="p-6 bg-[#202c33] border-t border-white/5 z-[60] shrink-0">
         <div className="max-w-4xl mx-auto flex items-end gap-4">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className={`p-4.5 bg-white/5 text-stone-400 rounded-[1.5rem] hover:bg-white/10 transition-all ${showAddMenu ? 'rotate-45 text-amber-500' : ''}`}><Plus size={26} /></button>
            <div className="flex-1 bg-[#2a3942] rounded-[2rem] flex items-center px-7 border-2 border-white/5 shadow-inner min-h-[64px] group focus-within:border-indigo-500/50 transition-all">
               <textarea 
                 value={messageInput} 
                 onChange={e => setMessageInput(e.target.value)} 
                 rows={1} 
                 placeholder="Instruir YARA ou Enviar Rascunho..." 
                 className="flex-1 bg-transparent border-none py-4 text-[16px] font-medium text-white focus:outline-none resize-none max-h-32 scrollbar-hide placeholder:text-stone-600" 
               />
            </div>
            <button 
              onClick={() => setAssistantActive(!isAssistantActive)} 
              className={`p-5 rounded-[1.5rem] transition-all shadow-xl active:scale-95 ${isAssistantActive ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
            >
               <Mic size={26} strokeWidth={2.5} />
            </button>
         </div>
      </footer>

      {showAddMenu && (
        <div className="absolute bottom-28 left-8 z-[110] animate-in slide-in-from-bottom-4 duration-300">
           <div className="bg-[#2a3942]/90 backdrop-blur-2xl p-4 rounded-[2.5rem] border-2 border-white/10 shadow-3xl flex flex-col items-center gap-4">
              <button onClick={() => cameraInputRef.current?.click()} className="p-5 bg-indigo-600 text-white rounded-2xl hover:scale-110 shadow-xl transition-all" title="Foto da Obra"><Camera size={26} /></button>
              <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-amber-500 text-black rounded-2xl hover:scale-110 shadow-xl transition-all" title="Enviar Rascunho"><FileUp size={26} /></button>
           </div>
        </div>
      )}

      {/* Modal de Erro de API (Permission Denied) */}
      <Modal isOpen={showApiError} onClose={() => setShowApiError(false)} title="Segurança Industrial: Restrição de Acesso" maxWidth="max-w-md">
         <div className="space-y-8 text-center p-4">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <Key size={40} className="text-red-500" />
            </div>
            <div className="space-y-4">
               <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">Acesso Negado ao Motor Pro</h3>
               <p className="text-sm font-medium text-stone-500 leading-relaxed italic">"Mestre, o motor YARA requer uma chave de API válida com faturamento ativo no Google Cloud."</p>
            </div>
            <div className="bg-[#1c1917] p-6 rounded-3xl border border-red-500/20 text-left">
               <div className="flex items-center gap-3 text-red-500 mb-2">
                  <AlertTriangle size={16}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Procedimento Técnico</span>
               </div>
               <p className="text-[11px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed">Clique abaixo para abrir o seletor oficial e vincular sua chave mestra.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
               <Button variant="primary" className="h-16 rounded-2xl" onClick={handleKeySelection} icon={RefreshCw}>Selecionar Chave Master</Button>
               <Button variant="ghost" className="h-12 text-stone-600" onClick={() => setShowApiError(false)}>Fechar</Button>
            </div>
         </div>
      </Modal>

      {/* Modal de Refinamento */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Refinar Acabamentos" maxWidth="max-w-md">
         <div className="space-y-8">
            <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border-2 border-white/5 shadow-2xl relative">
               <img src={selectedImage || ''} className="w-full h-full object-cover" />
            </div>
            <InputGroup 
               label="Comando de Ajuste" 
               placeholder="Ex: Troque para MDF Freijó e adicione LED nas prateleiras..." 
               value={adjustmentPrompt} 
               onChange={setAdjustmentPrompt} 
            />
            <div className="grid grid-cols-2 gap-4">
               <Button variant="secondary" className="h-16 rounded-2xl" onClick={() => setShowAdjustModal(false)}>Cancelar</Button>
               <Button variant="magic" className="h-16 rounded-2xl" onClick={handleAdjustRender} disabled={!adjustmentPrompt}>Aplicar Refino</Button>
            </div>
         </div>
      </Modal>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />

      <Modal isOpen={showStartModal} onClose={() => setShowStartModal(false)} title="Iniciar Nova Obra" maxWidth="max-w-md">
         <div className="space-y-10">
            <InputGroup label="Identificação do Cliente" placeholder="Ex: Loft Vila Nova" value={newClient.name} onChange={(v:any) => setNewClient({...newClient, name: v})} />
            <InputGroup label="WhatsApp do Projeto" placeholder="11 99999-9999" value={newClient.phone} onChange={(v:any) => setNewClient({...newClient, phone: v})} />
            <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20">
               <p className="text-[11px] text-stone-500 font-bold uppercase leading-relaxed italic text-center">"Após criar, envie o rascunho ou use áudio para detalhar os ambientes."</p>
            </div>
            <Button variant="primary" className="w-full h-20 rounded-[2.5rem]" onClick={() => { if(newClient.name) createProject(newClient.name, newClient.phone); setShowStartModal(false); }}>Conectar ao Ecossistema</Button>
         </div>
      </Modal>

      <style>{`
        @keyframes progress-indefinite {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .animate-progress-indefinite {
          width: 40%;
          animation: progress-indefinite 2s infinite linear;
        }
      `}</style>
    </div>
  );
};
