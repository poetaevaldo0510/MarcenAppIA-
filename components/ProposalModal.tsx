
import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { ProjectHistoryItem, Client, UserProfile } from '../types';
import { PDFExport, convertMarkdownToHtmlWithInlineStyles } from '../utils/helpers';
import { LogoIcon, DownloadIcon, SparklesIcon, Spinner, WhatsappIcon, EmailIcon, CopyIcon, CheckIcon, CurrencyDollarIcon, ToolsIcon, DocumentTextIcon } from './Shared';
import { estimateProjectCosts } from '../services/geminiService';
import { getCarpenterProfile } from '../services/historyService';
import { sendWhatsAppMessage } from '../services/whatsappService';

interface ProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem;
    client?: Client;
    showAlert: (message: string, title?: string) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, project, client, showAlert }) => {
    const [costs, setCosts] = useState({ material: 0, labor: 0 });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('Validade: 15 dias.\nPagamento: 50% entrada, 50% entrega.\nPrazo: 45 dias úteis para instalação.');
    const [isEstimating, setIsEstimating] = useState(false);
    const [isSendingWA, setIsSendingWA] = useState(false);
    const [carpenter, setCarpenter] = useState<UserProfile | null>(null);
    const [whatsappFeedback, setWhatsappFeedback] = useState(false);
    const proposalContentRef = useRef<HTMLDivElement>(null);

    const totalCost = useMemo(() => costs.material + costs.labor, [costs]);
    
    useEffect(() => {
        if (isOpen) {
            getCarpenterProfile().then(data => setCarpenter(data));
            if (project.totalValue) {
                setCosts({ material: project.materialCost || 0, labor: project.laborCost || 0 });
            }
            setErrors({});
        }
    }, [isOpen, project]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (costs.material <= 0) newErrors.material = "Custo de insumos deve ser real.";
        if (costs.labor <= 0) newErrors.labor = "Sua mão de obra tem valor, Mestre.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = Number(value) || 0;
        setCosts(prev => ({ ...prev, [name]: numValue }));
        if (errors[name]) setErrors(prev => {
            const n = { ...prev };
            delete n[name];
            return n;
        });
    };
    
    const handleExport = () => {
        if (!validate()) {
            showAlert("Mestre, verifique os valores do orçamento.", "Dados Inválidos");
            return;
        }
        if (proposalContentRef.current) {
            PDFExport(proposalContentRef.current, `Proposta_${project.name.replace(/\s+/g, '_')}.pdf`);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!validate()) {
            showAlert("Mestre, verifique os valores do orçamento.", "Dados Inválidos");
            return;
        }
        const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const text = `*PROPOSTA COMERCIAL - ${carpenter?.businessName || 'OFICINA DIGITAL'}*\n\n` +
            `*Mestre Evaldo* acaba de materializar o dossiê: *${project.name}*\n\n` +
            `*RESUMO DO INVESTIMENTO:*\n` +
            `• Materiais e Ferragens: ${formatCurrency(costs.material)}\n` +
            `• Mão de Obra e Montagem: ${formatCurrency(costs.labor)}\n` +
            `----------------------------------\n` +
            `*TOTAL: ${formatCurrency(totalCost)}*\n\n` +
            `*CONDIÇÕES GERAIS:*\n${notes}\n\n` +
            `_Documento gerado via MarcenApp v2.5_`;

        navigator.clipboard.writeText(text);
        setWhatsappFeedback(true);
        setTimeout(() => setWhatsappFeedback(false), 2000);
        
        const cleanPhone = client?.phone?.replace(/\D/g, '') || project.clientName?.replace(/\D/g, '') || '';
        if (cleanPhone) {
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            showAlert("Proposta copiada! Cole no chat do cliente.", "Pronto para Enviar");
        }
    };

    const handleSuggestCosts = async () => {
        setIsEstimating(true);
        try {
            const result = await estimateProjectCosts(project, '');
            setCosts({ material: result.materialCost, labor: result.laborCost });
            setErrors({});
            showAlert("Iara auditou o projeto e sugeriu valores baseados em insumos premium.", "Engenharia Ativa");
        } catch (error) {
            showAlert('Falha ao sincronizar com banco de preços.');
        } finally {
            setIsEstimating(false);
        }
    };

    if (!isOpen) return null;
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="fixed inset-0 bg-black/95 z-[700] flex justify-center items-center p-2 md:p-6 backdrop-blur-xl animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#111] rounded-[3.5rem] w-full max-w-6xl max-h-[95vh] shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                
                <header className="px-8 py-6 border-b border-[#e6ddcd] dark:border-white/5 flex justify-between items-center bg-[#f5f1e8] dark:bg-[#1a1414]">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e] shadow-xl">
                            <DocumentTextIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Dossiê Comercial PhD</h2>
                            <p className="text-[10px] text-[#b99256] font-black uppercase tracking-[0.3em] mt-1.5">Módulo de Conversão em Venda</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-red-500 text-4xl font-light transition-all">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-10 bg-[#fdfaf5] dark:bg-[#0a0808]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        <div className="lg:col-span-7">
                            <div ref={proposalContentRef} className="bg-white p-12 shadow-2xl rounded-2xl border border-gray-100 min-h-[800px] flex flex-col text-[#1e293b]" style={{fontFamily: "'Inter', sans-serif"}}>
                                <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
                                    <div className="flex items-center gap-4">
                                        {carpenter?.logo ? (
                                            <img src={carpenter.logo} className="w-16 h-16 object-contain" />
                                        ) : (
                                            <LogoIcon className="w-12 h-12 text-black" />
                                        )}
                                        <div>
                                            <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{carpenter?.businessName || 'Oficina Digital'}</h1>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Excelência em Marcenaria Sob Medida</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orçamento Nº</p>
                                        <p className="text-sm font-bold">#{project.id.slice(-6).toUpperCase()}</p>
                                        <p className="text-[10px] mt-2 font-bold text-gray-300">{new Date().toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>

                                <div className="space-y-8 flex-grow">
                                    <div className="grid grid-cols-2 gap-10">
                                        <div>
                                            <h4 className="text-[10px] font-black text-[#d4ac6e] uppercase tracking-widest mb-2">Projeto</h4>
                                            <p className="text-lg font-black uppercase leading-tight">{project.name}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-[#d4ac6e] uppercase tracking-widest mb-2">Cliente</h4>
                                            <p className="text-lg font-black uppercase leading-tight">{client?.name || project.clientName || 'Prezado(a) Cliente'}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-gray-50 aspect-video bg-gray-50">
                                        <img src={project.views3d[0]} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="bg-[#fcfaf7] p-8 rounded-[2rem] border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Investimento Total Estimado</p>
                                            <p className="text-5xl font-black text-[#3e3535] tracking-tighter">{formatCurrency(totalCost)}</p>
                                        </div>
                                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e]"><CheckIcon className="w-8 h-8" /></div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-[#d4ac6e] uppercase tracking-widest border-b pb-2">Condições e Prazos</h4>
                                        <div className="text-xs text-gray-500 font-medium leading-relaxed whitespace-pre-line">
                                            {notes}
                                        </div>
                                    </div>
                                </div>

                                <footer className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center opacity-40">
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em]">MarcenApp Digital Dossier</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Página 01/01</span>
                                </footer>
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-8">
                            <div className="bg-white dark:bg-[#1a1414] p-8 rounded-[3rem] border border-[#e6ddcd] dark:border-white/5 shadow-xl space-y-8">
                                <h3 className="text-xs font-black uppercase text-[#3e3535] dark:text-white tracking-widest flex items-center gap-3">
                                    <ToolsIcon className="w-5 h-5 text-[#b99256]" /> Configuração de Preço
                                </h3>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Insumos (MDF/Ferr.)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs">R$</span>
                                            <input 
                                                type="number" 
                                                name="material" 
                                                value={costs.material} 
                                                onChange={handleCostChange} 
                                                className={`w-full bg-[#fdfaf5] dark:bg-black/20 border-2 p-4 pl-10 rounded-2xl text-sm font-black outline-none transition-all ${errors.material ? 'border-red-500' : 'border-transparent focus:border-[#d4ac6e]'}`}
                                            />
                                        </div>
                                        {errors.material && <p className="text-red-500 text-[8px] font-black uppercase ml-1">{errors.material}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Mão de Obra</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs">R$</span>
                                            <input 
                                                type="number" 
                                                name="labor" 
                                                value={costs.labor} 
                                                onChange={handleCostChange} 
                                                className={`w-full bg-[#fdfaf5] dark:bg-black/20 border-2 p-4 pl-10 rounded-2xl text-sm font-black outline-none transition-all ${errors.labor ? 'border-red-500' : 'border-transparent focus:border-[#d4ac6e]'}`}
                                            />
                                        </div>
                                        {errors.labor && <p className="text-red-500 text-[8px] font-black uppercase ml-1">{errors.labor}</p>}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSuggestCosts} 
                                    disabled={isEstimating}
                                    className="w-full bg-white dark:bg-black/20 border-2 border-dashed border-[#d4ac6e]/40 hover:border-[#d4ac6e] py-4 rounded-2xl text-[#b99256] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    {isEstimating ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                                    Recalcular via Iara IA
                                </button>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Notas da Proposta</label>
                                    <textarea 
                                        value={notes} 
                                        onChange={e => setNotes(e.target.value)} 
                                        className="w-full bg-[#fdfaf5] dark:bg-black/20 p-5 rounded-2xl text-xs font-medium h-32 focus:border-[#d4ac6e] border-2 border-transparent transition-all outline-none shadow-inner"
                                    />
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                                    <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />
                                    <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed font-bold uppercase italic">
                                        Valores baseados em MDF 18mm com alinhamento de veios e ferragens de amortecimento padrão Estela.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="p-8 border-t border-[#e6ddcd] dark:border-white/5 bg-[#f5f1e8] dark:bg-[#1a1414] flex flex-col md:flex-row justify-between items-center gap-6">
                    <button onClick={onClose} className="px-10 py-4 font-black text-[#8a7e7e] hover:text-[#3e3535] dark:hover:text-white uppercase text-[10px] tracking-widest transition-all">Descartar</button>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button 
                            onClick={handleSendWhatsApp} 
                            className={`flex-1 md:flex-none px-10 py-5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 transition-all active:scale-95 ${whatsappFeedback ? 'bg-blue-600 text-white' : 'bg-[#25D366] text-white'}`}
                        >
                            {whatsappFeedback ? <CheckIcon className="w-5 h-5" /> : <WhatsappIcon className="w-5 h-5" />}
                            {whatsappFeedback ? 'Copiado!' : 'Mandar p/ Zap Cliente'}
                        </button>
                        <button 
                            onClick={handleExport}
                            className="flex-1 md:flex-none bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] px-10 py-5 rounded-2xl font-black uppercase text-[10px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <DownloadIcon className="w-5 h-5" /> Baixar PDF Proposta
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
