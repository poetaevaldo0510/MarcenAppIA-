
import React from 'react';
import { WhatsappIcon, CheckIcon, GlobeIcon, TicketIcon, LogoIcon } from './Shared';

interface WhatsAppGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WhatsAppGuideModal: React.FC<WhatsAppGuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const steps = [
        {
            title: "1. Criar App na Meta",
            desc: "Acesse developers.facebook.com, crie um app do tipo 'Business' e adicione o produto 'WhatsApp'.",
            icon: GlobeIcon
        },
        {
            title: "2. Configurar Número",
            desc: "No painel do WhatsApp, adicione um número de telefone para envio ou use o número de teste fornecido pela Meta.",
            icon: WhatsappIcon
        },
        {
            title: "3. Obter IDs",
            desc: "Copie o 'Phone Number ID' e gere um 'Permanent Access Token' nas configurações de sistema do Business Manager.",
            icon: TicketIcon
        },
        {
            title: "4. Configurar Webhook",
            desc: "Aponte o Webhook para o endereço indicado no seu perfil do MarcenApp para que a Iara receba as mensagens.",
            icon: CheckIcon
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/90 z-[250] flex justify-center items-center p-4 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#1a1414] rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-white/5 animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-8 text-center bg-[#f5f1e8] dark:bg-[#2d2424] border-b border-[#e6ddcd] dark:border-white/5">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-500 p-4 rounded-2xl text-white shadow-lg animate-pulse">
                            <WhatsappIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Guia de Automação WhatsApp</h2>
                    <p className="text-xs text-[#8a7e7e] mt-1 font-bold uppercase tracking-widest">Transforme seu WhatsApp em uma ferramenta de vendas</p>
                </header>

                <main className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="space-y-6">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 group">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#f0e9dc] dark:bg-[#3e3535] flex items-center justify-center text-[#b99256] font-black border border-[#e6ddcd] dark:border-white/5 group-hover:bg-[#d4ac6e] group-hover:text-white transition-all">
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-[#3e3535] dark:text-white uppercase tracking-widest">{step.title}</h4>
                                    <p className="text-xs text-[#8a7e7e] leading-relaxed mt-1">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                        <h4 className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-400 mb-2 tracking-widest">💡 Por que configurar?</h4>
                        <p className="text-xs text-blue-700/80 dark:text-blue-300 leading-relaxed">
                            Com a API conectada, o MarcenApp pode enviar o PDF do orçamento direto para o cliente, notificar você sobre novos pedidos e até responder dúvidas básicas usando a inteligência da Iara 24 horas por dia.
                        </p>
                    </div>
                </main>

                <footer className="p-6 bg-gray-50 dark:bg-[#2d2424] border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-4">
                    <a 
                        href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-[#b99256] hover:underline uppercase tracking-[0.2em]"
                    >
                        Abrir Documentação Oficial da Meta
                    </a>
                    <button onClick={onClose} className="w-full bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px]">
                        Entendi, vou configurar
                    </button>
                </footer>
            </div>
        </div>
    );
};
