
import React from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight, History, Plus, DollarSign, Target, ReceiptText } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';

interface Props {
  onNavigate?: (m: any) => void;
}

export const WalletManager: React.FC<Props> = ({ onNavigate }) => {
  const { transactions, leads } = useProjectStore();

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Carteira.<span className="text-amber-500">OS</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Seu fluxo de caixa industrial em tempo real.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={ReceiptText} className="h-14 rounded-2xl border-white/10" onClick={() => onNavigate?.('fiscal')}>Gestão Fiscal</Button>
          <Button variant="magic" icon={DollarSign} className="h-14 rounded-2xl">Lançar Ganho</Button>
        </div>
      </header>

      {/* Cartão de Saldo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#1c1917] to-[#0c0a09] border-white/10 p-10 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] group-hover:bg-amber-500/10 transition-all duration-700"></div>
          
          <div className="relative z-10">
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Saldo Disponível em Conta</p>
            <h2 className="text-6xl font-black text-amber-50 tracking-tighter italic">{formatCurrency(balance)}</h2>
            
            <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-white/5">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Entradas</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurrency(income)}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                  <ArrowDownRight size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Saídas</p>
                  <p className="text-xl font-black text-red-500">{formatCurrency(expense)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-amber-500 p-10 flex flex-col justify-between text-black shadow-2xl shadow-amber-600/20">
          <div>
            <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Meta Semanal<br/>Marcenaria</h3>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Progresso 85%</span>
              <span className="font-black">R$ 15.000</span>
            </div>
            <div className="h-4 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full bg-black w-[85%] rounded-full"></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Histórico de Transações */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-amber-50 flex items-center gap-3">
              <History className="text-amber-500" /> Extrato Recente
            </h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-amber-500">Ver Tudo</button>
          </div>
          
          <div className="space-y-6">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                    t.type === 'income' 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' 
                      : 'bg-red-500/5 border-red-500/10 text-red-500'
                  }`}>
                    {t.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-50 group-hover:text-amber-500 transition-colors">{t.description}</h4>
                    <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest mt-1">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Funil de Vendas (Leads) */}
        <Card className="p-8 border-amber-500/10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-amber-50 flex items-center gap-3">
              <TrendingUp className="text-amber-500" /> Funil de Obras
            </h3>
            <Badge variant="warning">{leads.length} Ativos</Badge>
          </div>
          
          {leads.length === 0 ? (
            <div className="py-12 text-center opacity-20">
              <CreditCard size={48} className="mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum lead em negociação</p>
            </div>
          ) : (
            <div className="space-y-6">
              {leads.map(lead => (
                <div key={lead.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-amber-50">{lead.name}</h4>
                    <p className="text-[10px] text-stone-500 font-bold mt-1 uppercase tracking-widest">Potencial: {formatCurrency(lead.estimatedValue)}</p>
                  </div>
                  <Badge variant={lead.status === 'closed' ? 'success' : 'info'}>{lead.status}</Badge>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-10 h-14 rounded-2xl border-white/10 text-stone-500" onClick={() => {}}>Gerenciar Todos os Clientes</Button>
        </Card>
      </div>
    </div>
  );
};
