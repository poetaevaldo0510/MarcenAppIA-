
import React, { useState, useEffect } from 'react';
import { CheckIcon, InfoIcon } from './Shared';

interface LGPDConsentProps {
    onAccept: () => void;
}

export const LGPDConsent: React.FC<LGPDConsentProps> = ({ onAccept }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('marcenapp_lgpd');
        if (!consent) {
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('marcenapp_lgpd', Date.now().toString());
        setIsVisible(false);
        onAccept();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[100] animate-fadeInUp">
            <div className="bg-[#3e3535] dark:bg-[#1a1414] text-white p-6 rounded-3xl shadow-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6 max-w-5xl mx-auto">
                <div className="bg-[#d4ac6e]/20 p-4 rounded-2xl hidden md:block">
                    <InfoIcon className="text-[#d4ac6e] w-8 h-8" />
                </div>
                <div className="flex-grow text-center md:text-left">
                    <h3 className="font-bold text-lg mb-1 flex items-center justify-center md:justify-start gap-2">
                        Privacidade e Segurança (LGPD)
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Utilizamos tecnologias essenciais para o funcionamento da Iara e para personalizar sua experiência. Ao continuar, você concorda com nossa Política de Privacidade e o processamento de seus dados para fins de design e gestão de projetos.
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleAccept}
                        className="flex-1 md:flex-none bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-black py-3 px-8 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <CheckIcon className="w-5 h-5" /> Concordo e Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};
