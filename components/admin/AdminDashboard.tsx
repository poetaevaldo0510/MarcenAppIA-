
import React, { useMemo, useState } from "react";
import { 
  TrendingUp, Users, Package, CreditCard, Activity, 
  MessageSquare, FileText, Settings, ChevronRight, AlertCircle,
  BarChart3, PieChart, ShieldAlert, Zap, Search, Eye, Download,
  Clock, DollarSign, Database, HardDrive, Smartphone, Globe,
  Key, ShieldCheck, ExternalLink, RefreshCw, Layers
} from "lucide-react";
import { useStore } from "../../store/yaraStore";
import { CreditsEngine } from "../../core/yara-engine/creditsEngine";

type AdminTab = 'OVERVIEW' | 'PROJECTS' | 'REVENUE' | 'KEYS' | 'HEALTH';

export const AdminDashboard = () => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  const metrics = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const topups = store.transactions.filter(t => t.type === 'topup');
    
    const revenueTotal = topups.reduce((acc, t) => acc + (t.amount * 2.5), 0); // Mock multiplier for money
    const revenueToday = topups
      .filter(t => new Date(t.timestamp).setHours(0,0,0,0) === today)
      .reduce((acc, t) => acc + (t.amount * 2.5), 0);

    const projectsCount = store.messages.filter(m => m.project).length;
    const creditsConsumed = store.transactions
      .filter(t => t.type === 'consumption')
      .reduce((acc, t) => acc + t.amount, 0);

    const activeLeads = store.clients.length;

    return { revenueTotal, revenueToday, projectsCount, creditsConsumed, activeLeads };
  }, [store.transactions, store.messages, store.clients]);

  const projectsList = useMemo(() => {
    return store.messages
      .filter(m => m.project)
      .map(m => ({
        ...m.project,
        userName: store.clients.find(c => c.id === store.activeClientId)?.name || "Cliente Master",
        timestamp: m.timestamp
      }))
      .reverse();
  }, [store.messages, store.clients]);

  const handleSwitchKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      store.setHasKey(hasKey);
      if (hasKey) store.setKeyStatus('active');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 overflow-hidden font-sans">
      <div className="flex gap-1 p-2 bg-white border-b border-zinc-200 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Dashboard', icon: BarChart3 },
          { id: 'PROJECTS', label: 'Projetos', icon: Package },
          { id: 'REVENUE', label: 'Financeiro', icon: DollarSign },
          { id: 'KEYS', label: 'Hardware', icon: Key },
          { id: 'HEALTH', label: 'Saúde IA', icon: Activity },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Receita Estimada" value={`R$ ${metrics.revenueTotal.toLocaleString()}`} icon={TrendingUp} color="text-emerald-600" />
              <StatCard label="Projetos Ativos" value={metrics.projectsCount.toString()} icon={Package} color="text-blue-600" />
              <StatCard label="Créditos Consumidos" value={metrics.creditsConsumed.toString()} icon={Zap} color="text-amber-600" />
              <StatCard label="Leads Ativos" value={metrics.activeLeads.toString()} icon={Users} color="text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2"><Activity size={14}/> Atividade de Hardware</h3>
                <div className="h-48 bg-zinc-50 rounded-2xl flex items-end justify-between p-4 gap-2">
                  {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-amber-500/20 rounded-t-lg relative group transition-all hover:bg-amber-500/40" style={{ height: `${h}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">7.2ms</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2"><PieChart size={14}/> Distribuição de Planos</h3>
                <div className="space-y-4 pt-4">
                  <PlanProgress label="Industrial Master" percent={65} color="bg-zinc-900" />
                  <PlanProgress label="Pro Studio" percent={25} color="bg-amber-600" />
                  <PlanProgress label="Basic Starter" percent={10} color="bg-zinc-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'KEYS' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
            <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 text-center space-y-8 shadow-xl">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${store.hasKey ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
                {store.hasKey ? <ShieldCheck size={48} /> : <ShieldAlert size={48} />}
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-zinc-900">
                  {store.hasKey ? 'Hardware Conectado' : 'Hardware Desconectado'}
                </h2>
                <p className="text-zinc-500 text-sm font-medium px-12">
                  O MarcenApp utiliza chaves de hardware industrial para processar renders 8K e análises de engenharia avançada via Google Cloud.
                </p>
              </div>

              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 text-left space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <span>Status do Link</span>
                  <span className={store.hasKey ? 'text-emerald-600' : 'text-red-600'}>{store.hasKey ? 'Operacional' : 'Offline'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <span>Última Checagem</span>
                  <span className="text-zinc-900">{store.lastHardwareCheck ? new Date(store.lastHardwareCheck).toLocaleTimeString() : 'Nunca'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <span>Ambiente</span>
                  <span className="text-zinc-900">Produção v3.83</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSwitchKey}
                  className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                >
                  <RefreshCw size={18} /> Alterar Hardware Master
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-4 text-zinc-400 hover:text-zinc-900 font-bold uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink size={12} /> Documentação de Faturamento Industrial
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Layers size={24}/></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Cotas de Render</p>
                  <p className="text-xl font-black italic">Ilimitado</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm flex items-center gap-5">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Globe size={24}/></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Região Master</p>
                  <p className="text-xl font-black italic">Auto-Global</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PROJECTS' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="p-6">ID Projeto</th>
                  <th className="p-6">Lead</th>
                  <th className="p-6">Complexidade</th>
                  <th className="p-6">Data</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {projectsList.map((p, i) => (
                  <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                    <td className="p-6 font-mono text-[10px] text-zinc-400">{p.projectId}</td>
                    <td className="p-6 font-black uppercase text-zinc-900 text-xs">{p.userName}</td>
                    <td className="p-6">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className={`w-1.5 h-1.5 rounded-full ${j < (p.complexity / 2) ? 'bg-amber-500' : 'bg-zinc-200'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-6 text-xs text-zinc-500">{new Date(p.timestamp).toLocaleDateString()}</td>
                    <td className="p-6 text-right">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors group-hover:scale-110"><Eye size={18}/></button>
                    </td>
                  </tr>
                ))}
                {projectsList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-zinc-400 font-black uppercase text-xs tracking-widest opacity-40 italic">
                      Nenhum projeto materializado no buffer...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'REVENUE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-xl flex flex-col items-center text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Total em Custódia Hub</span>
              <h2 className="text-5xl font-black italic text-zinc-900">R$ {metrics.revenueTotal.toLocaleString()}</h2>
              <div className="flex gap-4 pt-4">
                <button className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Extrair Relatório</button>
                <button className="px-8 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Configurar Stripe</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Smartphone size={16}/> Compras de Créditos</h3>
                  <div className="space-y-4">
                    {store.transactions.filter(t => t.type === 'topup').slice(0, 5).map((t, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div>
                          <p className="text-xs font-black uppercase text-zinc-900">{t.description}</p>
                          <p className="text-[9px] text-zinc-400">{new Date(t.timestamp).toLocaleDateString()}</p>
                        </div>
                        <span className="font-black text-emerald-600">+ R$ {(t.amount * 2.5).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><CreditCard size={16}/> Logs de Faturamento</h3>
                  <div className="space-y-4 opacity-40">
                    <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" />
                    <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
    <div className="flex justify-between items-center">
      <div className={`p-2 bg-zinc-50 rounded-lg ${color}`}><Icon size={18} /></div>
      <TrendingUp size={14} className="text-zinc-300" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-black italic text-zinc-900 tracking-tight">{value}</p>
    </div>
  </div>
);

const PlanProgress = ({ label, percent, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900">{percent}%</span>
    </div>
    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);
