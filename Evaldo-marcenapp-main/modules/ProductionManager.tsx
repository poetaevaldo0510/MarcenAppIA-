
import React, { useState } from 'react';
import { 
  CheckSquare, Clock, Hammer, Truck, CheckCircle2, 
  ChevronRight, Box, Settings, HardDrive, ListChecks, 
  Tag, Download, QrCode, Factory, Package, Wrench,
  AlertTriangle, ArrowUpRight, ClipboardList, Info
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { ProjectData } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  project: ProjectData;
  onNavigate: (m: any) => void;
}

export const ProductionManager: React.FC<Props> = ({ project, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'hardware'>('status');

  const hardware = {
    hinges: project.doors * 2,
    slides: project.drawers,
    handles: project.doors + project.drawers,
    screws: Math.ceil((project.width * project.height) * 35), // Margem de erro maior
    minifix: (project.doors + project.drawers) * 8 + 12
  };

  const steps = [
    { id: 'cutting', label: 'Corte Industrial', icon: Box, status: 'completed', date: 'Finalizado 09:00', team: 'Ricardo M.' },
    { id: 'edging', label: 'Fita de Borda', icon: Settings, status: 'current', date: 'Em andamento (75%)', team: 'Carlos T.' },
    { id: 'assembly', icon: Hammer, label: 'Pré-Montagem Loja', status: 'pending', date: 'Previsão: Amanhã', team: 'Carlos T.' },
    { id: 'installation', icon: Truck, label: 'Logística & Obra', status: 'pending', date: 'Previsão: Quinta', team: 'Equipe Alpha' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Workshop.<span className="text-amber-500">Operacional</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Controle de manufatura e suprimentos para alta produção.</p>
        </div>
        <div className="flex bg-[#1c1917] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
           <button onClick={() => setActiveTab('status')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'status' ? 'bg-amber-500 text-black shadow-lg shadow-amber-600/30' : 'text-stone-500 hover:text-white'}`}>Timeline OS</button>
           <button onClick={() => setActiveTab('hardware')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'hardware' ? 'bg-amber-500 text-black shadow-lg shadow-amber-600/30' : 'text-stone-500 hover:text-white'}`}>Ferragens</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           {activeTab === 'status' ? (
             <Card className="p-10 border-white/5 relative overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                   <h3 className="text-xl font-black italic uppercase text-amber-50 flex items-center gap-3">
                      <Factory className="text-amber-500" /> Fluxo de Fábrica
                   </h3>
                   <Badge variant="info">OS #00921-A</Badge>
                </div>
                
                <div className="space-y-10 relative">
                  <div className="absolute left-7 top-4 bottom-10 w-px bg-white/5"></div>
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex gap-10 items-start relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-2xl ${
                        step.status === 'completed' ? 'bg-emerald-500 text-black border-emerald-400' :
                        step.status === 'current' ? 'bg-amber-500 text-black border-amber-400 animate-pulse shadow-amber-500/20' :
                        'bg-[#292524] text-stone-600 border-white/5 opacity-50'
                      }`}>
                        <step.icon size={28} />
                      </div>
                      <div className="flex-1 pb-10 border-b border-white/5 last:border-none last:pb-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className={`font-black uppercase tracking-tighter text-lg ${step.status === 'pending' ? 'text-stone-700' : 'text-amber-50'}`}>{step.label}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{step.date}</p>
                               <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
                               <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest">{step.team}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                             {step.status === 'completed' && <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 size={16}/></div>}
                             {step.id === 'assembly' && (
                               <Button variant="ghost" className="h-10 px-4 text-[9px] border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black" onClick={() => onNavigate('assembly')}>Abrir Manual 3D</Button>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </Card>
           ) : (
             <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <Card className="p-10 border-white/5">
                   <div className="flex justify-between items-center mb-10">
                      <h3 className="text-xl font-black italic uppercase text-amber-50 flex items-center gap-3">
                         <HardDrive className="text-amber-500" /> Lista de Separação (Picking List)
                      </h3>
                      <button className="p-3 bg-white/5 rounded-xl text-stone-500 hover:text-amber-500"><Download size={18}/></button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { label: 'Dobradiças Amortecedor (Blum/FGV)', value: hardware.hinges, unit: 'Unid' },
                        { label: 'Corrediças Invisíveis 450mm', value: hardware.slides, unit: 'Pares' },
                        { label: 'Puxadores Gola Alumínio', value: hardware.handles, unit: 'Metros' },
                        { label: 'Parafusos 4.0 x 40mm Philips', value: hardware.screws, unit: 'Unid' },
                        { label: 'Minifix / Tambores', value: hardware.minifix, unit: 'Kits' },
                        { label: 'Cavilhas 8 x 30mm', value: hardware.minifix * 2, unit: 'Unid' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-amber-500/30 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-stone-600 uppercase mb-1">{item.label}</span>
                              <span className="text-xl font-black text-amber-50 italic">{item.value} <span className="text-xs text-stone-500 not-italic uppercase ml-1">{item.unit}</span></span>
                           </div>
                           <button className="w-10 h-10 rounded-xl border border-stone-800 flex items-center justify-center text-stone-700 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all"><CheckSquare size={18}/></button>
                        </div>
                      ))}
                   </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <Card className="p-8 border-indigo-500/10 bg-indigo-500/5">
                      <div className="flex items-center gap-4 mb-6">
                         <Info className="text-indigo-400" />
                         <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest">Upgrade de Ferragens</h4>
                      </div>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed mb-6">Mestre, este projeto comporta corrediças invisíveis com amortecimento. Sugerimos elevar o padrão.</p>
                      <Button variant="outline" className="w-full h-12 text-[9px] border-indigo-500/30 text-indigo-400">Ver Catálogo Blum</Button>
                   </Card>
                   <Card className="p-8 border-amber-500/10 bg-amber-500/5">
                      <div className="flex items-center gap-4 mb-6">
                         <AlertTriangle className="text-amber-500" />
                         <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest">Alerta de Ruptura</h4>
                      </div>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed mb-6">Estoque de parafusos 4x40 abaixo do mínimo. Reposição sugerida imediatamente.</p>
                      <Button variant="primary" className="w-full h-12 text-[9px]" onClick={() => onNavigate('marketplace')}>Comprar Insumos</Button>
                   </Card>
                </div>
             </div>
           )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="bg-black border-white/10 p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ClipboardList size={64}/></div>
              <h3 className="text-2xl font-black italic uppercase text-amber-50 mb-10 tracking-tighter">Ações Rápidas OS</h3>
              <div className="space-y-4">
                 <button className="w-full p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                       <div className="p-3 bg-amber-500 rounded-2xl text-black shadow-lg"><QrCode size={20}/></div>
                       <div className="text-left">
                          <p className="text-xs font-black text-amber-50 group-hover:text-amber-500 transition-colors uppercase">Etiquetas de Peças</p>
                          <p className="text-[8px] text-stone-600 font-bold uppercase mt-1 tracking-widest">24 itens pendentes</p>
                       </div>
                    </div>
                    <ArrowUpRight size={18} className="text-stone-700 group-hover:text-amber-500 transition-all" />
                 </button>

                 <button className="w-full p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                       <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Download size={20}/></div>
                       <div className="text-left">
                          <p className="text-xs font-black text-amber-50 group-hover:text-indigo-400 transition-colors uppercase">Arquivos p/ CNC</p>
                          <p className="text-[8px] text-stone-600 font-bold uppercase mt-1 tracking-widest">Exportar .DXF / .CSV</p>
                       </div>
                    </div>
                    <ArrowUpRight size={18} className="text-stone-700 group-hover:text-indigo-400 transition-all" />
                 </button>

                 <button onClick={() => onNavigate('assembly')} className="w-full p-6 bg-amber-500 text-black rounded-3xl hover:scale-[1.02] transition-all flex items-center justify-between group shadow-xl shadow-amber-600/20">
                    <div className="flex items-center gap-5">
                       <div className="p-3 bg-black/10 rounded-2xl text-black"><Hammer size={20}/></div>
                       <div className="text-left">
                          <p className="text-xs font-black uppercase tracking-tighter">Guia de Montagem</p>
                          <p className="text-[8px] font-bold uppercase mt-1 tracking-widest opacity-60">Passo-a-passo Interativo</p>
                       </div>
                    </div>
                    <ChevronRight size={20} strokeWidth={3} />
                 </button>
              </div>

              <div className="mt-12 pt-10 border-t border-white/5">
                 <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Status da Carga</p>
                    <Badge variant="neutral">Pronto p/ Expedição</Badge>
                 </div>
                 <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-amber-500"><Truck size={24}/></div>
                    <div className="text-left">
                       <p className="text-xs font-black text-amber-50 uppercase">Previsão Entrega</p>
                       <p className="text-[9px] text-stone-500 font-bold uppercase mt-1">Qui, 24 de Maio • 14:00h</p>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
