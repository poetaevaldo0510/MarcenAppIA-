
import React, { useState } from 'react';
import { LogoIcon, CheckIcon, Spinner, CurrencyDollarIcon } from './Shared';

interface StripeSimModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const StripeSimModal: React.FC<StripeSimModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubscribe = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            onSuccess();
        }, 2500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex justify-center items-center p-4 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-[#2d2424] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-[#f5f1e8] dark:bg-[#3e3535] p-8 text-center border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-4"><LogoIcon className="w-12 h-12" /></div>
                    <h2 className="text-2xl font-bold text-[#3e3535] dark:text-white">MarcenApp Pro</h2>
                    <p className="text-sm text-[#8a7e7e]">Projetos ilimitados e renderização ultra-rápida.</p>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="bg-green-100 text-green-600 p-1 rounded-full"><CheckIcon className="w-4 h-4" /></div>
                            <span>Renderizações simultâneas ilimitadas</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="bg-green-100 text-green-600 p-1 rounded-full"><CheckIcon className="w-4 h-4" /></div>
                            <span>Exportação PDF personalizada com seu logo</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="bg-green-100 text-green-600 p-1 rounded-full"><CheckIcon className="w-4 h-4" /></div>
                            <span>Suporte prioritário com Iara</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-center">
                        <span className="text-3xl font-black text-[#3e3535] dark:text-white">R$ 149,00</span>
                        <span className="text-sm text-gray-500 font-medium"> / mês</span>
                    </div>

                    <button 
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                        className="w-full bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg active:scale-95"
                    >
                        {isProcessing ? <Spinner size="sm" /> : <CurrencyDollarIcon />}
                        {isProcessing ? 'Conectando ao Stripe...' : 'Assinar Agora'}
                    </button>
                    
                    <button onClick={onClose} className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition">Continuar no plano grátis</button>
                    
                    <p className="text-[10px] text-center text-gray-400">Pagamento seguro via Stripe. Cancele quando quiser.</p>
                </div>
            </div>
        </div>
    );
};
