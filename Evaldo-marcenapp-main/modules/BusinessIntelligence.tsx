
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, 
  Target, Zap, Lightbulb, ArrowUpRight, ArrowDownRight,
  DollarSign, Briefcase, Calendar, Info, Loader2, Sparkles,
  Activity, Gauge, MousePointer2, RefreshCw, FileText,
  Search, Filter, History, Eye, ChevronRight
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';
import { GoogleGenAI } from '@google/genai';

export const BusinessIntelligence: React.FC = () => {
  const { transactions, leads, projects } = useProjectStore();
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'global' | 'forensics'>('global');

  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const profit = totalIncome - totalExpense;
    const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    const pipelineValue = leads.reduce((acc, l) => acc + l.estimatedValue, 0);
    const forecast = totalIncome + (pipelineValue * 0.3);

    return { totalIncome, totalExpense, profit, margin, pipelineValue, forecast };
  }, [transactions, leads]);

  const askIARA = async () => {
    setLoadingAdvisor(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Aja como um CFO para Marcenarias de Luxo. 
      Dados: Receita ${formatCurrency(stats.totalIncome)}, Lucro ${formatCurrency(stats.profit)}, Margem ${stats.margin.toFixed(1)}%.
      Dê 3 diretrizes estratégicas para maximizar o lucro.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAdvice(response.text || "Continue monitorando seus indicadores.");
    } catch (err) {
      setAdvice("Conexão instável.");
    } finally {
      setLoadingAdvisor(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">Forensics</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Inteligência Financeira e Lucratividade Real por Projeto.</p>
        </div>
        <div className="flex bg-[#1c1917] p-1.5 rounded-2xl border border-white/5">
           <button onClick={() => setActiveView('global')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'global' ? 'bg-amber-500 text-black' : 'text-stone-500'}`}>Visão Global</button>
           <button onClick={() => setActiveView('forensics')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'forensics' ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500'}`}>Detalhamento Obras</button>
        </div>
      </header>

      {activeView === 'global' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-[#1c1917] border-white/5 p-8 relative overflow-hidden group">
               <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10"></div>
               <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-4">Margem EBITDA Real</p>
               <h3 className="text-3xl font-black text-amber-50 italic">{stats.margin.toFixed(1)}%</h3>
               {/* Added className to Badge to fix module error */}
               <Badge variant="success" className="mt-4">+2.4% vs Mês Anterior</Badge>
            </Card>
            <Card className="bg-[#1c1917] border-white/5 p-8">
               <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-4">Custo Fixo Oficina</p>
               <h3 className="text-3xl font-black text-red-500 italic">{formatCurrency(stats.totalExpense * 0.4)}</h3>
            </Card>
            <Card className="bg-[#1c1917] border-white/5 p-8">
               <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-4">Valor Médio Ticket</p>
               <h3 className="text-3xl font-black text-amber-50 italic">{formatCurrency(12500)}</h3>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-black shadow-2xl">
               <Gauge size={24} strokeWidth={2.5}/>
               <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight mt-6">Capacidade de Produção: 85%</h3>
               <p className="text-[9px] font-black uppercase mt-4 opacity-60">Status: Próximo ao limite operacional</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             <div className="lg:col-span-8">
                <Card className="p-10 border-white/5">
                   <div className="flex justify-between items-center mb-10">
                      <h3 className="text-xl font-black italic uppercase text-amber-50 flex items-center gap-4"><Activity className="text-amber-500"/> Performance Mensal</h3>
                      <button className="text-[10px] font-black text-stone-500 uppercase">Exportar Relatório</button>
                   </div>
                   <div className="h-64 bg-black/20 rounded-3xl flex items-end justify-between p-8">
                      {[40, 70, 45, 90, 65, 110, 80].map((v, i) => (
                        <div key={i} className="w-12 bg-indigo-500/20 rounded-t-lg relative group transition-all hover:bg-amber-500/40" style={{ height: `${v}%` }}>
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">R$ {v}k</div>
                        </div>
                      ))}
                   </div>
                </Card>
             </div>
             <div className="lg:col-span-4">
                <Card className="p-10 bg-indigo-600 text-white relative overflow-hidden h-full">
                   <div className="absolute top-0 right-0 p-6 opacity-10"><Lightbulb size={64}/></div>
                   <h3 className="text-2xl font-black italic uppercase mb-8 leading-none">Advisor Estratégico</h3>
                   {advice ? (
                     <p className="text-sm font-medium italic opacity-90 leading-relaxed mb-10">"{advice}"</p>
                   ) : (
                     <p className="text-sm opacity-80 mb-10">A IARA analisará seu fluxo de caixa para sugerir onde cortar custos.</p>
                   )}
                   <Button variant="dark" className="w-full bg-black/40 border-none" onClick={askIARA} disabled={loadingAdvisor}>
                      {loadingAdvisor ? <Loader2 className="animate-spin"/> : 'Gerar Insight IA'}
                   </Button>
                </Card>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
           <Card className="p-0 border-white/5 overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-black/40 text-[9px] font-black uppercase text-stone-600">
                    <tr>
                       <th className="px-8 py-5">Projeto</th>
                       <th className="px-8 py-5">Venda Estimada</th>
                       <th className="px-8 py-5">Custo Real (Chapas)</th>
                       <th className="px-8 py-5">Mão de Obra</th>
                       <th className="px-8 py-5">Lucro Líquido</th>
                       <th className="px-8 py-5">Status Margem</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {projects.slice(0, 5).map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-all text-xs font-bold">
                         <td className="px-8 py-6 uppercase text-amber-50">{p.projectName}</td>
                         <td className="px-8 py-6">{formatCurrency(25000)}</td>
                         <td className="px-8 py-6 text-red-400">{formatCurrency(8500)}</td>
                         <td className="px-8 py-6 text-red-400">{formatCurrency(4000)}</td>
                         <td className="px-8 py-6 text-emerald-400 font-black">{formatCurrency(12500)}</td>
                         <td className="px-8 py-6">
                            <Badge variant="success">50% Margem</Badge>
                         </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr><td colSpan={6} className="px-8 py-20 text-center opacity-20 font-black uppercase tracking-[0.4em]">Aguardando conclusão de obras para forensics</td></tr>
                    )}
                 </tbody>
              </table>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-10 border-amber-500/10 bg-amber-500/5">
                 <div className="flex items-center gap-4 mb-6">
                    <TrendingDown className="text-red-500"/>
                    <h4 className="text-sm font-black text-amber-50 uppercase">Gargalos de Lucratividade</h4>
                 </div>
                 <p className="text-[10px] text-stone-500 font-bold uppercase leading-relaxed">Sua equipe de montagem excedeu o prazo em 15% nos últimos 3 projetos. Isso consumiu R$ 2.400 da sua margem líquida total.</p>
              </Card>
              <Card className="p-10 border-indigo-500/10 bg-indigo-500/5">
                 <div className="flex items-center gap-4 mb-6">
                    <TrendingUp className="text-emerald-500"/>
                    <h4 className="text-sm font-black text-amber-50 uppercase">Oportunidade de Ganho</h4>
                 </div>
                 <p className="text-[10px] text-stone-500 font-bold uppercase leading-relaxed">Comprar MDF em lote para os próximos 4 projetos reduzirá o custo de material em 8% (Economia de R$ 3.200).</p>
              </Card>
           </div>
        </div>
      )}
    </div>
  );
};
