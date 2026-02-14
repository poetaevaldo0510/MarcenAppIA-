
import React, { useState } from 'react';
import { 
  Truck, Package, ShoppingCart, Search, Filter, 
  MapPin, Phone, Globe, Star, Zap, HardDrive,
  Download, Plus, RefreshCw, CheckCircle2, ChevronRight,
  Store, Building2, Layers, BarChart3, Scissors
} from 'lucide-react';
import { Card, Button, Badge, Modal, InputGroup } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';

export const DistributorPortal: React.FC = () => {
  const { distributorLinked, linkDistributor, cart } = useProjectStore();
  const [activePartner, setActivePartner] = useState<string | null>(null);

  const partners = [
    { id: 'leo', name: 'Leo Madeiras', logo: 'LM', rating: 4.9, location: 'Brasil Inteiro', tags: ['MDF', 'Ferragens', 'Serviços'], stock: 'Online' },
    { id: 'gasômetro', name: 'Gasômetro Madeiras', logo: 'GM', rating: 4.8, location: 'SP/Sul', tags: ['MDF', 'Máquinas'], stock: 'Sync Ativo' },
    { id: 'duratex', name: 'Duratex Center', logo: 'DX', rating: 5.0, location: 'Direto Fábrica', tags: ['Premium MDF'], stock: 'Prioritário' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Supply.<span className="text-amber-500">Connect</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Conexão em tempo real com as maiores revendas e indústrias.</p>
        </div>
        {!distributorLinked ? (
          <Button variant="magic" icon={RefreshCw} onClick={linkDistributor} className="h-16 px-10 rounded-2xl">Vincular Token de Revenda</Button>
        ) : (
          <div className="flex bg-[#1c1917] p-4 rounded-2xl border border-emerald-500/20 gap-4 items-center">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_emerald]"></div>
             <span className="text-[10px] font-black uppercase text-amber-50 tracking-widest italic">API Industrial: Ativa</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           {/* Partners Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partners.map(p => (
                <Card key={p.id} className="group hover:bg-[#292524] transition-all relative overflow-hidden cursor-pointer" onClick={() => setActivePartner(p.id)}>
                   <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><Store size={100}/></div>
                   <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 font-black text-2xl border border-white/10 group-hover:border-amber-500/30 transition-all">
                        {p.logo}
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-1 text-amber-500 justify-end mb-1">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-black">{p.rating}</span>
                         </div>
                         <Badge variant="success">{p.stock}</Badge>
                      </div>
                   </div>
                   <h3 className="text-2xl font-black text-amber-50 mb-2 uppercase tracking-tighter">{p.name}</h3>
                   <div className="flex flex-wrap gap-2 mb-8">
                      {p.tags.map(t => <span key={t} className="text-[8px] font-black uppercase text-stone-500 bg-white/5 px-2 py-1 rounded-md">{t}</span>)}
                   </div>
                   <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> {p.location}</span>
                      <ChevronRight className="text-stone-800 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={20} />
                   </div>
                </Card>
              ))}
           </div>

           {/* Purchase Flow */}
           {cart.length > 0 && (
             <Card className="p-10 bg-black border-amber-500/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-xl font-black italic uppercase text-amber-50 flex items-center gap-4">
                      <ShoppingCart className="text-amber-500" /> Exportar p/ Revenda Ativa
                   </h3>
                   <Badge variant="info">{cart.length} Itens em Fila</Badge>
                </div>
                <div className="space-y-6 mb-12">
                   {cart.map(item => (
                     <div key={item.product.id} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-5">
                           <div className="p-3 bg-white/5 rounded-xl"><Package size={18}/></div>
                           <div>
                              <p className="text-sm font-black text-amber-50 uppercase tracking-tighter">{item.product.name}</p>
                              <p className="text-[10px] text-stone-600 font-bold uppercase mt-1">{item.quantity} {item.product.unit} • Valor Unit: {formatCurrency(item.product.price)}</p>
                           </div>
                        </div>
                        <span className="text-sm font-black text-amber-50">{formatCurrency(item.product.price * item.quantity)}</span>
                     </div>
                   ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Button variant="outline" className="h-16 rounded-2xl border-white/10 text-stone-500" icon={Download}>Exportar XML p/ Corte Cloud</Button>
                   <Button variant="magic" className="h-16 rounded-2xl" icon={Zap}>Finalizar Compra Direct-Factory</Button>
                </div>
             </Card>
           )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <Building2 className="mb-8 opacity-50" size={32}/>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Parceria Mestre</h3>
              <p className="text-sm font-medium leading-relaxed opacity-80 mb-10">Comprando via Workshop.OS você acumula **Cashback Industrial** para trocar por softwares de render ou ferramentas.</p>
              <div className="bg-black/40 p-5 rounded-2xl mb-10">
                 <p className="text-[10px] font-black uppercase opacity-60 mb-2">Pontos Acumulados</p>
                 <p className="text-2xl font-black italic">12.450 <span className="text-xs opacity-50">W.POINTS</span></p>
              </div>
              <Button variant="dark" className="w-full bg-black/40 border-none text-white font-black h-14 rounded-xl" icon={Globe}>Ver Catálogo Prêmios</Button>
           </Card>

           <Card className="p-10 border-white/5">
              <h3 className="text-lg font-black italic uppercase text-amber-50 mb-8 flex items-center gap-3"><Layers className="text-amber-500" /> Serviços de Fábrica</h3>
              <div className="space-y-4">
                 {[
                   { label: 'Plano de Corte Cloud', icon: Scissors, status: 'Ativo' },
                   { label: 'Usinagem CNC Remota', icon: HardDrive, status: 'Premium' },
                   { label: 'Furação p/ Minifix', icon: RefreshCw, status: 'Beta' },
                 ].map((s, i) => (
                   <button key={i} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                         <s.icon className="text-stone-500 group-hover:text-amber-500" size={18}/>
                         <span className="text-[10px] font-black uppercase text-stone-500 group-hover:text-white">{s.label}</span>
                      </div>
                      <Badge variant="neutral">{s.status}</Badge>
                   </button>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
