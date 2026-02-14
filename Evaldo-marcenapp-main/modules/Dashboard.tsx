
import React from 'react';
import { 
  Users, Box, Settings, UserPlus, Zap, 
  LayoutDashboard, Ruler, ShoppingCart, 
  ChevronRight, Sparkles, CreditCard, Truck, Hammer,
  Landmark, Diamond, TrendingUp, Building2, Store, PlusCircle, FolderOpen, Scissors
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { ModuleType } from '../types';

interface Props {
  /* Updated onNavigate to use ModuleType instead of string to fix App.tsx dispatch error */
  onNavigate: (module: ModuleType) => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigate }) => {
  const { workshopSize, userEmail, projects, isAdmin } = useProjectStore();

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-24 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
         <div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Oficina.<span className="text-indigo-500">Mestre</span></h1>
            <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-2">ID Mestre: {userEmail} • Sincronização Ativa</p>
         </div>
         <div className="flex gap-3">
            <Button variant="outline" className="h-10 text-[9px] border-white/5" icon={FolderOpen} onClick={() => onNavigate('crm')}>Pasta de Clientes</Button>
            <Badge variant={isAdmin ? "info" : "warning"}>{isAdmin ? "SISTEMA OPERACIONAL GLOBAL" : "MODO OFICINA"}</Badge>
         </div>
      </header>

      {/* Botão Principal YARA */}
      <button 
        onClick={() => onNavigate('studio')}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-14 rounded-[4rem] shadow-[0_30px_90px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex flex-col items-center gap-6 border-b-[12px] border-indigo-900 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-white/10">
           <Zap size={64} fill="white" className="animate-pulse" />
        </div>
        <div className="text-center relative z-10">
           <h2 className="text-4xl font-black uppercase italic tracking-tighter">Laboratório YARA</h2>
           <p className="text-indigo-200 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 opacity-80 italic">Clique para Projetar ou Enviar Rascunho</p>
        </div>
      </button>

      {/* Grid de Ferramentas Industriais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { id: 'crm', label: 'Clientes', icon: Users, color: 'text-amber-500', desc: 'Contratos e Obras' },
           { id: 'budget', label: 'Orçamentos', icon: CreditCard, color: 'text-emerald-500', desc: 'Custo Real IA' },
           { id: 'cutting', label: 'Plano de Corte', icon: Scissors, color: 'text-indigo-400', desc: 'Nesting e CNC' },
           { id: 'production', label: 'Produção', icon: Factory, color: 'text-pink-500', desc: 'Status da Fábrica' },
         ].map(tool => (
            <Card key={tool.id} className="p-8 bg-[#141210] border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col items-center text-center" onClick={() => onNavigate(tool.id as ModuleType)}>
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <tool.icon className={tool.color} size={32}/>
               </div>
               <h3 className="text-lg font-black text-white uppercase italic">{tool.label}</h3>
               <p className="text-[9px] text-stone-600 font-bold uppercase mt-2 tracking-widest leading-relaxed">{tool.desc}</p>
            </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
         <Card className="p-10 border-white/5 bg-indigo-500/5 relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('marketplace')}>
            <div className="absolute -right-4 -top-4 p-6 opacity-5 group-hover:scale-110 transition-transform"><Store size={100}/></div>
            <h3 className="text-2xl font-black italic uppercase text-white mb-3 tracking-tighter">Marketplace Industrial</h3>
            <p className="text-xs font-bold text-stone-500 uppercase leading-relaxed mb-8 max-w-sm">Adquira novos módulos, ferramentas digitais e tokens de materialização.</p>
            <Button variant="primary" className="h-12 text-[10px] rounded-2xl px-10 shadow-indigo-600/20" icon={PlusCircle}>Comprar Ferramentas</Button>
         </Card>

         <Card className="p-10 border-white/5 bg-amber-500/5 relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('services')}>
            <div className="absolute -right-4 -top-4 p-6 opacity-5 group-hover:scale-110 transition-transform"><Users size={100}/></div>
            <h3 className="text-2xl font-black italic uppercase text-white mb-3 tracking-tighter">Rede de Freelancers</h3>
            <p className="text-xs font-bold text-stone-500 uppercase leading-relaxed mb-8 max-w-sm">Contrate montadores, fretes e medidores de elite homologados pela MarcenaPP.</p>
            <Button variant="magic" className="h-12 text-[10px] rounded-2xl px-10 shadow-amber-600/20" icon={Users}>Ver Profissionais</Button>
         </Card>
      </div>

      <Card className="p-10 border-white/5 bg-black/40 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl"><TrendingUp size={32}/></div>
            <div>
               <h4 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">Visão de Holding</h4>
               <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest mt-3">Seu ecossistema valorizou +12% esta semana</p>
            </div>
         </div>
         <div className="flex gap-4">
            <Button variant="outline" className="h-14 border-white/10 text-stone-500 px-8" onClick={() => onNavigate('bi')}>Performance BI</Button>
            <Button variant="dark" className="h-14 bg-white/5 border-none px-8" onClick={() => onNavigate('valuation')}>Ver Valuation</Button>
         </div>
      </Card>
    </div>
  );
};

const Factory = ({size, className}: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 20V9l4-2 4 2 4-2 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
  </svg>
);
