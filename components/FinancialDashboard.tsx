
import React, { useState, useEffect, useMemo } from 'react';
import { getHistory, getCarpenterProfile } from '../services/historyService';
import { generateGroundedResponse } from '../services/geminiService';
import type { ProjectHistoryItem, UserProfile, SupplierOffer } from '../types';
import { 
    Spinner, CurrencyDollarIcon, CheckIcon, 
    GlobeIcon, ShieldCheckIcon, ToolsIcon, InfoIcon,
    ShoppingCartIcon, UserIcon, MapPin, WhatsappIcon,
    StoreIcon, TrendingUpIcon, LogoIcon, ArrowsExpandIcon, MinusIcon
} from './Shared';

export const FinancialDashboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'cashflow' | 'procurement' | 'superintendent'>('cashflow');
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    
    const [isComparing, setIsComparing] = useState(false);
    const [offers, setOffers] = useState<SupplierOffer[]>([]);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            Promise.all([getCarpenterProfile(), getHistory()]).then(([p, h]) => {
                setProfile(p);
                setProjects(h);
                setIsLoading(false);
            });
        }
    }, [isOpen]);

    const stats = useMemo(() => {
        const transactions = profile?.transactions || [];
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        return {
            totalInvoiced: income,
            totalExpenses: expenses,
            netProfit: income - expenses,
            margin: 35
        };
    }, [profile]);

    const handleFunctionalProcurement = async (type: 'pool' | 'bbq' | 'slab') => {
        setIsComparing(true);
        try {
            const prompt = `ESTELA CFO: Realize cotação técnica para MÓDULO FUNCIONAL: ${type.toUpperCase()}. 
            Considere fornecedores premium de bombas, refratários e impermeabilizantes na região do Mestre.
            Retorne comparativo de 2 players principais.`;
            
            const { text } = await generateGroundedResponse(prompt);
            
            // Simulação de resposta da Estela via Grounding
            const mockOffers: SupplierOffer[] = [
                { supplierId: 'f1', supplierName: 'AcquaTech Brasil', totalAmount: 12500, deliveryDays: 5, itemsMatch: 100, isBestPrice: false, isFastest: true, moduleType: type },
                { supplierId: 'f2', supplierName: 'Global Construções', totalAmount: 10800, deliveryDays: 10, itemsMatch: 95, isBestPrice: true, isFastest: false, moduleType: type }
            ];
            setOffers(mockOffers);
            setActiveTab('procurement');
        } finally {
            setIsComparing(false);
        }
    };

    if (!isOpen) return null;

    const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className={`fixed inset-0 z-[2000] bg-[#0b141a] flex flex-col transition-all duration-700 ${isTheaterMode ? 'p-0' : 'p-4 md:p-10'}`}>
            <div className={`bg-[#121b22] w-full max-w-7xl mx-auto h-full flex flex-col overflow-hidden border border-white/10 shadow-3xl ${isTheaterMode ? 'rounded-0' : 'rounded-[3.5rem]'}`}>
                
                {/* OFFICE HEADER */}
                <header className="px-10 py-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-[#075e54] gap-6 flex-shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="bg-[#25d366] p-3 rounded-2xl text-[#0b141a] shadow-xl">
                            <CurrencyDollarIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-white font-black uppercase italic tracking-tighter text-3xl">Escritório Estela <span className="text-[#25d366]">PhD</span></h2>
                            <p className="text-[10px] text-emerald-100/60 font-black uppercase tracking-[0.5em] mt-1">Gestão de Lucratividade Independente</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <button onClick={() => setActiveTab('cashflow')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cashflow' ? 'bg-[#25d366] text-black shadow-lg' : 'text-white/40'}`}>Fluxo de Caixa</button>
                        <button onClick={() => setActiveTab('procurement')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'procurement' ? 'bg-[#25d366] text-black shadow-lg' : 'text-white/40'}`}>Procurement</button>
                        <button onClick={() => setActiveTab('superintendent')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'superintendent' ? 'bg-[#25d366] text-black shadow-lg' : 'text-white/40'}`}>Superintendência</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsTheaterMode(!isTheaterMode)} className="w-12 h-12 rounded-2xl bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                            {isTheaterMode ? <MinusIcon className="w-6 h-6" /> : <ArrowsExpandIcon className="w-6 h-6" />}
                        </button>
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 text-white flex items-center justify-center text-4xl font-light hover:bg-red-500/20 transition-all">&times;</button>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto custom-scrollbar p-10 space-y-10 bg-[#0b141a]">
                    
                    {activeTab === 'cashflow' && (
                        <div className="animate-fadeIn space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-[#121b22] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Faturamento Office</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">{formatBRL(stats.totalInvoiced)}</p>
                                </div>
                                <div className="bg-[#121b22] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Insumos & Módulos</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">{formatBRL(stats.totalExpenses)}</p>
                                </div>
                                <div className="bg-[#075e54] p-8 rounded-[2.5rem] shadow-2xl border border-white/10 md:col-span-2 relative overflow-hidden">
                                    <div className="absolute -right-6 -bottom-6 opacity-10"><LogoIcon className="w-32 h-32" /></div>
                                    <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-2">Lucro Líquido Real (Office Profit)</p>
                                    <p className="text-5xl font-black text-white tracking-tighter">{formatBRL(stats.netProfit)}</p>
                                </div>
                            </div>

                            <div className="bg-[#121b22] p-10 rounded-[3rem] border border-white/5">
                                <h3 className="text-xl font-black text-white uppercase italic mb-8">Ativação de Módulos Funcionais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { id: 'pool', name: 'Módulo Piscina', desc: 'Bombas, Filtros e Hidro', icon: GlobeIcon },
                                        { id: 'bbq', name: 'Módulo Gourmet', desc: 'Churrasqueiras e Exaustão', icon: ToolsIcon },
                                        { id: 'slab', name: 'Lajes Técnicas', desc: 'Cálculo e Reforço Estrutural', icon: ShieldCheckIcon },
                                    ].map(mod => (
                                        <button 
                                            key={mod.id}
                                            onClick={() => handleFunctionalProcurement(mod.id as any)}
                                            className="group bg-white/5 hover:bg-[#25d366]/10 border border-white/5 hover:border-[#25d366]/30 p-8 rounded-[2.5rem] transition-all text-left relative overflow-hidden"
                                        >
                                            <div className="bg-[#25d366]/10 p-4 rounded-2xl text-[#25d366] w-fit mb-4 group-hover:scale-110 transition-transform">
                                                <mod.icon className="w-8 h-8" />
                                            </div>
                                            <h4 className="text-white font-black uppercase text-sm tracking-tight">{mod.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{mod.desc}</p>
                                            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TrendingUpIcon className="w-6 h-6 text-[#25d366]" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'procurement' && (
                        <div className="animate-fadeInUp space-y-8">
                             <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Comparativo de Insumos Funcionais</h3>
                                    <p className="text-[10px] text-[#25d366] font-black uppercase tracking-[0.4em] mt-2">Estela: Sincronia Real via Google Search</p>
                                </div>
                                {isComparing && <Spinner size="sm" />}
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {offers.map(offer => (
                                    <div key={offer.supplierId} className={`p-8 rounded-[3rem] border-2 transition-all relative overflow-hidden ${offer.isBestPrice ? 'border-[#25d366] bg-[#075e54]/10 shadow-2xl scale-[1.02]' : 'border-white/5 bg-white/5 opacity-80'}`}>
                                        <div className="flex items-center gap-5 mb-8">
                                            <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-[#25d366] shadow-xl border border-white/5">
                                                <StoreIcon className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black uppercase tracking-tight text-lg">{offer.supplierName}</h4>
                                                <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-widest mt-1">Especialista: {offer.moduleType?.toUpperCase()}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Investimento Total</span>
                                                <span className="text-2xl font-black text-white tracking-tighter">{formatBRL(offer.totalAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center px-4">
                                                <span className="text-[10px] font-black text-gray-500 uppercase">Prazo Logístico</span>
                                                <span className="text-xs font-black text-[#25d366]">{offer.deliveryDays} Dias Úteis</span>
                                            </div>
                                        </div>

                                        <button className="w-full bg-[#25d366] text-[#0b141a] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                                            <WhatsappIcon className="w-4 h-4" /> Solicitar Checkout Office
                                        </button>

                                        {offer.isBestPrice && (
                                            <div className="absolute top-6 right-6 bg-[#25d366] text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Best ROI</div>
                                        )}
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {activeTab === 'superintendent' && (
                        <div className="animate-fadeIn space-y-10">
                            <div className="bg-[#121b22] p-12 rounded-[4rem] border border-[#25d366]/20 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldCheckIcon className="w-48 h-48" /></div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Módulo de Superintendência</h3>
                                <p className="text-gray-400 text-sm max-w-2xl leading-relaxed mb-12">
                                    O Superintendente paga pelo acesso privilegiado ao Escritório da Estela. 
                                    Este acesso é **independente** da Iara e não interfere no fluxo de design do mestre.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:bg-[#25d366]/5 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><UserIcon className="w-8 h-8"/></div>
                                            <div>
                                                <p className="text-white font-black uppercase text-lg italic tracking-tight">Superintendente Geral</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Acesso Total • Auditoria de Margem • Checkout</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#25d366]/10 text-[#25d366] px-5 py-2.5 rounded-xl text-[9px] font-black uppercase border border-[#25d366]/20 tracking-widest">CONTA ATIVA</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2.5rem] border border-white/5 opacity-40">
                                        <div className="flex items-center gap-6">
                                            <div className="bg-gray-500/20 p-4 rounded-2xl text-gray-400"><UserIcon className="w-8 h-8"/></div>
                                            <div>
                                                <p className="text-white font-black uppercase text-lg italic tracking-tight">Investidor Externo</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Acesso Parcial • Visualização de ROI por Projeto</p>
                                            </div>
                                        </div>
                                        <button className="bg-white/10 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-[#25d366] hover:text-black transition-all">Liberar Slot</button>
                                    </div>
                                </div>

                                <div className="mt-16 p-10 bg-[#25d366]/5 rounded-[3rem] border border-[#25d366]/20 flex items-start gap-8">
                                    <InfoIcon className="w-10 h-10 text-[#25d366] flex-shrink-0" />
                                    <div>
                                        <h4 className="text-[#25d366] font-black uppercase text-base tracking-widest mb-3 italic">Política de Separação de Escritórios</h4>
                                        <p className="text-emerald-100/60 text-sm leading-relaxed">
                                            O Escritório Estela PhD funciona como um microsserviço faturado. Isso garante que o Superintendente possa monitorar o faturamento de várias marcenarias diferentes em um único dashboard unificado, mantendo a privacidade criativa de cada rascunho da Iara.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </main>

                <footer className="p-8 border-t border-white/5 bg-[#075e54] text-center flex-shrink-0">
                    <p className="text-[9px] text-emerald-100/40 font-bold uppercase tracking-[0.6em]">Estela Office Ecosystem • Sincronia Industrial S/A</p>
                </footer>
            </div>
        </div>
    );
};
