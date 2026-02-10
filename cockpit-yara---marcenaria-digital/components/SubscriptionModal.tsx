
import React, { useState } from 'react';
import { LogoIcon, CheckIcon, Spinner, TicketIcon, StarIcon, LockIcon } from './Shared';
import type { UserProfile, SubscriptionTier } from '../types';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    onSuccess: (tier: SubscriptionTier) => void;
}

const PLANS = [
    { 
        id: 'essencial' as SubscriptionTier, 
        name: 'Plano Essencial', 
        price: 'R$ 149', 
        period: '/mês',
        description: 'Capacidade para até 30 projetos completos.',
        features: [
            '30 Créditos de Renderização/mês',
            'Gestão de Carteira de Clientes',
            'Exportação de BOM e Plano de Corte',
            'Dossiê PDF com Marca D\'água Profissional',
            'Suporte Técnico Prioritário'
        ]
    },
    { 
        id: 'pro' as SubscriptionTier, 
        name: 'Operação Master Pro', 
        price: 'R$ 297', 
        period: '/mês',
        highlighted: true,
        description: 'Para alta demanda de produção digital.',
        features: [
            '80 Créditos de Renderização/mês',
            'Personalização Completa (Sem Logomarca MarcenApp)',
            'Consultoria IA de Engenharia Avançada',
            'Acesso ao Estúdio de Refino 8K Ilimitado',
            'Prioridade Total na Fila de Processamento'
        ]
    },
    { 
        id: 'master' as SubscriptionTier, 
        name: 'Enterprise / Agência', 
        price: 'Sob Consulta', 
        period: '',
        description: 'Operações em escala com múltiplos usuários.',
        features: [
            'Créditos Ilimitados sob Demanda',
            'Painel de Gestão de Equipe (Operadores)',
            'Integração via API com ERP de Marcenaria',
            'Gerente de Conta Dedicado'
        ]
    }
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, userProfile, onSuccess }) => {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [stripeStatus, setStripeStatus] = useState<string>('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const handleSubscribe = async (tier: SubscriptionTier) => {
        if (!userProfile) return;
        setIsProcessing(tier);
        
        setStripeStatus('Abrindo Gateway Seguro...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setStripeStatus('Processando Assinatura...');
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setPaymentSuccess(true);
        setStripeStatus('Assinatura Ativada!');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsProcessing(null);
        setPaymentSuccess(false);
        onSuccess(tier);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[150] flex justify-center items-center p-4 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#2d2424] rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-8 text-center border-b border-gray-100 dark:border-white/5 bg-[#f5f1e8] dark:bg-[#3e3535] relative">
                    <button onClick={onClose} className="absolute top-6 right-8 text-3xl text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                    <div className="flex justify-center mb-4"><StarIcon isFavorite className="w-12 h-12 text-[#b99256]" /></div>
                    <h2 className="text-3xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Mensalidade Operacional</h2>
                    <p className="text-[#8a7e7e] mt-2 font-medium max-w-lg mx-auto">Sua oficina digital de alta performance. Ative o plano ideal para sua demanda mensal.</p>
                </header>

                <main className="p-8 lg:p-12 overflow-y-auto custom-scrollbar flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {PLANS.map(plan => {
                            const isCurrent = userProfile?.subscriptionPlan === plan.id;
                            const isThisProcessing = isProcessing === plan.id;

                            return (
                                <div key={plan.id} className={`relative p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col ${plan.highlighted ? 'border-[#d4ac6e] bg-white dark:bg-[#4a4040] shadow-2xl scale-105 z-10' : 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 opacity-90'}`}>
                                    {plan.highlighted && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4ac6e] text-[#3e3535] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                            Recomendado para Operadores
                                        </div>
                                    )}
                                    
                                    <h3 className="text-lg font-black text-[#3e3535] dark:text-white uppercase tracking-widest mb-1">{plan.name}</h3>
                                    <p className="text-[10px] text-[#8a7e7e] dark:text-[#a89d8d] mb-6 font-bold uppercase">{plan.description}</p>
                                    
                                    <div className="mb-8 flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-[#3e3535] dark:text-white tracking-tighter">{plan.price}</span>
                                        <span className="text-gray-400 text-sm font-bold">{plan.period}</span>
                                    </div>

                                    <ul className="space-y-4 mb-10 flex-grow">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-xs text-[#6a5f5f] dark:text-[#c7bca9] font-medium leading-tight">
                                                <div className="bg-[#d4ac6e]/20 p-1 rounded-full text-[#b99256]"><CheckIcon className="w-3 h-3" /></div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button 
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={!!isProcessing || isCurrent}
                                        className={`w-full py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] ${
                                            isCurrent ? 'bg-green-500 text-white cursor-default' : 
                                            paymentSuccess && isThisProcessing ? 'bg-green-600 text-white shadow-inner' :
                                            plan.highlighted ? 'bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] shadow-xl' : 'bg-white dark:bg-[#3e3535] border border-gray-200 dark:border-white/10 text-[#3e3535] dark:text-white'
                                        }`}
                                    >
                                        {isThisProcessing ? (
                                            paymentSuccess ? <><CheckIcon className="w-4 h-4" /> {stripeStatus}</> : <><Spinner size="sm" /> {stripeStatus}</>
                                        ) : isCurrent ? 'Plano Ativo' : 'Ativar Assinatura'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-10 opacity-60">
                        <div className="flex items-center gap-3">
                            <LockIcon className="w-5 h-5 text-[#b99256]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Cobrança Mensal Recorrente</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <TicketIcon className="w-5 h-5 text-[#b99256]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Renovação Automática de Créditos</span>
                        </div>
                    </div>
                </main>
                
                <footer className="p-6 bg-[#f5f1e8] dark:bg-[#1a1414] text-center border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-2">
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.3em]">Criptografia Segura • Faturamento Automático MarcenApp</p>
                </footer>
            </div>
        </div>
    );
};
