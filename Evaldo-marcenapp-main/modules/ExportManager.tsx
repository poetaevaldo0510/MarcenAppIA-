import React, { useRef } from 'react';
import { Printer, Download, QrCode, ShieldCheck, Hammer, Ruler, FileText, ChevronLeft, MapPin, Mail, Phone } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { ProjectData } from '../types';
import { formatCurrency } from '../utils';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  project: ProjectData;
  onNavigate: (m: any) => void;
}

export const ExportManager: React.FC<Props> = ({ project, onNavigate }) => {
  const { projects, activeProjectId, activeEnvironmentId } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeEnv = activeProject?.environments.find(e => e.id === activeEnvironmentId);
  const history = activeEnv?.renders || [];
  const latestRender = history.length > 0 ? history[history.length - 1]?.url : null;
  const dna = activeEnv?.dna || project;
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 no-print">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Industrial.<span className="text-amber-500">Docs</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Exportação de propostas e relatórios técnicos.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => onNavigate('budget')} icon={ChevronLeft}>Voltar</Button>
          <Button variant="primary" onClick={handlePrint} icon={Printer} disabled={history.length === 0}>Imprimir / Salvar PDF</Button>
        </div>
      </header>

      {history.length === 0 && (
        <Card className="p-12 text-center border-amber-500/30 bg-amber-500/5">
          <FileText size={48} className="text-amber-500 mx-auto mb-6 opacity-30" />
          <h3 className="text-xl font-black italic uppercase text-amber-50">Nenhum Render Disponível</h3>
          <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mt-4">Você precisa gerar pelo menos um render no IARA STUDIO antes de exportar a proposta.</p>
          <Button variant="primary" className="mt-8 mx-auto" onClick={() => onNavigate('studio')}>Ir para o Studio</Button>
        </Card>
      )}

      {history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Proposta Visual */}
            <Card className="p-0 border-white/5 overflow-hidden bg-white text-black shadow-2xl">
              <div className="p-12 print:p-8">
                <header className="flex justify-between items-start border-b-4 border-black pb-8 mb-12">
                  <div>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Proposta de<br/>Marcenaria</h2>
                     <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2 text-stone-500">Ref: #{activeProject?.id.toUpperCase() || 'PROJ-OS'}</p>
                  </div>
                  <div className="text-right">
                     <p className="font-black text-sm uppercase">Workshop OS</p>
                     <p className="text-[10px] text-stone-500 font-bold">Industrial Design & Craft</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                  <div className="space-y-6">
                     <div>
                       <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Cliente</p>
                       <p className="font-black text-lg">{dna.clientName || activeProject?.clientName || 'Cliente Final'}</p>
                     </div>
                     <div className="bg-stone-100 p-6 rounded-2xl">
                       <p className="text-[10px] font-black uppercase text-stone-400 mb-3">Especificações do Projeto</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] font-bold uppercase text-stone-500">Largura</p>
                            <p className="font-black text-sm">{dna.width}m</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold uppercase text-stone-500">Altura</p>
                            <p className="font-black text-sm">{dna.height}m</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold uppercase text-stone-500">Portas</p>
                            <p className="font-black text-sm">{dna.doors}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold uppercase text-stone-500">Gavetas</p>
                            <p className="font-black text-sm">{dna.drawers}</p>
                          </div>
                       </div>
                     </div>
                  </div>
                  <div className="relative aspect-square bg-stone-50 rounded-3xl overflow-hidden border border-stone-200">
                    {latestRender ? (
                      <img src={latestRender} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <FileText size={48} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border border-stone-200">
                      Render de Aprovação
                    </div>
                  </div>
                </div>

                <div className="bg-black text-white p-10 rounded-[2.5rem] flex justify-between items-center mb-12">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Investimento Total</p>
                    <h3 className="text-4xl font-black italic tracking-tighter">
                      {formatCurrency((dna.width * dna.height * 2850) || 5000)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[8px] font-bold uppercase opacity-50">Interatividade</p>
                      <p className="text-[10px] font-black">Escaneie para ver em 3D</p>
                    </div>
                    <div className="w-16 h-16 bg-white p-1 rounded-lg">
                      <QrCode className="text-black w-full h-full" />
                    </div>
                  </div>
                </div>

                <footer className="grid grid-cols-3 gap-8 pt-8 border-t border-stone-100 text-[9px] font-bold uppercase text-stone-400">
                  <div className="flex items-center gap-2"><ShieldCheck size={14} /> Garantia de 5 anos</div>
                  <div className="flex items-center gap-2"><Hammer size={14} /> Ferragens Premium</div>
                  <div className="flex items-center gap-2"><Ruler size={14} /> Medição Técnica Inclusa</div>
                </footer>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
             <Card className="p-8 border-amber-500/20 bg-amber-500/5">
                <h3 className="text-lg font-black italic uppercase text-amber-50 mb-6">Opções de Exportação</h3>
                <div className="space-y-4">
                   <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                         <FileText className="text-amber-500" size={18}/>
                         <span className="text-xs font-black uppercase tracking-widest text-stone-300 group-hover:text-white">Proposta Visual</span>
                      </div>
                      <Badge variant="info">Ativo</Badge>
                   </button>
                   <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                         <Ruler className="text-amber-500" size={18}/>
                         <span className="text-xs font-black uppercase tracking-widest text-stone-300 group-hover:text-white">Relatório Técnico</span>
                      </div>
                      <Badge variant="neutral">Beta</Badge>
                   </button>
                </div>
             </Card>

             <Card className="p-8">
                <h3 className="text-lg font-black italic uppercase text-amber-50 mb-6">Contatos da Oficina</h3>
                <div className="space-y-5">
                   <div className="flex items-center gap-4 text-stone-400">
                      <MapPin size={18} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase">Distrito Industrial, Galpão 04</span>
                   </div>
                   <div className="flex items-center gap-4 text-stone-400">
                      <Phone size={18} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase">(11) 98821-00XX</span>
                   </div>
                   <div className="flex items-center gap-4 text-stone-400">
                      <Mail size={18} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase">mestre@marcenariaos.ai</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          nav, header, aside, .LiveAssistant { display: none !important; }
          .max-w-7xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          main { overflow: visible !important; }
          .Card { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
};