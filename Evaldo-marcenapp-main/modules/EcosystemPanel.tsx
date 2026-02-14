
import React from 'react';
import { 
  Building2, Users, TrendingUp, ShieldCheck, Zap, Store, Palette, Factory, 
  ArrowUpRight, LayoutDashboard, Target, Landmark, Smartphone, Box, 
  MessageSquare, FileText, ShoppingCart, Truck, CheckCircle2, PieChart,
  Activity, Gavel, CreditCard, Scissors, Package, FileCheck, Share2, BarChart
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { ModuleType } from '../types';

export const EcosystemPanel: React.FC<any> = ({ onNavigate }: { onNavigate: (m: ModuleType) => void }) => {
  const phases = [
    { 
      title: "Vendas & Design", 
      color: "text-blue-400", 
      icon: Palette,
      items: [
        { label: "Captação de Leads", id: "crm" },
        { label: "Briefing IARA Vision", id: "studio" },
        { label: "Projeto 3D YARA", id: "studio" },
        { label: "Render 4K Cinematic", id: "showroom" },
        { label: "Aprovação Cliente", id: "checkout" },
        { label: "Orçamento Real", id: "budget" }
      ] 
    },
    { 
      title: "Engenharia & Produção", 
      color: "text-amber-400", 
      icon: Factory,
      items: [
        { label: "Contrato Blindado", id: "legal" },
        { label: "MarcenaPay / Split", id: "fintech" },
        { label: "Blueprint Executivo", id: "blueprint" },
        { label: "Nesting Industrial", id: "cutting" },
        { label: "Compra de Insumos", id: "suppliers" },
        { label: "Usinagem CNC", id: "production" }
      ] 
    },
    { 
      title: "Logística & Entrega", 
      color: "text-emerald-400", 
      icon: Truck,
      items: [
        { label: "Acabamento & Borda", id: "production" },
        { label: "Pré-montagem Fábrica", id: "production" },
        { label: "Logística / Frete", id: "services" },
        { label: "Montagem Assistida", id: "assembly" },
        { label: "Termo de Entrega", id: "crm" },
        { label: "Emissão NF-e", id: "fiscal" }
      ] 
    },
    { 
      title: "Escala & Equity", 
      color: "text-indigo-400", 
      icon: TrendingUp,
      items: [
        { label: "Marketing de Portfólio", id: "marketing" },
        { label: "Business Intelligence", id: "bi" },
        { label: "Valuation Holding", id: "valuation" },
        { label: "Expansão Ecossistema", id: "settings" }
      ] 
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto p-6 md:p-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <Badge variant="info">Ecosystem Governance</Badge>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Master Session: Evaldo</span>
             </div>
          </div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white leading-none">Marcena<span className="text-indigo-400">PP</span>.Global</h1>
          <p className="text-stone-500 text-sm font-bold uppercase tracking-[0.4em] mt-4">As 20 Fases da Jornada de Alta Performance MarcenaPP</p>
        </div>
        <div className="flex gap-4">
           <Button variant="magic" icon={Landmark} onClick={() => onNavigate('valuation')} className="h-16 px-10 rounded-2xl shadow-amber-600/20">Holding Valuation</Button>
           <Button variant="primary" icon={LayoutDashboard} onClick={() => onNavigate('dashboard')} className="h-16 px-10 rounded-2xl">Oficina</Button>
        </div>
      </header>

      {/* Grid de 20 Fases Interativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {phases.map((group, idx) => (
           <Card key={idx} className="p-8 border-white/5 bg-[#141210] relative overflow-hidden flex flex-col group h-full">
              <div className="mb-8">
                 <h3 className={`text-xl font-black italic uppercase tracking-tighter mb-2 ${group.color}`}>{group.title}</h3>
                 <div className="h-1 w-12 bg-white/10 rounded-full"></div>
              </div>
              <div className="space-y-3 flex-1">
                 {group.items.map((item, i) => (
                   <button 
                      key={i} 
                      onClick={() => onNavigate(item.id as ModuleType)}
                      className="w-full flex items-center gap-3 group/item cursor-pointer text-left hover:bg-white/5 p-2 rounded-xl transition-all"
                   >
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-800 group-hover/item:bg-indigo-500 transition-colors"></div>
                      <span className="text-[11px] font-bold text-stone-500 group-hover/item:text-white uppercase tracking-widest transition-colors">{item.label}</span>
                   </button>
                 ))}
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <group.icon size={150}/>
              </div>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <Card className="p-10 border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
            <h3 className="text-2xl font-black italic uppercase text-white mb-4 tracking-tighter">Lojas de Planejados</h3>
            <p className="text-xs text-stone-400 mb-8 leading-relaxed">Gestão de PDV e fechamento de contratos de alto padrão com suporte da YARA.</p>
            <Button variant="dark" className="w-full h-14 bg-blue-500/10 border-blue-500/20 text-blue-400" icon={Store} onClick={() => onNavigate('crm')}>Ver Lojas Ativas</Button>
         </Card>

         <Card className="p-10 border-pink-500/20 bg-pink-500/5 relative overflow-hidden group">
            <h3 className="text-2xl font-black italic uppercase text-white mb-4 tracking-tighter">Projetistas & Arquitetos</h3>
            <p className="text-xs text-stone-400 mb-8 leading-relaxed">Rede colaborativa para especificação técnica e materialização 4K.</p>
            <Button variant="dark" className="w-full h-14 bg-pink-500/10 border-pink-500/20 text-pink-400" icon={Palette} onClick={() => onNavigate('studio')}>Mural de Design</Button>
         </Card>

         <Card className="p-10 border-amber-500/20 bg-amber-500/5 relative overflow-hidden group">
            <h3 className="text-2xl font-black italic uppercase text-white mb-4 tracking-tighter">Indústria & Fábricas</h3>
            <p className="text-xs text-stone-400 mb-8 leading-relaxed">Nesting, plano de corte e produção em escala. O motor de entrega MarcenaPP.</p>
            <Button variant="dark" className="w-full h-14 bg-amber-500/10 border-amber-500/20 text-amber-400" icon={Factory} onClick={() => onNavigate('production')}>Status Produção</Button>
         </Card>
      </div>

      <Card className="p-12 border-indigo-500/30 bg-black relative overflow-hidden ring-1 ring-white/10 shadow-3xl">
         <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-3xl shadow-indigo-600/30">
               <ShieldCheck size={48}/>
            </div>
            <div className="flex-1">
               <h3 className="text-3xl font-black italic uppercase text-white leading-none">Garantia Global MarcenaPP</h3>
               <p className="text-sm text-stone-500 font-medium italic mt-4 leading-relaxed max-w-2xl">
                 "O ecossistema garante a entrega de cada projeto, assegurando ao cliente final o padrão Mestre, independente de qual braço produtivo execute a obra."
               </p>
            </div>
            {/* Added className to Badge to fix module error */}
            <Badge variant="success" className="h-12 px-8 flex items-center">Fundo Seguro: R$ 4.2M</Badge>
         </div>
      </Card>
    </div>
  );
};
