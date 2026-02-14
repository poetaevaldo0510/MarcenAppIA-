
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, ShieldCheck, Diamond, Briefcase, 
  BarChart3, Landmark, Sparkles, Loader2, 
  ArrowUpRight, Info, Award, Target, Zap, 
  Coins, FileSearch, Building2, History, TrendingDown,
  ArrowRight, Activity
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/UI';
import { useProjectStore } from '../../store/useProjectStore';
import { formatCurrency } from '../../utils';
import { GoogleGenAI } from '@google/genai';

export const ValuationHub: React.FC = () => {
  const { transactions, leads, projects } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const valuationData = useMemo(() => {
    const cash = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) - 
                 transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const pipelineValue = leads.reduce((acc, l) => acc + l.estimatedValue, 0);
    const contractsValue = projects.length * 18500; // Ticket médio atualizado
    const assetValue = 125000; // Valor de rede, servidores e marca
    
    const multiplier = 2.45; // Multiplicador de Ecossistema (SaaS + Indústria)
    const equity = (cash + assetValue + (contractsValue * 0.9) + (pipelineValue * 0.3)) * multiplier;

    return { cash, pipelineValue, contractsValue, assetValue, equity, multiplier };
  }, [transactions, leads, projects]);

  const generateAudit = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise o Valuation do Ecossistema MarcenaPP: 
      Equity Global: ${formatCurrency(valuationData.equity)}, 
      Contratos em Execução: ${valuationData.contractsValue}, 
      Pipeline de Vendas: ${valuationData.pipelineValue}.
      Gere um parecer de Governança Master para o CEO Evaldo. Foque em: Valorização da rede, blindagem de margem e expansão via licenciamento.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      setReport(response.text || "Parecer em processamento.");
    } catch (e) {
      setReport("Erro ao auditar ecossistema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto p-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <Badge variant="danger">Master Governance Hub</Badge>
             <div className="flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest italic">Live Analytics: Global Ecosystem</span>
             </div>
          </div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white leading-none">Holding.<span className="text-amber-500">Valuation</span></h1>
          <p className="text-stone-500 text-sm font-bold uppercase tracking-[0.3em] mt-4">Avaliação patrimonial consolidada de todas as unidades MarcenaPP.</p>
        </div>
        <Button variant="magic" icon={FileSearch} onClick={generateAudit} disabled={loading} className="h-16 px-12 rounded-2xl shadow-amber-600/20">
          {loading ? <Loader2 className="animate-spin" /> : 'Executar Auditoria CEO'}
        </Button>
      </header>

      {/* Equity Global Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 bg-gradient-to-br from-[#1c1917] to-black border-amber-500/20 p-12 relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] group-hover:bg-amber-500/10 transition-all duration-1000"></div>
            <div className="relative z-10">
               <p className="text-amber-500/50 text-[10px] font-black uppercase tracking-[0.5em] mb-6">Valor Consolidado da Marca (Equity Value)</p>
               <h2 className="text-8xl font-black text-amber-50 tracking-tighter italic">{formatCurrency(valuationData.equity)}</h2>
               
               <div className="grid grid-cols-3 gap-12 mt-20 pt-12 border-t border-white/5">
                  <div>
                     <p className="text-[9px] text-stone-600 font-black uppercase tracking-widest mb-2">Propriedade Intelectual</p>
                     <p className="text-xl font-black text-white">{formatCurrency(valuationData.assetValue)}</p>
                  </div>
                  <div>
                     <p className="text-[9px] text-stone-600 font-black uppercase tracking-widest mb-2">Contratos de Rede</p>
                     <p className="text-xl font-black text-white">{formatCurrency(valuationData.contractsValue)}</p>
                  </div>
                  <div>
                     <p className="text-[9px] text-stone-600 font-black uppercase tracking-widest mb-2">Fundo Garantidor</p>
                     <p className="text-xl font-black text-emerald-500">{formatCurrency(valuationData.cash)}</p>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="bg-indigo-600 p-10 text-white border-none flex flex-col justify-between shadow-3xl shadow-indigo-600/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Landmark size={200}/></div>
            <div>
               <div className="w-16 h-16 bg-white/10 rounded-[1.8rem] flex items-center justify-center mb-8 border border-white/20">
                  <TrendingUp size={32} />
               </div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-4">Maturidade<br/>do Ecossistema</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed italic">Indicador de penetração de mercado e automação IARA.</p>
            </div>
            <div className="mt-12">
               <span className="text-6xl font-black tracking-tighter">{valuationData.multiplier}x</span>
               <p className="text-[10px] font-black uppercase tracking-widest mt-2">Prêmio de Escala Industrial</p>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 border-white/5 bg-[#141210]">
               <h3 className="text-lg font-black italic uppercase text-amber-50 mb-8 flex items-center gap-3">
                  <Building2 className="text-amber-500" /> Saúde do Grupo
               </h3>
               <div className="space-y-8">
                  {[
                    { label: 'Unidades Ativas', val: '14', status: 'excellent' },
                    { label: 'Lucratividade da Rede', val: '42%', status: 'excellent' },
                    { label: 'Custo de Aquisição (CAC)', val: 'R$ 840', status: 'good' },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-3">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{stat.label}</span>
                          <span className="text-sm font-black text-white">{stat.val}</span>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${stat.status === 'excellent' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: '85%' }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>

            <Card className="p-8 border-red-500/10 bg-red-500/5">
               <div className="flex items-center gap-4 mb-6">
                  <ShieldCheck className="text-red-400" />
                  <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest">Patrimônio Seguro</h4>
               </div>
               <p className="text-[10px] text-stone-500 font-bold uppercase leading-relaxed tracking-widest">Todas as transações do ecossistema são auditadas por IA, criando um livro-razão imutável para futuras rodadas de investimento.</p>
            </Card>
         </div>

         <div className="lg:col-span-8">
            {report ? (
              <Card className="p-12 border-amber-500/30 bg-black relative overflow-hidden animate-in slide-in-from-right duration-500 h-full">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark size={250}/></div>
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-amber-500 text-black rounded-2xl flex items-center justify-center shadow-xl">
                          <Sparkles size={28}/>
                       </div>
                       <div>
                          <h3 className="text-2xl font-black italic uppercase text-amber-50 tracking-tighter leading-none">Relatório Consolidado CEO</h3>
                          <p className="text-[9px] text-stone-600 font-black uppercase mt-1">Auditado por IARA Enterprise • {new Date().toLocaleDateString()}</p>
                       </div>
                    </div>
                    <button onClick={() => setReport(null)} className="p-3 bg-white/5 rounded-xl text-stone-500 hover:text-white transition-all"><History size={20}/></button>
                 </div>
                 
                 <div className="prose prose-invert max-w-none text-stone-300 italic text-[15px] leading-loose space-y-8">
                    {report.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                 </div>

                 <div className="mt-16 pt-12 border-t border-white/5 grid grid-cols-2 gap-6">
                    <Button variant="outline" className="h-16 rounded-2xl border-white/10 text-stone-500" icon={Landmark}>Certificar Ativos</Button>
                    <Button variant="primary" className="h-16 rounded-2xl shadow-xl shadow-indigo-600/20" icon={Diamond}>Abrir Rodada Mestre</Button>
                 </div>
              </Card>
            ) : (
              <Card className="p-20 text-center h-full flex flex-col items-center justify-center bg-[#1c1917] border-dashed border-2 border-stone-800">
                 <Landmark size={80} className="text-stone-800 mb-8" />
                 <h3 className="text-3xl font-black italic uppercase text-stone-700 tracking-tighter">Pronto para Consolidação</h3>
                 <p className="text-[10px] text-stone-800 font-black uppercase tracking-[0.4em] mt-4 leading-relaxed max-w-sm">A auditoria master processará todos os dados de rede para materializar o valuation real do seu império.</p>
                 <Button variant="magic" className="mt-12 h-20 px-16 rounded-[2.5rem] text-sm" onClick={generateAudit}>Iniciar Auditoria Consolidada</Button>
              </Card>
            )}
         </div>
      </div>
    </div>
  );
};
