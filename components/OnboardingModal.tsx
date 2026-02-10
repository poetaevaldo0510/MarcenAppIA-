
import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import { LogoIcon, Spinner, CheckIcon, SparklesIcon, ToolsIcon, UserIcon, GlobeIcon, StoreIcon } from './Shared';

interface OnboardingModalProps {
    isOpen: boolean;
    userEmail: string;
    onComplete: (profile: Partial<UserProfile>) => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, userEmail, onComplete }) => {
    const [step, setStep] = useState<'personal' | 'business' | 'setup' | 'success'>('personal');
    const [formData, setFormData] = useState({ fullName: '', businessName: '', city: '', state: 'SP' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (step === 'personal' && !formData.fullName.trim()) newErrors.fullName = "Precisamos do seu nome.";
        if (step === 'business' && !formData.businessName.trim()) newErrors.businessName = "Nome da oficina é obrigatório.";
        if (step === 'setup' && !formData.city.trim()) newErrors.city = "Cidade é necessária.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (step === 'personal') setStep('business');
        else if (step === 'business') setStep('setup');
        else handleFinish();
    };

    const handleFinish = async () => {
        setIsLoading(true);
        await onComplete({ ...formData, onboardingCompleted: true });
        setStep('success');
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#f5f1e8]/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-[#e6ddcd] overflow-hidden">
                <header className="p-8 border-b border-[#e6ddcd] text-center">
                    <LogoIcon className="w-10 h-10 text-[#3e3535] mx-auto mb-4" />
                    <h2 className="text-xl font-black uppercase italic">Configurar Oficina</h2>
                </header>
                <main className="p-10 space-y-6">
                    {step === 'personal' && (
                        <div className="space-y-4 animate-fadeIn">
                            <label className="text-[10px] font-black uppercase text-gray-400">Seu Nome Completo</label>
                            <input value={formData.fullName} onChange={e => {setFormData({...formData, fullName: e.target.value}); setErrors({});}} className={`w-full bg-[#fcfaf7] border-2 p-5 rounded-2xl outline-none transition-all ${errors.fullName ? 'border-red-500' : 'border-[#e6ddcd] focus:border-[#d4ac6e]'}`} />
                            {errors.fullName && <p className="text-red-500 text-[9px] font-black uppercase ml-2">{errors.fullName}</p>}
                        </div>
                    )}
                    {step === 'business' && (
                        <div className="space-y-4 animate-fadeIn">
                            <label className="text-[10px] font-black uppercase text-gray-400">Nome da Oficina</label>
                            <input value={formData.businessName} onChange={e => {setFormData({...formData, businessName: e.target.value}); setErrors({});}} className={`w-full bg-[#fcfaf7] border-2 p-5 rounded-2xl outline-none transition-all ${errors.businessName ? 'border-red-500' : 'border-[#e6ddcd] focus:border-[#d4ac6e]'}`} />
                            {errors.businessName && <p className="text-red-500 text-[9px] font-black uppercase ml-2">{errors.businessName}</p>}
                        </div>
                    )}
                    {step === 'setup' && (
                        <div className="space-y-4 animate-fadeIn">
                            <label className="text-[10px] font-black uppercase text-gray-400">Sua Cidade</label>
                            <input value={formData.city} onChange={e => {setFormData({...formData, city: e.target.value}); setErrors({});}} className={`w-full bg-[#fcfaf7] border-2 p-5 rounded-2xl outline-none transition-all ${errors.city ? 'border-red-500' : 'border-[#e6ddcd] focus:border-[#d4ac6e]'}`} />
                            {errors.city && <p className="text-red-500 text-[9px] font-black uppercase ml-2">{errors.city}</p>}
                        </div>
                    )}
                    {step !== 'success' && (
                        <button onClick={handleNext} disabled={isLoading} className="w-full bg-[#3e3535] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                            {isLoading ? <Spinner size="sm" /> : 'Próximo Passo'}
                        </button>
                    )}
                </main>
            </div>
        </div>
    );
};
