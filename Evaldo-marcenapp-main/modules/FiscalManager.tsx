


import React, { useState, useEffect } from 'react';
import { 
  FileCheck, ShieldAlert, ReceiptText, Calculator, 
  ArrowRight, Loader2, Sparkles, Download, 
  History, Info, Landmark, CheckCircle2, X, Send
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { getFiscalAdvice } from '../geminiService';
import { formatCurrency } from '../utils';
import { Invoice } from '../types';

export const FiscalManager: React.FC = () => {
  const { projects, activeProjectId } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const dna = activeProject?.dna || { width: 0, height: 0, clientName: 'Consumidor' } as any;

  const [loading, setLoading] = useState(false);
  const [fiscalAdvice, setFiscalAdvice] = useState<any>(null);
  // Corrigindo propriedades do estado inicial para snake_case conforme a interface Invoice
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: '1', number: '001.292.001', client_name: 'João da Silva', value: 12500, tax_value: 750, date: Date.now() - 86400000, status: 'authorized', ncm_code: '9403.60.00' },
    { id: '2', number: '001.292.002', client_name: 'Mariana Lima', value: 8900, tax_value: 534, date: Date.now() - 43200000, status: 'pending', ncm_code: '9403.60.00' }
  ]);
  const [showIssueModal, setShowIssueModal] = useState(false);

  useEffect(() => {
    if (dna.width > 0) fetchAdvice();
  }, [activeProjectId]);

  const fetchAdvice = async () => {
    setLoading(true);
    const advice = await getFiscalAdvice(dna);
    setFiscalAdvice(advice);
    setLoading(false);
  };

  const handleIssueInvoice = () => {
    const value = (dna.width * dna.height * 2850) || 1000;
    // Corrigindo nomes de propriedades para snake_case na criação da nova fatura
    const newInvoice: Invoice = {
      id: Math.random().toString(),
      number: `001.292.${invoices.length + 1}`.padStart(11, '0'),
      client_name: dna.clientName || activeProject?.clientName || 'Cliente Final',
      value: value,
      tax_value: value * (fiscalAdvice?.taxRate / 100 || 0.06),
      date: Date.now(),
      status: 'pending',
      ncm_code: fiscalAdvice?.ncm || '9403.60.00'
    };
    setInvoices([newInvoice, ...invoices]);
    setShowIssueModal(false);
    alert("NF-e em processamento junto à SEFAZ.");
  };

  const totalTaxes = invoices.filter(i => i.status === 'authorized').reduce((acc, i) => acc + i.tax_value, 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">Fiscal</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Automação de NF-e e inteligência tributária.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="secondary" icon={History}>Histórico SEFAZ</Button>
           <Button variant="magic" icon={ReceiptText} onClick={() => setShowIssueModal(true)}>Emitir Nova NF-e</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="bg-[#1c1917] border-white/5 p-8 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Impostos no Mês (DAS)</p>
            <div className="flex items-end gap-3">
               <h3 className="text-4xl font-black text-amber-50 tracking-tighter italic">{formatCurrency(totalTaxes)}</h3>
               <Badge variant="success">Regular</Badge>
            </div>
         </Card>

         <Card className="bg-[#1c1917] border-white/5 p-8 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Faturamento Bruto (NF-e)</p>
            <div className="flex items-end gap-3">
               <h3 className="text-4xl font-black text-amber-50 tracking-tighter italic">{formatCurrency(invoices.reduce((acc, i) => acc + i.value, 0))}</h3>
               <span className="text-indigo-400 text-[10px] font-black mb-1.5">{invoices.length} Notas</span>
            </div>
         </Card>

         <Card className="bg-amber-500 p-8 text-black shadow-2xl shadow-amber-600/20">
            <div className="flex justify-between items-start mb-6">
               <Landmark size={24} />
               <Badge variant="neutral">Status Fiscal</Badge>
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Certificado Digital</h3>
            <div className="mt-6 flex items-center gap-3">
               <CheckCircle2 size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">A1 - Válido até 2026</span>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
           <Card className="bg-indigo-600 text-white border-none p-10 relative overflow-hidden h-full">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                       <Sparkles size={28}/>
                    </div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Consultor Fiscal</h3>
                 </div>

                 {loading ? (
                   <div className="py-10 text-center space-y-4">
                      <Loader2 className="animate-spin mx-auto" size={32}/>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">IARA analisando legislação...</p>
                   </div>
                 ) : fiscalAdvice ? (
                   <div className="space-y-6 animate-in slide-in-from-left duration-500">
                      <div>
                         <p className="text-[10px] font-black uppercase opacity-60 mb-1">NCM Recomendado</p>
                         <p className="text-lg font-black tracking-tighter">{String(fiscalAdvice.ncm)}</p>
                         <p className="text-[9px] font-bold uppercase opacity-80 mt-1">{String(fiscalAdvice.ncmDescription)}</p>
                      </div>
                      <div className="bg-black/20 p-5 rounded-2xl border border-white/10">
                         <p className="text-sm font-medium italic leading-relaxed">"{String(fiscalAdvice.advice)}"</p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/10">
                         <span className="text-[10px] font-black uppercase opacity-60">Alíquota Estimada</span>
                         <span className="text-2xl font-black italic">{String(fiscalAdvice.taxRate)}%</span>
                      </div>
                   </div>
                 ) : (
                   <p className="text-sm opacity-60">Aguardando dados do projeto para análise fiscal.</p>
                 )}
              </div>
           </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
           <Card className="p-0 border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-lg font-black italic uppercase text-amber-50 flex items-center gap-3">
                   <ReceiptText className="text-amber-500" /> Notas Fiscais Emitidas
                 </h3>
                 <div className="flex gap-2">
                    <Button variant="ghost" className="h-8 text-[9px]" icon={Download}>Exportar XML Batch</Button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-black/40 text-[9px] font-black uppercase tracking-widest text-stone-600">
                       <tr>
                          <th className="px-8 py-5">Número</th>
                          <th className="px-8 py-5">Cliente</th>
                          <th className="px-8 py-5">Valor</th>
                          <th className="px-8 py-5">Imposto</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {invoices.map(invoice => (
                         <tr key={invoice.id} className="group hover:bg-white/5 transition-all">
                            <td className="px-8 py-6">
                               <p className="text-sm font-black text-amber-50">{invoice.number}</p>
                               <p className="text-[9px] text-stone-600 font-bold">{new Date(invoice.date).toLocaleDateString()}</p>
                            </td>
                            <td className="px-8 py-6">
                               {/* Corrigindo acesso à propriedade para snake_case */}
                               <p className="text-sm font-black text-stone-300">{invoice.client_name}</p>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-sm font-black text-amber-50">{formatCurrency(invoice.value)}</p>
                            </td>
                            <td className="px-8 py-6">
                               {/* Corrigindo acesso à propriedade para snake_case */}
                               <p className="text-sm font-black text-red-500/80">{formatCurrency(invoice.tax_value)}</p>
                            </td>
                            <td className="px-8 py-6">
                               <Badge variant={invoice.status === 'authorized' ? 'success' : 'warning'}>
                                  {invoice.status === 'authorized' ? 'Autorizada' : 'Pendente'}
                               </Badge>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button className="p-2 text-stone-600 hover:text-amber-500 transition-all"><Download size={16}/></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </div>

      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Emissão de NF-e Industrial">
         <div className="space-y-10">
            <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl flex items-center gap-6">
               <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-black">
                  <Calculator size={32}/>
               </div>
               <div>
                  <h4 className="text-xl font-black text-amber-50 uppercase italic tracking-tighter">Revisão de Impostos</h4>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">A IARA calculou {String(fiscalAdvice?.taxRate || 6)}% de imposto para este projeto.</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <p className="text-[10px] font-black text-stone-600 uppercase mb-1">Destinatário</p>
                     <p className="text-lg font-black text-amber-50">{dna.clientName || 'Cliente Final'}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-stone-600 uppercase mb-1">Valor da Nota</p>
                     <p className="text-2xl font-black text-amber-50">{formatCurrency(dna.width * dna.height * 2850 || 1000)}</p>
                  </div>
               </div>
               
               <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-stone-600 uppercase mb-4">Natureza da Operação</p>
                  <p className="text-sm font-bold text-stone-300">Venda de produção do estabelecimento - CFOP 5.101</p>
               </div>
            </div>

            <div className="flex gap-4">
               <Button variant="secondary" className="flex-1 h-16 rounded-2xl" onClick={() => setShowIssueModal(false)}>Cancelar</Button>
               <Button variant="magic" className="flex-1 h-16 rounded-2xl" icon={Send} onClick={handleIssueInvoice}>Transmitir para SEFAZ</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
