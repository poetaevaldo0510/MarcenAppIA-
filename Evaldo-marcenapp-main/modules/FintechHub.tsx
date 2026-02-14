import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, ShieldCheck, History, ReceiptText, TrendingUp, HandCoins, Settings } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';

export const FintechHub: React.FC = () => {
  const { bankBalance, creditLimit, transactions } = useProjectStore();

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="success">Banco Industrial Habilitado</Badge>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50 mt-4">Marcenaria.<span className="text-amber-500">Pay</span></h1>
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Sua conta exclusiva para produção de móveis.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#1c1917] to-black border-amber-500/10 p-10 relative overflow-hidden">
           <p className="text-stone-500 text-[9px] font-black uppercase tracking-[0.4em] mb-3">Saldo p/ Saque</p>
           <h2 className="text-5xl font-black text-amber-50 tracking-tighter italic">{formatCurrency(bankBalance)}</h2>
           
           <div className="grid grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/5">
              <div>
                 <p className="text-[8px] text-stone-600 font-black uppercase tracking-widest">Crédito Insumos</p>
                 <p className="text-2xl font-black text-amber-50">{formatCurrency(creditLimit)}</p>
              </div>
              <div className="flex items-center">
                 <Button variant="outline" className="h-10 text-[8px] px-6 rounded-lg border-amber-500/20 text-amber-500">Liberar Capital</Button>
              </div>
           </div>
        </Card>

        <Card className="bg-indigo-600 p-8 text-white border-none flex flex-col justify-between">
           <HandCoins className="opacity-20 mb-6" size={48}/>
           <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Split de Lucro</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">Receba o lucro da sua obra na aprovação do projeto pelo cliente.</p>
           </div>
           <Button variant="dark" className="w-full mt-8 h-12 text-[9px] bg-black/30 border-none">Configurar</Button>
        </Card>
      </div>

      <Card className="p-0 border-white/5 overflow-hidden">
         <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h3 className="text-lg font-black italic uppercase text-amber-50 flex items-center gap-3"><History className="text-amber-500"/> Transações</h3>
            <button className="text-[9px] font-black uppercase text-stone-500">Ver Extrato PDF</button>
         </div>
         <div className="p-6 space-y-4">
            {transactions.length === 0 ? (
              <div className="py-12 text-center opacity-20">
                 <p className="text-xs font-black uppercase tracking-widest italic">Nenhuma movimentação industrial</p>
              </div>
            ) : transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-4">
                    <div className={t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}><TrendingUp size={18}/></div>
                    <div>
                       <p className="text-sm font-black text-amber-50">{t.description}</p>
                       <p className="text-[9px] text-stone-600 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                 </span>
              </div>
            ))}
         </div>
      </Card>
    </div>
  );
};