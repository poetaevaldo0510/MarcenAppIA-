
import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { saveCarpenterProfile, getCarpenterProfile } from '../services/historyService';
import { UserIcon, CameraIcon, Spinner, CheckIcon, ToolsIcon, SparklesIcon, TrendingUpIcon, LogoIcon } from './Shared';
import { fileToBase64, validateMediaFile } from '../utils/helpers';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: UserProfile) => void;
    showAlert: (message: string, title?: string) => void;
    embeddedView?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, showAlert, embeddedView = false }) => {
    const [profile, setProfile] = useState<UserProfile>({
        id: 'current', businessName: '', fullName: '', phone: '', email: '', role: 'marceneiro',
        credits: 0, subscriptionPlan: 'free', logo: '', carpenterDNA: '', learnedInsights: [], neuralSyncLevel: 10
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen || embeddedView) getCarpenterProfile().then(saved => saved && setProfile(saved));
    }, [isOpen, embeddedView]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!profile.businessName.trim()) newErrors.businessName = "Nome da oficina é essencial.";
        if (!profile.fullName.trim()) newErrors.fullName = "Nome do mestre é obrigatório.";
        if (!profile.phone.trim()) newErrors.phone = "WhatsApp é obrigatório.";
        if (!profile.email.trim()) newErrors.email = "E-mail é obrigatório.";
        else if (!emailRegex.test(profile.email)) newErrors.email = "E-mail inválido.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsLoading(true);
        try {
            await saveCarpenterProfile(profile);
            onSave(profile);
            if(!embeddedView) onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof UserProfile, value: any) => {
        setProfile({ ...profile, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    if (!isOpen && !embeddedView) return null;

    const Content = (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a]">
            <header className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-[#f8f9fa] dark:bg-[#111]">
                <h2 className="text-2xl font-black uppercase italic">Perfil do Mestre</h2>
                {!embeddedView && <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl">&times;</button>}
            </header>

            <div className="flex-grow overflow-y-auto p-8 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Oficina</label>
                            <input value={profile.businessName} onChange={e => handleInputChange('businessName', e.target.value)} className={`w-full bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border text-sm font-bold ${errors.businessName ? 'border-red-500 ring-1 ring-red-500/20' : 'border-transparent'}`} />
                            {errors.businessName && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.businessName}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Nome do Mestre</label>
                            <input value={profile.fullName} onChange={e => handleInputChange('fullName', e.target.value)} className={`w-full bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border text-sm font-bold ${errors.fullName ? 'border-red-500 ring-1 ring-red-500/20' : 'border-transparent'}`} />
                            {errors.fullName && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.fullName}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">WhatsApp</label>
                            <input value={profile.phone} onChange={e => handleInputChange('phone', e.target.value)} className={`w-full bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border text-sm font-bold ${errors.phone ? 'border-red-500 ring-1 ring-red-500/20' : 'border-transparent'}`} />
                            {errors.phone && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">E-mail</label>
                            <input value={profile.email} onChange={e => handleInputChange('email', e.target.value)} className={`w-full bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border text-sm font-bold ${errors.email ? 'border-red-500 ring-1 ring-red-500/20' : 'border-transparent'}`} />
                            {errors.email && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.email}</p>}
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-[#d4ac6e] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl">
                        {isLoading ? <Spinner size="sm" /> : 'Salvar Perfil'}
                    </button>
                </form>
            </div>
        </div>
    );

    return embeddedView ? Content : (
        <div className="fixed inset-0 bg-black/90 z-[500] flex justify-center items-center p-4 backdrop-blur-xl">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[3.5rem] w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-scaleIn">
                {Content}
            </div>
        </div>
    );
};
