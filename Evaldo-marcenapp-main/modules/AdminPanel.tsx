
import React from 'react';
import { 
  ShieldAlert, Users, Database, Globe, 
  BarChart3, Activity, Terminal, Key,
  Search, HardDrive, Cpu, AlertCircle, RefreshCw,
  Landmark, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';

export const AdminPanel: React.FC<any> = ({ onNavigate }) => {
  const { projects } = useProjectStore();

  const auditLogs = [
    { id: '1', user: 'Evaldo Master', details: 'Aprovação de projeto industrial v10.2' },
    { id: '2', user: 'IARA Engine', details: 'Nesting otimizado com 94% aproveitamento' },
    { id: '3', user: 'Admin System', details: 'Sincronização de Valuation concluída' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <Badge variant="danger">Restricted Area: Admin Master</Badge>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mt-4">Master.<span className="text-red-500">Control</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Auditoria de sistema, gestão de tokens e infraestrutura.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="magic" icon={TrendingUp} onClick={() => onNavigate?.('valuation')}>Acompanhar Evolução Equity</Button>
           <Button variant="dark" icon={RefreshCw} className="h-14 border-red-500/20 text-red-500">Reiniciar Nodes</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Usuários Ativos', val: '124', icon: Users, color: 'text-blue-500' },
          { label: 'Projetos Cloud', val: projects.length.toString(), icon: Database, color: 'text-emerald-500' },
          { label: 'Uptime Sistema', val: '99.9%', icon: Activity, color: 'text-amber-500' },
          { label: 'Requisições IA', val: '12.4k', icon: Cpu, color: 'text-indigo-500' },
        ].map((s, i) => (
          <Card key={i} className="p-8 border-white/5 bg-[#111b21]">
            <div className="flex justify-between items-start mb-4">
               <p className="text-[9px] text-stone-600 font-black uppercase tracking-widest">{s.label}</p>
               <s.icon size={16} className={s.color} />
            </div>
            <h3 className="text-3xl font-black text-white italic">{s.val}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           <Card className="p-0 border-white/5 overflow-hidden bg-[#111b21]">
              <div className="p-8 border-b border-white/5 bg-black/40 flex justify-between items-center">
                 <h3 className="text-lg font-black italic uppercase text-red-50 flex items-center gap-3">
                    <Terminal size={20}/> Log de Auditoria Global
                 </h3>
                 <div className="flex gap-2">
                    <button className="p-2 bg-white/5 rounded-lg text-stone-500"><Search size={16}/></button>
                 </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                 <table className="w-full text-left">
                    <thead className="bg-black/20 text-[9px] font-black uppercase text-stone-600">
                       <tr>
                          <th className="px-8 py-4">Sessão</th>
                          <th className="px-8 py-4">Mestre</th>
                          <th className="px-8 py-4">Comando</th>
                          <th className="px-8 py-4">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {auditLogs.map(log => (
                         <tr key={log.id} className="text-[11px] font-mono hover:bg-white/5 transition-all">
                            <td className="px-8 py-4 text-stone-600">#{log.id}</td>
                            <td className="px-8 py-4 text-blue-400">{log.user}</td>
                            <td className="px-8 py-4 text-stone-300 italic">{log.details}</td>
                            <td className="px-8 py-4">
                               <Badge variant="success">OK</Badge>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>

           {/* Added onClick to Card component usage to fix error in AdminPanel.tsx line 89 */}
           <Card className="p-8 border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-all group" onClick={() => onNavigate?.('valuation')}>
              <div className="flex justify-between items-start">
                 <div>
                    <h4 className="text-lg font-black text-amber-50 uppercase italic tracking-tighter flex items-center gap-3">
                       <Landmark className="text-amber-500" /> Acompanhar Evolução Patrimonial
                    </h4>
                    <p className="text-[10px] text-stone-500 font-bold uppercase mt-2 max-w-sm">Verifique o histórico de crescimento do ecossistema e as métricas de equity industrial.</p>
                 </div>
                 <div className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpRight size={24}/>
                 </div>
              </div>
           </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-8 border-red-500/20 bg-red-500/5">
              <h3 className="text-lg font-black italic uppercase text-red-50 mb-6 flex items-center gap-3">
                <Key size={20}/> Segurança Master
              </h3>
              <div className="space-y-4">
                 <Button variant="danger" className="w-full h-14 rounded-2xl text-[10px]">Revogar Todas as Chaves</Button>
                 <Button variant="outline" className="w-full h-14 rounded-2xl text-[10px] border-white/10">Trocar Token Supabase</Button>
              </div>
           </Card>

           <Card className="p-8 border-white/5 bg-[#111b21]">
              <div className="flex items-center gap-4 mb-6">
                 <AlertCircle className="text-amber-500" />
                 <h4 className="text-sm font-black text-white uppercase italic">Alertas da Infra</h4>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] font-bold text-stone-500 leading-relaxed">
                    Latência do Gemini 3 Pro está acima do esperado no cluster Sul-1.
                 </div>
                 <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[10px] font-bold text-emerald-500 leading-relaxed">
                    Backup Supabase concluído às 04:00h.
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
