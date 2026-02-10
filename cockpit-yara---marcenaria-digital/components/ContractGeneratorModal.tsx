
import React, { useState, useRef, useEffect } from 'react';
import type { ProjectHistoryItem, Client, UserProfile } from '../types';
import { PDFExport } from '../utils/helpers';
import { Spinner, LogoIcon, DocumentTextIcon, CheckIcon, DownloadIcon, ScaleIcon, ShieldCheckIcon, PrinterIcon, CopyIcon, PencilIcon, AlertTriangleIcon, PlusIcon, WandIcon } from './Shared';
import { generateAdemirClause } from '../services/geminiService';

interface ContractGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem;
    client?: Client;
    carpenter?: UserProfile | null;
    showAlert: (message: string, title?: string) => void;
}

export const ContractGeneratorModal: React.FC<ContractGeneratorModalProps> = ({ 
    isOpen, onClose, project, client, carpenter, showAlert 
}) => {
    const [data, setData] = useState({
        companyName: carpenter?.businessName || "",
        clientName: client?.name || "",
        clientDoc: "",
        totalValue: project.totalValue || 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!data.companyName.trim()) newErrors.companyName = "Nome da empresa é obrigatório.";
        if (!data.clientName.trim()) newErrors.clientName = "Nome do cliente é obrigatório.";
        if (!data.clientDoc.trim()) newErrors.clientDoc = "Documento é obrigatório.";
        if (data.totalValue <= 0) newErrors.totalValue = "Valor deve ser maior que zero.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: string, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[700] flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-black uppercase italic">Gerador de Contrato</h2>
                    <button onClick={onClose} className="text-gray-400 text-3xl">&times;</button>
                </header>
                <main className="p-10 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Sua Marcenaria</label>
                            <input value={data.companyName} onChange={e => handleInputChange('companyName', e.target.value)} className={`w-full bg-gray-50 p-4 rounded-xl border ${errors.companyName ? 'border-red-500' : 'border-transparent'}`} />
                            {errors.companyName && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.companyName}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Cliente</label>
                            <input value={data.clientName} onChange={e => handleInputChange('clientName', e.target.value)} className={`w-full bg-gray-50 p-4 rounded-xl border ${errors.clientName ? 'border-red-500' : 'border-transparent'}`} />
                            {errors.clientName && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.clientName}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400">CPF/CNPJ Cliente</label>
                                <input value={data.clientDoc} onChange={e => handleInputChange('clientDoc', e.target.value)} className={`w-full bg-gray-50 p-4 rounded-xl border ${errors.clientDoc ? 'border-red-500' : 'border-transparent'}`} />
                                {errors.clientDoc && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.clientDoc}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400">Valor Contratual</label>
                                <input type="number" value={data.totalValue} onChange={e => handleInputChange('totalValue', Number(e.target.value))} className={`w-full bg-gray-50 p-4 rounded-xl border ${errors.totalValue ? 'border-red-500' : 'border-transparent'}`} />
                                {errors.totalValue && <p className="text-red-500 text-[8px] font-black uppercase ml-2">{errors.totalValue}</p>}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => validate() && showAlert("Contrato validado para emissão.")} className="w-full bg-[#d4ac6e] text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs">Validar e Emitir</button>
                </main>
            </div>
        </div>
    );
};
