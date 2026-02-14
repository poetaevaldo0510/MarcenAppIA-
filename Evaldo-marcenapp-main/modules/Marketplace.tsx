
import React, { useState } from 'react';
import { ShoppingBag, Search, Filter, Package, ShoppingCart, Check, Trash2, CreditCard, ChevronRight, Zap, Star, ShieldCheck, Coins, Calendar, Loader2, Sparkles, Box } from 'lucide-react';
import { Card, Button, Badge, Modal } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { formatCurrency } from '../utils';

const TOOLS = [
  { id: 't1', name: 'Nesting Industrial v8', desc: 'Otimização avançada de chapas com aproveitamento de 95%+. Foco em economia de MDF.', price: 49.90, model: 'token', icon: Box },
  { id: 't2', name: 'Render 4K Cinematic', desc: 'Materialização de ambientes em ultra-realismo fotográfico via Gemini 3 Pro Vision.', price: 15.00, model: 'single', icon: Sparkles },
  { id: 't3', name: 'Gestão Mestre Premium', desc: 'Módulo completo de CRM, Contratos Jurídicos e Fluxo de Caixa para Lojas e Fábricas.', price: 199.00, model: 'monthly', icon: ShieldCheck },
];

export const Marketplace: React.FC = () => {
  const { credits, buyTool, isAdmin } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'supplies' | 'tools'>('tools');
  const [buyingTool, setBuyingTool] = useState<any>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const handlePurchase = async () => {
    if (!buyingTool) return;
    setPurchaseLoading(true);
    
    // Simulação de processamento bancário industrial
    await new Promise(r => setTimeout(r, 1800));
    
    const success = buyTool(buyingTool.id, buyingTool.price);
    
    if (success) {
      setPurchaseSuccess(true);
      setTimeout(() => {
        setPurchaseSuccess(false);
        setBuyingTool(null);
      }, 2500);
    } else {
      alert("Créditos insuficientes no painel. Realize uma recarga.");
    }
    setPurchaseLoading(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-32 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Loja.<span className="text-amber-500">Mestre</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-3">Ferramentas de poder para sua jornada industrial.</p>
        </div>
        
        <div className="flex bg-[#1c272d] p-1.5 rounded-2xl border border-white/5">
           <button onClick={() => setActiveTab('tools')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tools' ? 'bg-amber-500 text-black shadow-lg shadow-amber-600/20' : 'text-stone-500 hover:text-white'}`}>Ativos Digitais</button>
           <button onClick={() => setActiveTab('supplies')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'supplies' ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500 hover:text-white'}`}>Insumos Fábrica</button>
        </div>
      </header>

      {activeTab === 'tools' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {TOOLS.map(tool => (
             <Card key={tool.id} className="group hover:border-amber-500/40 transition-all relative overflow-hidden flex flex-col h-full bg-[#141210] p-10 ring-1 ring-white/5 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                   <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-amber-500 border border-white/10 group-hover:border-amber-500/30 transition-all shadow-xl">
                      <tool.icon size={40} />
                   </div>
                   <Badge variant={tool.model === 'monthly' ? 'info' : 'warning'}>
                      {tool.model === 'monthly' ? 'MENSAL' : 'POR PROJETO'}
                   </Badge>
                </div>

                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">{tool.name}</h3>
                <p className="text-xs font-medium text-stone-500 leading-relaxed flex-1 italic">"{tool.desc}"</p>
                
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-6">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[10px] text-stone-600 font-black uppercase mb-1">Investimento</p>
                         <p className="text-3xl font-black text-amber-50 italic">{formatCurrency(tool.price)}</p>
                      </div>
                      <div className="flex flex-col items-end">
                         {tool.model === 'token' ? <Coins size={20} className="text-amber-500 mb-1" /> : <Calendar size={20} className="text-indigo-400 mb-1" />}
                         <span className="text-[8px] font-black text-stone-600 uppercase">Billing Cloud</span>
                      </div>
                   </div>
                   <Button 
                      variant="magic" 
                      className="w-full h-20 rounded-[2.5rem] text-[12px] shadow-amber-600/20" 
                      icon={ShoppingCart}
                      onClick={() => setBuyingTool(tool)}
                    >
                      {tool.model === 'token' ? 'Adquirir Tokens' : 'Liberar Acesso'}
                   </Button>
                </div>
             </Card>
           ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-10 opacity-40">
           <Package size={100} className="mx-auto text-stone-800" />
           <div>
              <h3 className="text-3xl font-black uppercase italic text-stone-700 tracking-tighter">Portal de Suprimentos Fábrica</h3>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-stone-800 mt-4 leading-relaxed">Conectando sua linha de produção às maiores revendas.</p>
           </div>
        </div>
      )}

      {/* Modal de Checkout */}
      <Modal isOpen={!!buyingTool} onClose={() => !purchaseLoading && setBuyingTool(null)} title="Liquidação de Ativo" maxWidth="max-w-md">
         {purchaseSuccess ? (
            <div className="py-16 text-center space-y-8 animate-in zoom-in duration-500">
               <div className="w-28 h-28 bg-emerald-500 text-black rounded-[3rem] flex items-center justify-center mx-auto shadow-3xl shadow-emerald-500/40">
                  <Check size={56} strokeWidth={3}/>
               </div>
               <div>
                  <h3 className="text-4xl font-black italic uppercase text-amber-50 leading-none">Liberado!</h3>
                  <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Sincronização concluída no ecossistema.</p>
               </div>
            </div>
         ) : (
            <div className="space-y-10">
               <div className="flex items-center gap-8 p-10 bg-white/5 rounded-[3rem] border border-white/5 ring-1 ring-white/10">
                  <div className="w-20 h-20 bg-amber-500 text-black rounded-[1.8rem] flex items-center justify-center shadow-2xl">
                     {buyingTool && <buyingTool.icon size={40}/>}
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Item Selecionado</p>
                     <h4 className="text-2xl font-black text-amber-50 uppercase tracking-tighter leading-tight mt-1">{buyingTool?.name}</h4>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex justify-between items-center px-6">
                     <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Investimento Final</span>
                     <span className="text-3xl font-black text-amber-50 italic">{formatCurrency(buyingTool?.price || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center px-6">
                     <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Saldo Disponível</span>
                     <span className="text-3xl font-black text-indigo-400 italic">{isAdmin ? 'MASTER ∞' : credits}</span>
                  </div>
               </div>

               <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                  <div className="flex items-center gap-4 text-indigo-400 mb-3">
                     <Zap size={20} fill="currentColor"/>
                     <span className="text-[10px] font-black uppercase tracking-widest">Split Bancário Industrial</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-bold uppercase leading-relaxed tracking-widest">Ao confirmar, os créditos serão liquidados e o ativo estará disponível em todo o seu ecossistema.</p>
               </div>

               <div className="grid grid-cols-1 gap-4 pt-4">
                  <Button variant="magic" className="w-full h-20 rounded-[2.5rem] text-sm shadow-xl" onClick={handlePurchase} disabled={purchaseLoading}>
                     {purchaseLoading ? <Loader2 className="animate-spin" size={28}/> : 'Confirmar & Liquidar'}
                  </Button>
                  <Button variant="ghost" className="h-14 rounded-2xl text-stone-700 hover:text-stone-400" onClick={() => setBuyingTool(null)} disabled={purchaseLoading}>Voltar p/ Loja</Button>
               </div>
            </div>
         )}
      </Modal>
    </div>
  );
};
