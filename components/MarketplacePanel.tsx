
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCartIcon, CheckIcon, Spinner, StoreIcon, CurrencyDollarIcon, ToolsIcon, InfoIcon, GlobeIcon, LogoIcon, MapPin, WhatsappIcon, SearchIcon, SparklesIcon } from './Shared';
import { researchBOMPrices } from '../services/geminiService';
import type { ProjectHistoryItem, UserProfile, LocationState } from '../types';

interface MarketplacePanelProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem | null;
    userProfile: UserProfile | null;
}

export const MarketplacePanel: React.FC<MarketplacePanelProps> = ({ isOpen, onClose, project, userProfile }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [offers, setOffers] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState<string | null>(null);
    const [location, setLocation] = useState<LocationState | null>(null);
    const [isOrderLoading, setIsOrderLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && project?.bom) {
            handleInitialResearch();
        }
    }, [isOpen, project]);

    const handleInitialResearch = async () => {
        setIsSearching(true);
        setOffers([]);
        
        // Pega localização do usuário
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                setLocation(loc);
                await runPriceRadar(loc);
            },
            async () => {
                await runPriceRadar(null);
            }
        );
    };

    const runPriceRadar = async (loc: LocationState | null) => {
        if (!project?.bom) return;
        try {
            const result = await researchBOMPrices(project.bom, loc);
            setOffers(result.comparison || []);
            if (result.comparison?.length > 0) setSelectedStore(result.comparison[0].store);
        } catch (e) {
            console.error("Price Radar Error", e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendWhatsAppQuote = (storeName: string, price: number) => {
        if (!project) return;
        
        const bomText = project.bom || "Lista técnica não especificada.";
        const message = `*SOLICITAÇÃO DE COTAÇÃO - ${userProfile?.businessName || 'OFICINA DIGITAL'}*\n\n` +
            `Olá, equipe da *${storeName}*!\n` +
            `Gostaria de cotar os seguintes materiais para o projeto *${project.name}*:\n\n` +
            `${bomText}\n\n` +
            `*Valor Estimado pela Iara IA:* R$ ${price.toFixed(2)}\n\n` +
            `Aguardo retorno sobre disponibilidade e faturamento. Obrigado!`;

        const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    };

    const materialsCount = useMemo(() => {
        if (!project?.bom) return 0;
        return project.bom.split('\n').filter(line => line.includes('-') || line.includes('|')).length;
    }, [project]);

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex justify-end animate-fadeIn" onClick={onClose}>
            <div 
                className="w-full max-w-xl bg-[#fdfaf5] h-full shadow-[-40px_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-slideInRight overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-10 border-b border-gray-100 bg-white relative">
                    <div className="flex justify-between items-center mb-8">
                        <div className="bg-[#3e3535] p-4 rounded-[1.5rem] text-[#d4ac6e] shadow-2xl relative">
                             <ShoppingCartIcon className="w-7 h-7" />
                             {isSearching && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>}
                        </div>
                        <button onClick={onClose} className="text-gray-300 hover:text-red-500 text-4xl transition-all">&times;</button>
                    </div>
                    <h2 className="text-3xl font-black text-[#3e3535] uppercase tracking-tighter italic leading-none">Iara <span className="text-[#d4ac6e]">Price Radar</span></h2>
                    <p className="text-[10px] text-[#b99256] mt-2 font-black uppercase tracking-[0.3em]">Cotação Inteligente & Menor Preço</p>
                </header>

                <main className="flex-grow overflow-y-auto p-10 custom-scrollbar space-y-10">
                    
                    {isSearching ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#d4ac6e]/10 blur-[40px] rounded-full scale-[2] animate-pulse"></div>
                                <Spinner size="lg" />
                            </div>
                            <div>
                                <p className="text-lg font-black uppercase italic tracking-tighter text-[#3e3535]">Varrendo Lojas...</p>
                                <p className="text-[9px] text-[#b99256] font-black uppercase tracking-[0.4em] mt-2 animate-pulse">Sincronia via Google Grounding Ativa</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl flex items-center gap-6 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-[#fdfaf5] rounded-bl-[5rem] -mr-12 -mt-12 transition-all group-hover:scale-150 group-hover:bg-[#d4ac6e]/10"></div>
                                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-50 border-4 border-[#f5f1e8] shadow-inner relative z-10">
                                    <img src={project.views3d[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-[#b99256] uppercase tracking-widest mb-1">Dossiê de Materiais:</p>
                                    <h4 className="text-lg font-black text-[#3e3535] uppercase italic tracking-tighter truncate max-w-[250px]">{project.name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-[#f0e9dc] text-[#3e3535] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{materialsCount} Itens Técnicos</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-end px-2">
                                    <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Oportunidades de Compra</h3>
                                    <div className="flex items-center gap-2">
                                        <GlobeIcon className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase">Preços em Tempo Real</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {offers.length === 0 ? (
                                        <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-gray-200 text-center opacity-40">
                                            <SearchIcon className="w-10 h-10 mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase">Nenhum fornecedor local mapeado para esta BOM.</p>
                                        </div>
                                    ) : (
                                        offers.map((offer, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setSelectedStore(offer.store)}
                                                className={`w-full p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group relative overflow-hidden ${selectedStore === offer.store ? 'border-emerald-500 bg-emerald-50/50 shadow-2xl scale-[1.02]' : 'border-white bg-white hover:border-gray-100'}`}
                                            >
                                                <div className="flex items-center gap-5 relative z-10">
                                                    <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center transition-transform group-hover:rotate-6 ${selectedStore === offer.store ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <StoreIcon className="w-7 h-7" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black text-[#3e3535] uppercase tracking-tight">{offer.store}</p>
                                                        <p className="text-[10px] text-emerald-600 font-black uppercase mt-0.5">{offer.highlights || 'Preço Competitivo'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right relative z-10">
                                                    <p className="text-xl font-black text-[#3e3535] tracking-tighter">R$ {offer.totalPrice?.toFixed(2)}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Preço Estimado</p>
                                                </div>
                                                {selectedStore === offer.store && (
                                                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500 rounded-tl-full opacity-5 -mr-16 -mb-16"></div>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {selectedStore && (
                                <div className="bg-[#3e3535] p-10 rounded-[3.5rem] text-white space-y-8 relative overflow-hidden shadow-3xl animate-fadeInUp">
                                    <div className="absolute -right-16 -bottom-16 opacity-5 rotate-12">
                                        <LogoIcon className="w-64 h-64" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4ac6e] mb-4 flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4" /> Inteligência de Negociação
                                        </h3>
                                        <p className="text-sm font-medium leading-relaxed italic opacity-80">
                                            "Mestre, identificamos que a *{selectedStore}* possui o melhor estoque para as suas medidas. O plano de corte está otimizado para as chapas deles."
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleSendWhatsAppQuote(selectedStore, offers.find(o => o.store === selectedStore)?.totalPrice || 0)}
                                        className="w-full bg-[#25d366] text-white font-black py-6 rounded-[2.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
                                    >
                                        <WhatsappIcon className="w-6 h-6" /> Cotar via WhatsApp
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><InfoIcon className="w-5 h-5" /></div>
                        <p className="text-[11px] text-blue-800 leading-relaxed font-bold uppercase tracking-tight">
                            Os valores apresentados são baseados em varredura pública de mercado e Grounding AI. Sempre confirme a disponibilidade de estoque com o vendedor antes de finalizar o pagamento.
                        </p>
                    </div>
                </main>

                <footer className="p-10 bg-white border-t border-gray-100 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.6em]">Iara Grounding Ecosystem • v15.5 Pro</p>
                </footer>
            </div>
        </div>
    );
};
