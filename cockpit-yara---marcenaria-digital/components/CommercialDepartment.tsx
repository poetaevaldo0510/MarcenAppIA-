import React, { useState } from 'react';
import { Spinner, CurrencyDollarIcon, StoreIcon, CheckIcon, SparklesIcon, TrendingUpIcon } from './Shared';
import type { ProjectHistoryItem, UserProfile } from '../types';
import { syncToCorteCloud } from '../services/corteCloudService';

interface CommercialDepartmentProps {
    isOpen: boolean;
    project: ProjectHistoryItem;
    profile: UserProfile;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
}

export const CommercialDepartment: React.FC<CommercialDepartmentProps> = ({ isOpen, project, profile, onClose, showAlert }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [externalId, setExternalId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSyncWithVendors = async () => {
        setIsSyncing(true);
        setSyncSuccess(false);
        try {
            const result = await syncToCorteCloud(project, profile);
            if (result.success) {
                setSyncSuccess(true);
                setExternalId(result.externalId || null);
                showAlert(result.message, "Sincronização Concluída");
            }
        } catch (error: any) {
            showAlert(error.message || "Falha na comunicação com a central de serviços.", "Erro de Produção");
        } finally {
            setIsSyncing(false);
        }
    };

    const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const budget = project.technicalSpec?.budgetPreview || { materialCost: 0, laborCost: 0, total: 0 };

    return (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#1a1414] w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/5 animate-scaleIn">
                <header className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-emerald-50 dark:bg-[#111]">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 p-3 rounded-2xl text-white">
                            <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-emerald-800 dark:text-white uppercase italic tracking-tighter">Departamento Comercial: Estela</h2>
                            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-1">Inteligência Financeira e Vendas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl">&times;</button>
                </header>

                <main className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-black/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo de Orçamento</h3>
                                <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Materiais Estimados</span>
                                    <span className="text-sm font-black text-gray-800 dark:text-white">{formatBRL(budget.materialCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Mão de Obra Técnica</span>
                                    <span className="text-sm font-black text-gray-800 dark:text-white">{formatBRL(budget.laborCost)}</span>
                                </div>
                                <div className="h-px bg-gray-100 dark:bg-white/5"></div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase">Investimento Total</span>
                                        <p className="text-3xl font-black text-gray-800 dark:text-white tracking-tighter leading-none mt-1">{formatBRL(budget.total || (budget.materialCost + budget.laborCost))}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 px-3 py-1 rounded-full text-[9px] font-black text-emerald-600 uppercase">Lucro Otimizado</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#3e3535] p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:rotate-12 transition-transform"><StoreIcon className="w-32 h-32" /></div>
                            <h3 className="text-lg font-black uppercase italic tracking-tighter text-[#d4ac6e]">Ponte de Distribuição</h3>
                            <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                Estela está pronta para enviar seu plano de corte para o balcão do fornecedor via <strong>CorteCloud</strong>.
                            </p>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={handleSyncWithVendors}
                                    disabled={isSyncing || syncSuccess}
                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${syncSuccess ? 'bg-emerald-500 text-white' : 'bg-[#d4ac6e] text-black shadow-2xl active:scale-95'}`}
                                >
                                    {isSyncing ? <Spinner size="sm" /> : syncSuccess ? <><CheckIcon className="w-5 h-5" /> Plano Sincronizado!</> : <><StoreIcon className="w-5 h-5" /> Enviar para Produção</>}
                                </button>
                                
                                {externalId && (
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Protocolo Industrial:</p>
                                        <p className="text-xs font-mono font-bold">{externalId}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex items-start gap-4">
                        <div className="bg-white dark:bg-[#1a1414] p-2 rounded-xl shadow-sm text-emerald-600">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400">Status de Engenharia</h4>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed mt-1">
                                {project.bom ? "Lista técnica (BOM) validada e pronta para faturamento." : "Aguardando geração da lista técnica pelo Mestre Bento."}
                            </p>
                        </div>
                    </div>
                </main>

                <footer className="p-8 border-t border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] text-center">
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.4em]">Estela comercial v12.0 • Conectada ao barramento CorteCloud</p>
                </footer>
            </div>
        </div>
    );
};