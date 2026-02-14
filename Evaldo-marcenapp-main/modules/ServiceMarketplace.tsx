
import React, { useState } from 'react';
import { 
  Users, Wrench, Truck, Ruler, Star, CheckCircle2, 
  MapPin, ShieldCheck, ChevronRight, MessageSquare,
  Clock, Zap, Filter, Search, Award, Calendar, Phone
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';

export const ServiceMarketplace: React.FC = () => {
  const { bookService, projects, activeProjectId } = useProjectStore();
  const [filter, setFilter] = useState<'all' | 'montador' | 'medidor' | 'frete'>('all');

  const providers = [
    { id: '1', name: 'Equipe Silva Montagem', role: 'montador', rating: 4.9, jobs: 124, pricePerM2: 120, location: 'São Paulo - SP', skills: ['Cozinhas', 'Alto Padrão', 'Ferragens Blum'] },
    { id: '2', name: 'Ricardo Medições Técnicas', role: 'medidor', rating: 5.0, jobs: 342, pricePerM2: 45, location: 'ABC Paulista', skills: ['Laser', 'AutoCAD', 'Conferência Obra'] },
    { id: '3', name: 'Logística Mestre Fretes', role: 'frete', rating: 4.8, jobs: 89, pricePerM2: 80, location: 'Grande SP', skills: ['Cuidado Extra', 'Ajudante Incluso'] },
  ];

  const filtered = filter === 'all' ? providers : providers.filter(p => p.role === filter);

  const handleHire = (p: any) => {
    const confirmHire = confirm(`Deseja contratar ${p.name} para o projeto atual por ${formatCurrency(p.pricePerM2)}? o valor será debitado do seu saldo Workshop.Pay na conclusão.`);
    if (confirmHire && activeProjectId) {
      bookService({
        type: p.role,
        providerName: p.name,
        status: 'pending',
        value: p.pricePerM2,
        projectId: activeProjectId
      });
      alert("Solicitação enviada! O profissional entrará em contato via chat.");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Freelancer.<span className="text-amber-500">Hub</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Sua rede de elite para montagem, frete e medição técnica.</p>
        </div>
        <div className="flex bg-[#1c1917] p-1.5 rounded-2xl border border-white/5">
           {[
             { id: 'all', label: 'Todos', icon: Users },
             { id: 'montador', label: 'Montagem', icon: Wrench },
             { id: 'medidor', label: 'Medição', icon: Ruler },
             { id: 'frete', label: 'Logística', icon: Truck },
           ].map(t => (
             <button 
               key={t.id}
               onClick={() => setFilter(t.id as any)}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === t.id ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500 hover:text-white'}`}
             >
               <t.icon size={12}/> {t.label}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
           {filtered.map(p => (
             <Card key={p.id} className="group hover:bg-[#292524] transition-all relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-amber-500 border border-white/10 group-hover:border-amber-500/30">
                         {p.role === 'montador' ? <Wrench size={32}/> : p.role === 'medidor' ? <Ruler size={32}/> : <Truck size={32}/>}
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-black text-amber-50 uppercase">{p.name}</h3>
                            <div className="flex items-center gap-1 text-amber-500">
                               <Star size={14} fill="currentColor"/>
                               <span className="text-sm font-black italic">{p.rating}</span>
                            </div>
                         </div>
                         <div className="flex flex-wrap gap-2 mb-3">
                            {p.skills.map(s => <span key={s} className="text-[8px] font-black uppercase text-stone-500 bg-white/5 px-2 py-1 rounded-md">{s}</span>)}
                         </div>
                         <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> {p.location} • {p.jobs} Projetos Concluídos</p>
                      </div>
                   </div>
                   <div className="text-right flex flex-col md:items-end justify-between gap-4">
                      <div>
                         <p className="text-[9px] text-stone-600 font-black uppercase mb-1">Valor p/ Produção</p>
                         <p className="text-2xl font-black text-amber-50 italic">{formatCurrency(p.pricePerM2)} <span className="text-[10px] not-italic text-stone-500 uppercase">/m²</span></p>
                      </div>
                      <Button variant="magic" className="h-12 rounded-xl text-[10px]" icon={Zap} onClick={() => handleHire(p)}>Solicitar Reserva</Button>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <ShieldCheck className="mb-8 opacity-50" size={32}/>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 leading-tight">Garantia Workshop</h3>
              <p className="text-sm font-medium leading-relaxed opacity-80 mb-10">O pagamento do freelancer só é liberado após sua aprovação final. Segurança total para o Mestre Marceneiro.</p>
              <div className="space-y-4">
                 {[
                   { label: 'Seguro de Carga Incluso', icon: CheckCircle2 },
                   { label: 'Profissionais Homologados', icon: CheckCircle2 },
                   { label: 'Suporte à Mediação Técnica', icon: CheckCircle2 },
                 ].map((s, i) => (
                   <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase">
                      <s.icon size={14} className="text-emerald-300"/> {s.label}
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="p-8 border-amber-500/10 bg-amber-500/5">
              <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-8 flex items-center gap-3"><Award className="text-amber-500" /> Seja um Pro Partner</h4>
              <p className="text-[10px] text-stone-500 font-bold leading-relaxed uppercase tracking-widest mb-8">Você é um montador de elite? Cadastre seu perfil e receba ordens de serviço das maiores marcenarias da região.</p>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10">Cadastrar meu Perfil</Button>
           </Card>
        </div>
      </div>
    </div>
  );
};
