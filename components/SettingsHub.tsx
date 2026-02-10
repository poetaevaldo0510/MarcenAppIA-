
import React, { useState, useEffect } from 'react';
import { CogIcon, UserIcon, StoreIcon, ArrowLeftIcon, LogoIcon, ShieldCheckIcon, SparklesIcon, CurrencyDollarIcon, CameraIcon, WhatsappIcon, TrendingUpIcon, ToolsIcon, GlobeIcon, MicIcon, InfoIcon, Cloud, TicketIcon, Spinner, CheckIcon } from './Shared';
import { refillMasterCredits } from '../services/historyService';
import { fileToBase64, validateMediaFile } from '../utils/helpers';
import type { UserProfile } from '../types';

interface SettingsHubProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onSaveProfile: (profile: UserProfile) => void;
    showAlert: (msg: string) => void;
}

export const SettingsHub: React.FC<SettingsHubProps> = ({ isOpen, onClose, profile, onSaveProfile, showAlert }) => {
    const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'production' | 'billing'>('main');
    const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setLocalProfile(profile);
            setErrors({});
            setActiveSection('main');
        }
    }, [isOpen, profile]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!localProfile.businessName?.trim()) newErrors.businessName = "Nome da oficina obrigatório.";
        if (!localProfile.email?.trim() || !emailRegex.test(localProfile.email)) newErrors.email = "E-mail válido obrigatório.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSaveProfile(localProfile);
        setActiveSection('main');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[3000] flex justify-center items-center p-4 backdrop-blur-xl">
            <div className="bg-[#111] border border-white/10 rounded-[3.5rem] w-full max-w-lg h-[80vh] flex flex-col overflow-hidden animate-scaleIn">
                <header className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Hub de Oficina</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl">&times;</button>
                </header>
                <main className="flex-grow overflow-y-auto p-8 space-y-6">
                    {activeSection === 'main' ? (
                        <div className="space-y-4">
                            <button onClick={() => setActiveSection('profile')} className="w-full p-6 bg-white/5 rounded-3xl text-left hover:bg-white/10 transition-all border border-white/5">
                                <p className="text-white font-black uppercase text-xs">Dados do Mestre</p>
                                <p className="text-[10px] text-gray-500 mt-1">Marca, E-mail e Identidade</p>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Sua Marca</label>
                                <input value={localProfile.businessName} onChange={e => {setLocalProfile({...localProfile, businessName: e.target.value}); setErrors({});}} className={`w-full bg-black p-4 rounded-xl border ${errors.businessName ? 'border-red-500' : 'border-white/5 text-white'}`} />
                                {errors.businessName && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.businessName}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-2">E-mail Profissional</label>
                                <input value={localProfile.email} onChange={e => {setLocalProfile({...localProfile, email: e.target.value}); setErrors({});}} className={`w-full bg-black p-4 rounded-xl border ${errors.email ? 'border-red-500' : 'border-white/5 text-white'}`} />
                                {errors.email && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.email}</p>}
                            </div>
                            <button onClick={handleSave} className="w-full bg-[#d4ac6e] text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]">Sincronizar Hub</button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
