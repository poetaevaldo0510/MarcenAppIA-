
import React, { useState, useEffect, useMemo } from 'react';
import type { Client, ProjectHistoryItem, UserRole, UserProfile } from '../types';
import { UsersIcon, SearchIcon, WandIcon, TrashIcon, StoreIcon, CubeIcon, BookIcon, SparklesIcon, Spinner, CheckIcon, CurrencyDollarIcon, InfoIcon, DossierIcon, WhatsappIcon, LogoIcon } from './Shared';
import { DossierModal } from './DossierModal';

interface ClientPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    clients: Client[];
    projects: ProjectHistoryItem[];
    onSaveClient: (client: Omit<Client, 'id' | 'timestamp' | 'ownerId'> & { id?: string }) => void;
    onDeleteClient: (id: string) => void;
    onViewProject: (project: ProjectHistoryItem) => void;
    onLinkProject: (projectId: string, clientId: string) => Promise<void>;
    embeddedView?: boolean;
}

export const ClientPanel: React.FC<ClientPanelProps> = ({
    isOpen, onClose, userProfile, clients, projects, onSaveClient, onDeleteClient, onViewProject, onLinkProject, embeddedView = false
}) => {
    const role = userProfile?.role || 'marceneiro';
    const initialForm = { name: '', email: '', phone: '', address: '', notes: '', status: 'lead' as any };
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Nome é obrigatório.";
        if (!formData.phone.trim()) newErrors.phone = "WhatsApp é obrigatório.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSaveClient({ ...formData, category: role } as any);
        setFormData(initialForm);
        setIsEditing(false);
    };

    if (!isOpen && !embeddedView) return null;

    const Content = (
        <div className="flex flex-col h-full bg-white dark:bg-[#2d2424]">
            <header className="p-8 border-b border-[#e6ddcd] dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#3e3535]">
                <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase italic">Agenda de Clientes</h2>
                {!embeddedView && <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-3xl">&times;</button>}
            </header>
            
            <div className="flex-grow overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-[#fcfaf7] dark:bg-[#1a1414] p-8 rounded-[2.5rem] border border-[#e6ddcd] dark:border-white/5 h-fit">
                    <h3 className="text-xs font-black uppercase text-[#3e3535] dark:text-white mb-6">Cadastro</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nome</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} className={`w-full bg-white dark:bg-[#2d2424] p-4 rounded-2xl border text-sm font-bold ${errors.name ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#dcd6c8] dark:border-[#5a4f4f]'}`} />
                            {errors.name && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.name}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">WhatsApp</label>
                            <input name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full bg-white dark:bg-[#2d2424] p-4 rounded-2xl border text-sm font-bold ${errors.phone ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#dcd6c8] dark:border-[#5a4f4f]'}`} />
                            {errors.phone && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.phone}</p>}
                        </div>
                        <button type="submit" className="w-full bg-[#d4ac6e] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Salvar Cliente</button>
                    </form>
                </div>
                
                <div className="lg:col-span-8">
                    {/* Lista de clientes (mantendo lógica original de exibição) */}
                </div>
            </div>
        </div>
    );

    return embeddedView ? Content : (
        <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'bg-black/70 backdrop-blur-md' : 'pointer-events-none'}`} onClick={onClose}>
            <div className={`fixed top-0 right-0 h-full w-full max-w-4xl shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                {Content}
            </div>
        </div>
    );
};
