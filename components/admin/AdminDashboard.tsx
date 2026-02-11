
import React, { useState } from "react";
import { 
  BarChart3, Key, Terminal, Eye, EyeOff, Save, Activity, 
  RefreshCw, ShieldCheck, Zap, Server, Settings2, DollarSign, Users,
  CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { useStore } from "../../store/yaraStore";
import { YaraEngine } from "../../core/yara-engine/yaraEngine";

export const AdminDashboard = () => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState('KEYS');
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(store.manualApiKey || "");
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    store.setManualApiKey(tempKey.trim() || null);
    store.setKeyStatus(tempKey.trim() ? 'active' : 'inactive');
    alert("NÚCLEO ATUALIZADO: O hardware do MarcenApp agora utilizará sua chave master salva.");
  };

  const handleTest = async () => {
    setIsTesting(true);
    const ok = await YaraEngine.testConnection(tempKey.trim() || undefined);
    setIsTesting(false);
    if (ok) {
      store.setKeyStatus('active');
      alert("CONEXÃO ESTABELECIDA: Hardware Industrial operacional.");
    } else {
      store.setKeyStatus('error');
      alert("ERRO DE CONEXÃO: Certifique-se de que sua chave possui o faturamento (billing) ativo e acesso à Generative AI.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 overflow-hidden text-left">
      <div className="flex gap-1 p-2 bg-white border-b border-zinc-200 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'KEYS', label: 'Hardware API', icon: Key },
          { id: 'OVERVIEW', label: 'Métricas Hub', icon: BarChart3 },
          { id: 'LOGS', label: 'Console Yara', icon: Terminal },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-100'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        {activeTab === 'KEYS' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-zinc-100 shadow-xl space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={120} /></div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl"><Key size={32} /></div>
                   <div>
                     <h3 className="text-2xl font-black italic">Engenharia de Hardware</h3>
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Configure sua Chave API Master (Google Cloud)</p>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <label className="text-[9px] font-black uppercase text-zinc-400 mb-2 block ml-2">GOOGLE API KEY</label>
                  <input 
                    type={showKey ? "text" : "password"}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Cole sua chave master aqui..."
                    className="w-full bg-zinc-100 border-2 border-transparent focus:border-amber-500/50 p-6 rounded-3xl text-sm font-mono outline-none transition-all pr-16 shadow-inner"
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-6 bottom-6 text-zinc-400 hover:text-amber-600 transition-colors">
                    {showKey ? <EyeOff size={24}/> : <Eye size={24}/>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleTest} disabled={isTesting} className="py-5 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm">
                    {isTesting ? <RefreshCw className="animate-spin" size={18}/> : <Activity size={18}/>} Testar Conexão
                  </button>
                  <button onClick={handleSave} className="py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl hover:bg-zinc-800">
                    <Save size={18}/> Salvar No Core
                  </button>
                </div>

                <div className={`p-6 rounded-[2rem] border flex items-center justify-between transition-colors ${
                  store.keyStatus === 'active' ? 'bg-emerald-50 border-emerald-100' : 
                  store.keyStatus === 'error' ? 'bg-red-50 border-red-100' : 
                  'bg-zinc-50 border-zinc-200'
                }`}>
                   <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        store.keyStatus === 'active' ? 'bg-emerald-500' : 
                        store.keyStatus === 'error' ? 'bg-red-500' : 
                        'bg-zinc-300'
                      } animate-pulse`} />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">
                          Status do Motor: {store.keyStatus.toUpperCase()}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">
                          {store.manualApiKey ? 'Utilizando Chave Manual Ativa' : 'Utilizando Hardware Base Nativo'}
                        </p>
                      </div>
                   </div>
                   {store.keyStatus === 'active' ? <CheckCircle2 size={24} className="text-emerald-500" /> : 
                    store.keyStatus === 'error' ? <XCircle size={24} className="text-red-500" /> :
                    <Server size={24} className="text-zinc-300" />}
                </div>
              </div>
            </div>

            <div className="p-8 bg-zinc-900 text-zinc-400 rounded-[2.5rem] space-y-4 shadow-2xl">
               <div className="flex items-center gap-3 text-amber-500 mb-2">
                 <ShieldCheck size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">Protocolo de Segurança Hub</span>
               </div>
               <p className="text-[11px] leading-relaxed italic">
                 Para liberar o <strong>Render 8K (Engine Pro)</strong>, sua chave deve estar vinculada a um projeto com faturamento ativo no Google Cloud. O MarcenApp nunca compartilha sua chave; ela permanece salva exclusivamente no seu dispositivo.
               </p>
               <div className="pt-2 flex items-center gap-2 text-[9px] font-bold text-zinc-500">
                 <AlertCircle size={12} />
                 <span>Erros 403 (PERMISSION_DENIED) indicam falta de cota ou billing inativo.</span>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'OVERVIEW' && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { label: 'Projetos Concluídos', value: store.messages.filter(m => m.project).length, icon: Zap, color: 'text-amber-500' },
                { label: 'Créditos Disponíveis', value: store.credits, icon: DollarSign, color: 'text-emerald-500' },
                { label: 'Leads no Pipeline', value: store.clients.length, icon: Users, color: 'text-blue-500' },
                { label: 'Eficiência de Hardware', value: '98.7%', icon: Activity, color: 'text-purple-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{stat.label}</p>
                      <p className="text-3xl font-black italic text-zinc-900">{stat.value}</p>
                   </div>
                   <stat.icon size={40} className={stat.color} />
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};
