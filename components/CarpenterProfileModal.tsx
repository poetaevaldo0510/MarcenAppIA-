
import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { saveCarpenterProfile, getCarpenterProfile } from '../services/historyService';
import { UserIcon, CameraIcon, Spinner, CheckIcon } from './Shared';
import { fileToBase64 } from '../utils/helpers';

interface CarpenterProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: UserProfile) => void;
}

export const CarpenterProfileModal: React.FC<CarpenterProfileModalProps> = ({ isOpen, onClose, onSave }) => {
    const [profile, setProfile] = useState<UserProfile>({
        id: 'current',
        businessName: '',
        fullName: '',
        phone: '',
        email: '',
        role: 'marceneiro',
        credits: 0,
        referralCode: '',
        instagram: '',
        logo: '',
        subscriptionPlan: 'free'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            getCarpenterProfile().then(saved => {
                if (saved) setProfile(saved);
            });
            setErrors({});
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!profile.businessName.trim()) newErrors.businessName = "Nome da oficina é obrigatório.";
        if (!profile.fullName.trim()) newErrors.fullName = "Seu nome é obrigatório.";
        if (!profile.phone.trim()) newErrors.phone = "WhatsApp para contato é essencial.";
        if (!profile.email.trim()) {
            newErrors.email = "E-mail é obrigatório.";
        } else if (!emailRegex.test(profile.email)) {
            newErrors.email = "Formato de e-mail inválido.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                alert("Apenas arquivos de imagem são permitidos.");
                return;
            }
            const result = await fileToBase64(file);
            setProfile(prev => ({ ...prev, logo: result.full }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsLoading(true);
        try {
            await saveCarpenterProfile(profile);
            onSave(profile);
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                onClose();
            }, 1500);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex justify-center items-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#3e3535] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#f5f1e8] dark:bg-[#2d2424]">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                        <UserIcon className="w-6 h-6" /> Perfil Profissional
                    </h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] text-2xl">&times;</button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-[#d4ac6e] flex items-center justify-center bg-[#f5f1e8] dark:bg-[#2d2424]">
                            {profile.logo ? (
                                <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <CameraIcon className="w-8 h-8 text-[#a89d8d]" />
                            )}
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <p className="text-[10px] text-[#8a7e7e] uppercase font-bold tracking-widest">Seu Logotipo Oficial</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#6a5f5f] dark:text-[#a89d8d] uppercase ml-1">Nome da Marcenaria</label>
                            <input 
                                type="text" name="businessName" value={profile.businessName} onChange={handleInputChange} 
                                placeholder="Ex: Marcenaria de Luxo" 
                                className={`w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded-xl border-2 outline-none transition-all ${errors.businessName ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#e6ddcd] dark:border-[#4a4040] focus:border-[#d4ac6e]'}`} 
                            />
                            {errors.businessName && <p className="text-red-500 text-[9px] font-black uppercase ml-1 animate-fadeIn">{errors.businessName}</p>}
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#6a5f5f] dark:text-[#a89d8d] uppercase ml-1">Seu Nome Completo</label>
                            <input 
                                type="text" name="fullName" value={profile.fullName} onChange={handleInputChange} 
                                placeholder="Seu Nome" 
                                className={`w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded-xl border-2 outline-none transition-all ${errors.fullName ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#e6ddcd] dark:border-[#4a4040] focus:border-[#d4ac6e]'}`} 
                            />
                            {errors.fullName && <p className="text-red-500 text-[9px] font-black uppercase ml-1 animate-fadeIn">{errors.fullName}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[#6a5f5f] dark:text-[#a89d8d] uppercase ml-1">WhatsApp</label>
                                <input 
                                    type="tel" name="phone" value={profile.phone} onChange={handleInputChange} 
                                    placeholder="(11) 99999-9999" 
                                    className={`w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded-xl border-2 outline-none transition-all ${errors.phone ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#e6ddcd] dark:border-[#4a4040] focus:border-[#d4ac6e]'}`} 
                                />
                                {errors.phone && <p className="text-red-500 text-[9px] font-black uppercase ml-1 animate-fadeIn">{errors.phone}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[#6a5f5f] dark:text-[#a89d8d] uppercase ml-1">Instagram</label>
                                <input 
                                    type="text" name="instagram" value={profile.instagram || ''} onChange={handleInputChange} 
                                    placeholder="@marcenaria" 
                                    className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded-xl border-2 border-[#e6ddcd] dark:border-[#4a4040] focus:border-[#d4ac6e] outline-none" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#6a5f5f] dark:text-[#a89d8d] uppercase ml-1">E-mail Profissional</label>
                            <input 
                                type="email" name="email" value={profile.email} onChange={handleInputChange} 
                                placeholder="contato@marcenaria.com" 
                                className={`w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded-xl border-2 outline-none transition-all ${errors.email ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#e6ddcd] dark:border-[#4a4040] focus:border-[#d4ac6e]'}`} 
                            />
                            {errors.email && <p className="text-red-500 text-[9px] font-black uppercase ml-1 animate-fadeIn">{errors.email}</p>}
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading || saveSuccess} className="w-full bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-black py-5 rounded-[2rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-4">
                        {isLoading ? <Spinner size="sm" /> : saveSuccess ? <><CheckIcon className="w-5 h-5" /> Perfil Atualizado</> : 'Sincronizar Oficina'}
                    </button>
                </form>
            </div>
        </div>
    );
};
