
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Box, ShoppingCart, Truck, AlertTriangle, 
  ArrowUpRight, Download, Plus, Search, Filter,
  History, Store, CheckCircle2, PackageSearch,
  Zap, PieChart, ChevronRight, FileText, Share2, ClipboardList,
  Star, Phone, ShoppingBag, FileSearch, Trash2, Printer,
  Activity, Clock, Send
} from 'lucide-react';
import { Card, Button, Badge, Modal, InputGroup } from '../components/UI';
import { InventoryItem, QuoteRequest, Supplier } from '../types';
import { formatCurrency } from '../utils';

export const SupplierIntelligence: React.FC = () => {
  const [activeView, setActiveView] = useState<'inventory' | 'quotes' | 'suppliers'>('inventory');
  const [showAddStock, setShowAddStock] = useState(false);
  const [showBulkQuote, setShowBulkQuote] = useState(false);

  const inventory: InventoryItem[] = [
    { id: '1', name: 'MDF 18mm Nogueira', category: 'mdf', currentStock: 12, minStock: 5, unit: 'Chapas', lastPrice: 540 },
    { id: '2', name: 'Dobradiça Blum 110º', category: 'hardware', currentStock: 45, minStock: 100, unit: 'Unid', lastPrice: 12.9 },
    { id: '3', name: 'MDF 15mm Branco TX', category: 'mdf', currentStock: 3, minStock: 10, unit: 'Chapas', lastPrice: 280 },
    { id: '4', name: 'Cola Pur 500g', category: 'glue', currentStock: 8, minStock: 2, unit: 'Frascos', lastPrice: 85 },
  ];

  const criticalItems = useMemo(() => inventory.filter(i => i.currentStock <= i.minStock), [inventory]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Industrial.<span className="text-amber-500">Logistics</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Gestão inteligente de insumos e cadeia de suprimentos.</p>
        </div>
        
        <div className="flex bg-[#1c1917] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
          <button onClick={() => setActiveView('inventory')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'inventory' ? 'bg-amber-500 text-black shadow-lg shadow-amber-600/20' : 'text-stone-500 hover:text-white'}`}><Box size={14}/> Estoque</button>
          <button onClick={() => setActiveView('quotes')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'quotes' ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500 hover:text-white'}`}><ShoppingCart size={14}/> Compras</button>
          <button onClick={() => setActiveView('suppliers')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'suppliers' ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500 hover:text-white'}`}><Store size={14}/> Fornecedores</button>
        </div>
      </header>

      {activeView === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
               <div className="relative flex-1 group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-600" size={18}/>
                 <input type="text" placeholder="Buscar insumo industrial..." className="w-full bg-[#1c1917] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all"/>
               </div>
               <div className="flex gap-3">
                  <Button variant="secondary" icon={History} className="h-14 rounded-2xl border-white/5">Histórico</Button>
                  <Button variant="magic" icon={Plus} onClick={() => setShowAddStock(true)} className="h-14 rounded-2xl px-8 shadow-amber-600/20">Entrada OS</Button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inventory.map(item => {
                const isLow = item.currentStock <= item.minStock;
                const progress = (item.currentStock / (item.minStock * 2)) * 100;
                return (
                  <Card key={item.id} className="group hover:border-amber-500/40 transition-all relative overflow-hidden">
                    {isLow && (
                       <div className="absolute top-0 right-0 p-4">
                          {/* Added className to Badge to fix module error */}
                          <Badge variant="danger" className="animate-pulse">CRÍTICO</Badge>
                       </div>
                    )}
                    <div className="flex items-center gap-5 mb-8">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLow ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-stone-500'}`}>
                          {item.category === 'mdf' ? <Layers size={24}/> : <Box size={24}/>}
                       </div>
                       <div>
                          <h3 className="text-lg font-black text-amber-50 tracking-tighter uppercase italic">{item.name}</h3>
                          <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">{item.category} • Ult. Preço: {formatCurrency(item.lastPrice)}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[9px] text-stone-600 font-black uppercase mb-1">Saldo em Depósito</p>
                             <p className="text-2xl font-black text-amber-50 italic">{item.currentStock} <span className="text-[10px] text-stone-700 not-italic uppercase">{item.unit}</span></p>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] text-stone-600 font-black uppercase mb-1">Nível de Segurança</p>
                             <p className="text-sm font-black text-stone-400">{item.minStock} {item.unit}</p>
                          </div>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                       </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <Card className="bg-indigo-600 p-10 text-white border-none relative overflow-hidden shadow-2xl">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <ShoppingBag className="mb-6 opacity-50" size={32}/>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 leading-none">Cotação Automática</h3>
                <p className="text-sm font-medium leading-relaxed opacity-80 mb-10">Existem <strong>{criticalItems.length} itens</strong> abaixo do nível de segurança. Gere uma cotação agora.</p>
                <Button 
                   variant="dark" 
                   className="w-full bg-black/40 border-none text-white font-black h-16 rounded-[2rem]" 
                   icon={FileSearch}
                   onClick={() => setShowBulkQuote(true)}
                >
                   Gerar Lista de Compra
                </Button>
             </Card>

             <Card className="p-10 border-amber-500/10 bg-amber-500/5">
                <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-6 flex items-center gap-3">
                   <Activity className="text-amber-500" size={18}/> Status de Carga
                </h4>
                <div className="space-y-6">
                   <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Truck size={16}/></div>
                      <div>
                         <p className="text-xs font-black text-amber-50 uppercase">MDF Express</p>
                         <p className="text-[9px] text-stone-600 font-bold uppercase">Entregue • 14:02h</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 opacity-50">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Clock size={16}/></div>
                      <div>
                         <p className="text-xs font-black text-amber-50 uppercase">Blum Brasil</p>
                         <p className="text-[9px] text-stone-600 font-bold uppercase">Previsão: Amanhã</p>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      )}

      {activeView === 'quotes' && (
        <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <Card className="p-10 border-white/5">
              <div className="flex justify-between items-center mb-12">
                 <h3 className="text-xl font-black italic uppercase text-amber-50 flex items-center gap-4">
                   <ShoppingCart className="text-amber-500" /> Pedidos de Compra Ativos
                 </h3>
                 <Button variant="primary" icon={Plus}>Novo Pedido Lote</Button>
              </div>
              <div className="space-y-6">
                 {[
                   { id: 'PO-921', supplier: 'MDF Express', total: 4200, status: 'approved', date: 'Hoje' },
                   { id: 'PO-925', supplier: 'Ferragens Elite', total: 1840, status: 'pending', date: 'Ontem' },
                 ].map(po => (
                   <div key={po.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-stone-500">#{po.id.split('-')[1]}</div>
                         <div>
                            <h4 className="text-base font-black text-amber-50 uppercase tracking-tighter">{po.supplier}</h4>
                            <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">{po.date} • {formatCurrency(po.total)}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <Badge variant={po.status === 'approved' ? 'success' : 'warning'}>{po.status.toUpperCase()}</Badge>
                         <button className="p-3 bg-white/5 rounded-xl text-stone-600 hover:text-amber-500"><Download size={18}/></button>
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      )}

      {activeView === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in duration-500">
           {[
             { name: 'MDF Express', cat: 'Chapas & Fitas', score: 4.8, location: 'Barueri, SP' },
             { name: 'Blum Brasil', cat: 'Ferragens High-End', score: 5.0, location: 'Curitiba, PR' },
             { name: 'FGV Tenne', cat: 'Ferragens Padrão', score: 4.5, location: 'Maringá, PR' },
           ].map((s, i) => (
             <Card key={i} className="group hover:bg-[#292524] transition-all relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><Store size={120}/></div>
                <div className="flex justify-between items-start mb-8">
                   <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 font-black text-xl border border-amber-500/20">{s.name.charAt(0)}</div>
                   <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-amber-500">
                         <Star size={14} fill="currentColor" />
                         <span className="text-sm font-black italic">{s.score}</span>
                      </div>
                      <Badge variant="success">Homologado</Badge>
                   </div>
                </div>
                <h3 className="text-2xl font-black text-amber-50 mb-2 uppercase tracking-tighter">{s.name}</h3>
                <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-8">{s.cat} • {s.location}</p>
                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                   <Button variant="secondary" className="h-12 rounded-xl text-[9px]" icon={Phone}>Contatar</Button>
                   <Button variant="outline" className="h-12 rounded-xl text-[9px]">Catálogo</Button>
                </div>
             </Card>
           ))}
        </div>
      )}

      {/* Modal Cotação em Lote */}
      <Modal isOpen={showBulkQuote} onClose={() => setShowBulkQuote(false)} title="Gerador de Cotação Industrial">
         <div className="space-y-10">
            <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] flex items-center gap-8">
               <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-black shadow-xl shadow-amber-600/30">
                  <ClipboardList size={40} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-amber-50 uppercase italic tracking-tighter">Lista de Reposição Crítica</h4>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-2">IARA detectou {criticalItems.length} insumos abaixo do estoque de segurança.</p>
               </div>
            </div>

            <div className="space-y-4">
               {criticalItems.map(item => (
                 <div key={item.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex justify-between items-center">
                    <div>
                       <p className="text-sm font-black text-amber-50 uppercase">{item.name}</p>
                       <p className="text-[9px] text-stone-600 font-bold uppercase mt-1">Saldo Atual: {item.currentStock} / Mínimo: {item.minStock}</p>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-[9px] text-stone-600 font-black uppercase mb-1">Sugestão de Compra</p>
                          <p className="text-lg font-black text-amber-500 italic">+{item.minStock * 2} <span className="text-[9px] text-stone-700 not-italic">{item.unit}</span></p>
                       </div>
                       <button className="p-3 text-stone-700 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Button variant="outline" className="h-16 rounded-2xl border-white/10" icon={Printer}>Gerar PDF Cotação</Button>
               <Button variant="magic" className="h-16 rounded-2xl" icon={Send}>Enviar para 5 Revendas</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={showAddStock} onClose={() => setShowAddStock(false)} title="Nova Entrada de Material">
         <div className="space-y-10">
            <div className="p-10 bg-indigo-600 text-white rounded-[2.5rem] border-none text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
               <Zap className="mx-auto mb-6 opacity-50" size={40}/>
               <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">Scanner de NF-e Ativo</h4>
               <p className="text-sm font-medium leading-relaxed opacity-80 mb-8">Aponte a câmera para o QR Code da Nota Fiscal para processamento automático.</p>
               <Button variant="dark" className="mx-auto bg-black/40 border-none h-14 px-12" icon={Plus}>Ativar Câmera</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <InputGroup label="Material" placeholder="Ex: MDF Branco 15mm" />
               <InputGroup label="Quantidade" type="number" suffix="Unid" />
            </div>
            <Button variant="primary" className="w-full h-16 rounded-2xl" onClick={() => setShowAddStock(false)}>Confirmar Entrada Manual</Button>
         </div>
      </Modal>
    </div>
  );
};

const Layers = ({size}: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a1 1 0 0 0 0 1.82l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a1 1 0 0 0 0-1.82Z"/>
    <path d="m2.6 11.37 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09"/>
    <path d="m2.6 16.47 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09"/>
  </svg>
);
