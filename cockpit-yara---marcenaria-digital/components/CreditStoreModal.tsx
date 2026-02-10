
import React, { useState } from 'react';
import { LogoIcon, CheckIcon, Spinner, TicketIcon, SparklesIcon, CubeIcon } from './Shared';
import { addCredits } from '../services/historyService';

interface CreditStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newTotal: number) => void;
}

const CREDIT_PACKS = [
    { id: 'start', name: 'Pack Bronze', credits: 10, price: 'R$ 49', bonus: 'Entrada Facilitada', renders: 'Até 10 Projetos' },
    { id: 'pro', name: 'Pack Prata', credits: 50, price: 'R$ 189', bonus: '+5 Créditos Bônus', highlighted: true, renders: 'Até 55 Projetos' },
    { id: 'expert', name: 'Pack Ouro', credits: 150, price: 'R$ 399', bonus: '+20 Créditos Bônus', renders: 'Até 170 Projetos' },
];

export const CreditStoreModal: React.FC<CreditStoreModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePurchase = async (amount: number) => {
        setIsProcessing(true);
        // Simulação de gateway de pagamento
        setTimeout(async () => {
            const newTotal = await addCredits(amount);
            setIsProcessing(false);
            onSuccess(newTotal);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-[#2d2424] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="bg-[#f5f1e8] dark:bg-[#3e3535] p-8 text-center border-b border-gray-200 dark:border-gray-700 relative">
                    <button onClick={onClose} className="absolute top-4 right-6 text-2xl text-gray-400">&times;</button>
                    <div className="flex justify-center mb-4"><TicketIcon className="w-12 h-12 text-[#b99256]" /></div>
                    <h2 className="text-3xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter">Recarga de Créditos Avulsos</h2>
                    <p className="text-[#8a7e7e] mt-2 font-medium">Ideal para picos de demanda ou testes iniciais de operação.</p>
                </header>
                
                <main className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {CREDIT_PACKS.map(pack => (
                            <div key={pack.id} className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center transition-all ${pack.highlighted ? 'border-[#d4ac6e] bg-[#fdfaf5] dark:bg-[#4a4040] shadow-xl scale-105' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-[#3e3535]'}`}>
                                {pack.highlighted && <span className="bg-[#d4ac6e] text-[#3e3535] text-[10px] font-black px-3 py-1 rounded-full uppercase mb-4 tracking-widest">Mais Vantajoso</span>}
                                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-widest">{pack.name}</h3>
                                
                                <div className="my-4">
                                    <p className="text-5xl font-black text-[#3e3535] dark:text-white leading-none">{pack.credits}</p>
                                    <p className="text-[10px] font-black text-[#b99256] uppercase mt-2 tracking-widest">Créditos</p>
                                </div>

                                <div className="bg-[#f5f1e8] dark:bg-black/20 px-4 py-2 rounded-full mb-6 flex items-center gap-2">
                                    <CubeIcon className="w-3 h-3 text-[#b99256]" />
                                    <span className="text-[11px] font-bold text-[#3e3535] dark:text-white italic">{pack.renders}</span>
                                </div>

                                <p className="text-xs font-bold text-[#b99256] mb-6">{pack.bonus}</p>
                                <div className="text-2xl font-black text-[#3e3535] dark:text-white mb-8">{pack.price}</div>
                                
                                <button 
                                    onClick={() => handlePurchase(pack.credits)}
                                    disabled={isProcessing}
                                    className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${pack.highlighted ? 'bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535]' : 'bg-gray-100 dark:bg-[#2d2424] text-[#3e3535] dark:text-white hover:bg-gray-200'}`}
                                >
                                    {isProcessing ? <Spinner size="sm" /> : 'Comprar Agora'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 bg-[#f0e9dc]/40 dark:bg-[#4a4040]/30 p-6 rounded-2xl border-2 border-dashed border-[#d4ac6e]/30 flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-[#d4ac6e] p-3 rounded-2xl text-[#3e3535] flex-shrink-0"><SparklesIcon className="w-6 h-6" /></div>
                        <div className="text-center md:text-left">
                            <h4 className="font-bold text-[#3e3535] dark:text-white uppercase text-xs tracking-widest mb-1">Modelo de Operação</h4>
                            <p className="text-xs text-[#6a5f5f] dark:text-[#c7bca9] leading-relaxed">
                                Os créditos avulsos nunca expiram. Você pode usá-los para atender as demandas passadas pelo Administrador com flexibilidade total. Cada crédito garante um projeto com render 8K e toda documentação técnica.
                            </p>
                        </div>
                    </div>
                </main>
                
                <footer className="p-6 bg-gray-50 dark:bg-[#1a1414] text-center border-t border-gray-100 dark:border-white/5">
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Liberação Imediata após confirmação de pagamento</p>
                </footer>
            </div>
        </div>
    );
};
