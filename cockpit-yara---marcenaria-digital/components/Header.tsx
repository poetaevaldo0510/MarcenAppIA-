
import React from 'react';
// Added LogoutIcon and TicketIcon to the imports
import { LogoIcon, UserIcon, LogoutIcon, TicketIcon, CameraIcon } from './Shared';
import type { UserRole, SubscriptionTier, MainTab } from '../types';

interface HeaderProps {
    userEmail: string;
    onOpenResearch: () => void;
    onOpenLive: () => void;
    onOpenDistributors: () => void;
    onOpenClients: () => void;
    onOpenHistory: () => void;
    onOpenAbout: () => void;
    onOpenProfile: () => void;
    onOpenAdmin: () => void;
    onOpenImageEditor: () => void;
    hasActiveProject: boolean;
    onLogout: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    credits: number;
    onOpenCredits: () => void;
    activeViewRole: UserRole;
    setActiveViewRole: (role: UserRole) => void;
    subscriptionTier?: SubscriptionTier;
    activeTab: MainTab;
    setActiveTab: (tab: MainTab) => void;
    isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    userEmail, 
    onOpenImageEditor,
    hasActiveProject,
    onLogout,
    credits
}) => {
    return (
        <header className="bg-[#f5f1e8]/80 dark:bg-[#110c0c]/80 backdrop-blur-sm sticky top-0 z-30 border-b border-[#e6ddcd] dark:border-white/5">
            <div className="max-w-full mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <div className="lg:hidden bg-[#3e3535] p-2 rounded-xl text-[#d4ac6e]">
                            <LogoIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-[#3e3535] dark:text-white uppercase tracking-widest italic">Oficina Ativa</h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Créditos Simplificados */}
                        <div className="flex px-4 py-2 rounded-xl bg-[#e6ddcd]/30 dark:bg-white/5 items-center gap-3 border border-white/5">
                            <TicketIcon className="w-4 h-4 text-[#b99256]" />
                            <span className="text-xs font-black tabular-nums">{credits} <span className="opacity-40 text-[9px] uppercase">Créditos</span></span>
                        </div>

                        <div className="h-8 w-px bg-[#e6ddcd] dark:bg-white/5 mx-2"></div>

                        <div className="flex items-center gap-2">
                            {hasActiveProject && (
                                <button onClick={onOpenImageEditor} className="p-2.5 rounded-xl text-[#3e3535] hover:bg-[#d4ac6e] transition-all" title="Editar Visual">
                                    <CameraIcon className="w-5 h-5" />
                                </button>
                            )}
                            <div className="hidden sm:flex w-9 h-9 rounded-full bg-white dark:bg-[#2d2424] items-center justify-center shadow-inner border border-[#e6ddcd]">
                                <UserIcon className="w-5 h-5 text-[#b99256]" />
                            </div>
                            <button onClick={onLogout} className="p-2.5 rounded-xl text-red-400 hover:text-red-600 transition-all" title="Sair">
                                <LogoutIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
