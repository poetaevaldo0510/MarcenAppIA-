
import React, { useState } from 'react';
import { 
  Users, Search, MessageCircle, MapPin, Phone, 
  MoreVertical, ArrowRight, UserPlus, Filter, Calendar
} from 'lucide-react';
import { Card, Button, Badge, InputGroup } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';

export const CRMManager: React.FC = () => {
  const { projects, leads } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');

  const openWhatsApp = (phone: string, name: string) => {
    const msg = `Olá ${name.split(' ')[0]}, aqui é o Mestre. Já processei seu projeto no sistema. Como podemos prosseguir?`;
    window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Minha.<span className="text-indigo-500">Agenda</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão de contatos e obras ativas.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="magic" icon={UserPlus} className="h-14 rounded-2xl px-8">Novo Cliente</Button>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-indigo-400 transition-colors" size={20}/>
        <input 
          type="text" 
          placeholder="Buscar cliente ou obra..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1c1917] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all shadow-xl"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.length === 0 ? (
          <div className="py-20 text-center opacity-20 border-2 border-dashed border-stone-800 rounded-[2.5rem]">
             <Users size={64} className="mx-auto mb-6" />
             <p className="text-sm font-black uppercase tracking-[0.4em]">Sua agenda está vazia</p>
          </div>
        ) : projects.map(p => (
          <Card key={p.id} className="group hover:bg-[#292524] transition-all relative overflow-hidden border-white/5 hover:border-indigo-500/30">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl border border-white/5 group-hover:border-indigo-500/30 transition-all">
                      {p.clientName.charAt(0)}
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                         <h3 className="text-lg font-black text-white uppercase italic">{p.clientName}</h3>
                         <Badge variant="info">Ativo</Badge>
                      </div>
                      <div className="flex flex-col gap-1.5">
                         <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Phone size={12} className="text-indigo-500" /> {p.clientPhone || 'Sem telefone'}
                         </p>
                         <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={12} /> {p.clientAddress || 'Endereço não informado'}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                      onClick={() => openWhatsApp(p.clientPhone, p.clientName)}
                      disabled={!p.clientPhone}
                      className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/20 disabled:opacity-20"
                   >
                      <MessageCircle size={22} fill="currentColor" />
                   </button>
                   <button 
                      className="p-4 bg-white/5 text-stone-400 rounded-2xl hover:text-white transition-all border border-white/5"
                   >
                      <MoreVertical size={22} />
                   </button>
                   <button className="flex items-center gap-2 px-6 py-4 bg-white/5 text-stone-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-white/5 group-hover:border-indigo-600">
                      <span className="text-[10px] font-black uppercase tracking-widest">Abrir Obra</span>
                      <ArrowRight size={16} />
                   </button>
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
