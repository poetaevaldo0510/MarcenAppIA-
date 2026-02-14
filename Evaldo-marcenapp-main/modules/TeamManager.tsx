
import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, UserCheck, HardHat, 
  Search, MoreVertical, MessageCircle, Mail, Phone,
  ChevronRight, LayoutGrid, List, Activity, Settings,
  ClipboardList, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Plus
} from 'lucide-react';
import { Card, Button, Badge, Modal, InputGroup } from '../components/UI';
import { TeamMember } from '../types';

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline: string;
}

export const TeamManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'tasks'>('members');

  const team: TeamMember[] = [
    { id: '1', name: 'Ricardo Mestre', role: 'mestre', status: 'online', tasksCompleted: 142, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
    { id: '2', name: 'Ana Design', role: 'projetista', status: 'online', tasksCompleted: 89, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' },
    { id: '3', name: 'Carlos Montagem', role: 'montador', status: 'in_field', tasksCompleted: 215, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', activeTaskId: 'T-902' },
    { id: '4', name: 'Juliana Vendas', role: 'vendedor', status: 'offline', tasksCompleted: 54, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
  ];

  const tasks: Task[] = [
    { id: 'T-901', title: 'Corte MDF Cozinha J. Silva', assignedTo: 'Ricardo Mestre', status: 'in_progress', priority: 'high', deadline: 'Hoje' },
    { id: 'T-902', title: 'Montagem Closet G. Master', assignedTo: 'Carlos Montagem', status: 'in_progress', priority: 'high', deadline: 'Amanhã' },
    { id: 'T-903', title: 'Render 3D Painel TV', assignedTo: 'Ana Design', status: 'pending', priority: 'medium', deadline: '24/05' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Equipe.<span className="text-amber-500">Workshop</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Colaboração industrial e gestão de produtividade.</p>
        </div>
        
        <div className="flex bg-[#1c1917] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
          <button 
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-amber-500 text-black shadow-lg shadow-amber-600/30' : 'text-stone-500 hover:text-white'}`}
          >
            <Users size={14}/> Profissionais
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-amber-500 text-black shadow-lg shadow-amber-600/30' : 'text-stone-500 hover:text-white'}`}
          >
            <ClipboardList size={14}/> Linha de Produção
          </button>
        </div>
      </header>

      {activeTab === 'members' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-600" size={18}/>
                <input type="text" placeholder="Buscar profissional..." className="w-full bg-[#1c1917] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-amber-500/50 transition-all"/>
              </div>
              <Button variant="magic" icon={UserPlus} onClick={() => setShowInviteModal(true)}>Convidar</Button>
            </div>

            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
              {team.map(member => (
                <Card key={member.id} className="group hover:bg-[#292524] transition-all cursor-pointer relative overflow-hidden">
                  <div className="flex items-center gap-6 mb-8">
                     <div className="relative">
                        <img src={member.avatar} className="w-20 h-20 rounded-3xl object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#1c1917] ${member.status === 'online' ? 'bg-emerald-500' : member.status === 'in_field' ? 'bg-indigo-500' : 'bg-stone-700'}`}></div>
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-amber-50 italic uppercase tracking-tighter">{member.name}</h3>
                        <Badge variant={member.role === 'mestre' ? 'warning' : 'neutral'}>{member.role.toUpperCase()}</Badge>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                     <div className="bg-black/20 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Aproveitamento</p>
                        <p className="text-lg font-black text-amber-50">98%</p>
                     </div>
                     <div className="bg-black/20 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Total Projetos</p>
                        <p className="text-lg font-black text-amber-50">{member.tasksCompleted}</p>
                     </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                     <button className="flex-1 h-12 bg-white/5 rounded-xl text-stone-400 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2"><MessageCircle size={16}/><span className="text-[9px] font-black uppercase">Chat</span></button>
                     <button className="h-12 w-12 bg-white/5 rounded-xl text-stone-400 hover:text-white transition-all flex items-center justify-center"><Settings size={16}/></button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <Card className="bg-gradient-to-br from-indigo-600 to-indigo-900 border-none text-white p-10 overflow-hidden relative">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <TrendingUp size={32} className="mb-8 opacity-50"/>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Métrica de Oficina</h3>
                <p className="text-sm font-medium leading-relaxed opacity-80 mb-10">Sua equipe está operando com 92% de eficiência técnica este mês.</p>
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span>Nível de Colaboração</span>
                      <span>Excelente</span>
                   </div>
                   <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-[92%] rounded-full shadow-[0_0_10px_white]"></div>
                   </div>
                </div>
             </Card>

             <Card className="p-10 border-amber-500/10 bg-amber-500/5">
                <h3 className="text-lg font-black italic uppercase text-amber-50 mb-8 flex items-center gap-3">
                  <Activity className="text-amber-500" /> Log de Presença
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <p className="text-xs font-black text-amber-50">Ricardo iniciou turno <span className="text-stone-600 text-[10px]">08:00</span></p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <p className="text-xs font-black text-amber-50">Carlos chegou na Obra <span className="text-stone-600 text-[10px]">09:15</span></p>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black italic uppercase text-amber-50">Fila de Montagem e Usinagem</h2>
                <Badge variant="warning">{tasks.length} Em Aberto</Badge>
             </div>
             
             <div className="space-y-4">
                {tasks.map(task => (
                  <Card key={task.id} className="group hover:bg-[#292524] transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${task.status === 'in_progress' ? 'bg-amber-500 text-black animate-pulse' : 'bg-white/5 text-stone-500'}`}>
                             {task.status === 'in_progress' ? <Clock size={28}/> : <CheckCircle2 size={28}/>}
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-amber-50 uppercase italic tracking-tighter">{task.title}</h4>
                             <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> {task.assignedTo}</span>
                                <Badge variant={task.priority === 'high' ? 'danger' : 'neutral'}>{task.priority.toUpperCase()}</Badge>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-stone-600 font-black uppercase mb-1">Prazo</p>
                          <p className="text-sm font-black text-amber-50">{task.deadline}</p>
                       </div>
                    </div>
                  </Card>
                ))}
             </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <Card className="p-10 border-indigo-500/20 bg-indigo-500/5">
                <h3 className="text-lg font-black italic uppercase text-amber-50 mb-8 flex items-center gap-3">
                   <AlertCircle className="text-indigo-400" /> Gargalos Identificados
                </h3>
                <div className="space-y-6">
                   <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Atraso Crítico</p>
                      <p className="text-xs font-bold text-stone-300">Entrega de corrediças Blum impactando 3 projetos.</p>
                   </div>
                </div>
             </Card>
             
             <Button variant="primary" className="w-full h-20 rounded-3xl" icon={Plus}>Nova Tarefa de Produção</Button>
          </div>
        </div>
      )}

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Convite de Elite Industrial">
         <div className="space-y-10">
            <InputGroup label="E-mail Corporativo" placeholder="ex: projetista@suaoficina.com.br" />
            <div className="space-y-4">
               <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Nível de Permissão</p>
               <div className="grid grid-cols-2 gap-4">
                  <button className="p-8 bg-white/5 border-2 border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-amber-500 transition-all text-stone-500 hover:text-white group">
                     <HardHat size={40} className="group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black uppercase">Operacional</span>
                  </button>
                  <button className="p-8 bg-white/5 border-2 border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-indigo-500 transition-all text-stone-500 hover:text-white group">
                     <Shield size={40} className="group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black uppercase">Admin / Mestre</span>
                  </button>
               </div>
            </div>
            <Button variant="magic" className="w-full h-16 rounded-2xl" onClick={() => setShowInviteModal(false)}>Enviar Convite Blindado</Button>
         </div>
      </Modal>
    </div>
  );
};
