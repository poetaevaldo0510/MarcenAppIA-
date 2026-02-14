
import React, { useState } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, Lock, 
  ChevronRight, ArrowLeft, QrCode, Smartphone,
  Info, Award, Sparkles, Building2, Landmark,
  Zap, Loader2
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';

export const PaymentCheckout: React.FC = () => {
  const { activePaymentSession, completePayment, projects } = useProjectStore();
  const [step, setStep] = useState<'methods' | 'processing' | 'success'>('methods');
  const [method, setMethod] = useState<'credit_card' | 'pix'>('credit_card');

  const activeProject = projects.find(p => p.id === activePaymentSession?.projectId);

  if (!activePaymentSession) {
    return (
      <div className="flex flex-col items-center justify-center py-40 opacity-30 text-center">
         <Lock size={64} className="mb-6" />
         <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma sessão de checkout ativa</p>
      </div>
    );
  }

  const handlePay = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2500));
    completePayment(method);
    setStep('success');
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700 pb-20">
      {step !== 'success' && (
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Coluna de Info do Projeto */}
          <div className="lg:col-span-1 flex-1 space-y-8">
             <div>
                <Badge variant="info">Ambiente de Pagamento Seguro</Badge>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50 mt-4">Resumo da <span className="text-amber-500">Obra</span></h1>
                <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Validação final e aceite do projeto.</p>
             </div>

             <Card className="p-8 border-white/5 bg-[#141210]">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                   <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                      <Building2 size={28}/>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-stone-500 uppercase">Projeto</p>
                      <h3 className="text-lg font-black text-amber-50 uppercase tracking-tighter">{activeProject?.projectName}</h3>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Valor do Contrato</span>
                      <span className="text-2xl font-black text-amber-50 italic">{formatCurrency(activePaymentSession.amount)}</span>
                   </div>
                   <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 text-emerald-400 mb-2">
                         <ShieldCheck size={16}/>
                         <span className="text-[10px] font-black uppercase">Garantia Workshop.OS</span>
                      </div>
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed">Seu pagamento está protegido. A liberação ao marceneiro ocorre de forma auditada.</p>
                   </div>
                </div>
             </Card>

             <Card className="p-8 border-indigo-500/20 bg-indigo-600/5">
                <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-4 flex items-center gap-3"><Award className="text-indigo-400" /> Vantagens de Elite</h4>
                <div className="space-y-4">
                   {[
                     'Seguro contra vícios ocultos',
                     'Pós-venda prioritário IARA',
                     'Selo de Marcenaria Industrial'
                   ].map((v, i) => (
                     <div key={i} className="flex items-center gap-3 text-[9px] font-black text-stone-400 uppercase">
                        <CheckCircle2 size={12} className="text-indigo-400"/> {v}
                     </div>
                   ))}
                </div>
             </Card>
          </div>

          {/* Coluna de Checkout */}
          <div className="lg:w-[420px] shrink-0">
             <Card className="p-10 border-amber-500/40 bg-black shadow-[0_50px_100px_rgba(0,0,0,0.8)] sticky top-10 ring-1 ring-amber-500/20">
                {step === 'methods' ? (
                  <div className="space-y-10">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black italic uppercase text-amber-50">Pagamento</h3>
                        <div className="flex gap-2">
                           <Lock size={14} className="text-stone-700"/>
                           <span className="text-[8px] font-black text-stone-700 uppercase">SSL 256 BIT</span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <button 
                          onClick={() => setMethod('credit_card')}
                          className={`w-full p-6 rounded-3xl border flex items-center justify-between transition-all ${method === 'credit_card' ? 'bg-amber-500 border-amber-400 text-black shadow-lg' : 'bg-white/5 border-white/5 text-stone-500'}`}
                        >
                           <div className="flex items-center gap-5">
                              <CreditCard size={20}/>
                              <span className="text-xs font-black uppercase">Cartão de Crédito</span>
                           </div>
                           <ChevronRight size={18}/>
                        </button>

                        <button 
                          onClick={() => setMethod('pix')}
                          className={`w-full p-6 rounded-3xl border flex items-center justify-between transition-all ${method === 'pix' ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg' : 'bg-white/5 border-white/5 text-stone-500'}`}
                        >
                           <div className="flex items-center gap-5">
                              <Zap size={20}/>
                              <span className="text-xs font-black uppercase">PIX à Vista</span>
                           </div>
                           {/* Added className to Badge to fix module error */}
                           <Badge variant="neutral" className="bg-black/20">-5% Off</Badge>
                        </button>
                     </div>

                     <div className="space-y-6 pt-10 border-t border-white/5">
                        <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                           <span>Subtotal Obra</span>
                           <span>{formatCurrency(activePaymentSession.amount)}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-black italic text-amber-50">
                           <span>Total</span>
                           <span>{formatCurrency(method === 'pix' ? activePaymentSession.amount * 0.95 : activePaymentSession.amount)}</span>
                        </div>
                     </div>

                     <Button variant="magic" className="w-full h-20 rounded-[2.5rem] text-[13px]" onClick={handlePay}>
                        Confirmar & Pagar
                     </Button>

                     <p className="text-[8px] text-stone-600 text-center uppercase tracking-widest">Ao clicar em pagar, você aceita os termos técnicos e o cronograma de montagem anexo.</p>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-10">
                     <div className="relative">
                        <div className="w-24 h-24 border-t-2 border-amber-500 rounded-full animate-spin mx-auto"></div>
                        <Landmark className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={32}/>
                     </div>
                     <div>
                        <h3 className="text-2xl font-black italic uppercase text-amber-50 animate-pulse">Processando Split...</h3>
                        <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.4em] mt-4">Liquidando valores industriais</p>
                     </div>
                  </div>
                )}
             </Card>
          </div>
        </div>
      )}

      {step === 'success' && (
        <Card className="max-w-2xl mx-auto p-20 text-center bg-black border-emerald-500/20 shadow-2xl animate-in zoom-in duration-500">
           <div className="w-32 h-32 bg-emerald-500 text-black rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-emerald-500/30">
              <CheckCircle2 size={64} strokeWidth={3}/>
           </div>
           <h2 className="text-5xl font-black italic uppercase text-amber-50 tracking-tighter mb-4 leading-none">Obra Liquidada!</h2>
           <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.3em] mb-12">Seu projeto entrou oficialmente na linha de produção.</p>
           
           <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-left space-y-4 mb-12">
              <div className="flex justify-between text-[10px] font-black uppercase">
                 <span className="text-stone-600">ID Transação</span>
                 <span className="text-amber-50">#{activePaymentSession.id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase">
                 <span className="text-stone-600">Data de Entrega Estimada</span>
                 <span className="text-amber-50">24 de Maio, 2024</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-16 rounded-2xl border-white/10" icon={Smartphone}>Baixar App Cliente</Button>
              <Button variant="primary" className="h-16 rounded-2xl" icon={ChevronRight}>Acompanhar Obra</Button>
           </div>
        </Card>
      )}
    </div>
  );
};
