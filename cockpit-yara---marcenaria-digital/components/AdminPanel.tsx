
import React, { useState, useEffect, useMemo } from 'react';
import { getHistory } from '../services/historyService';
import type { ProjectHistoryItem, UnicornMilestone } from '../types';
/* Added missing LogoIcon to imports */
import { Spinner, TrendingUpIcon, GlobeIcon, SparklesIcon, MicIcon, CameraIcon, CheckIcon, ShoppingCartIcon, ToolsIcon, LogoIcon } from './Shared';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ROADMAP: UnicornMilestone[] = [
    { phase: 1, id: 'SAAS_BANCADA', year: '2025', title: 'DOMÍNIO DE BANCADA', status: 'active', kpi: 'Substituição Desenhista', description: 'Consolidação do Hub Vox e scanner 1:1 para eliminar desenho manual.' },
    { phase: 2, id: 'MARKETPLACE_PEDAGIO', year: '2026', title: 'DOMÍNIO DIGITAL', status: 'pending', kpi: 'Take-Rate Automático', description: 'Integração de checkout direto com balcão do fornecedor via Tech Reck.' },
    { phase: 3, id: 'FINTECH_CREDITO', year: '2027', title: 'FINTECH DA MADEIRA', status: 'pending', kpi: 'Bancarização Oficina', description: 'Linha de crédito integrada para compra de insumos baseada no histórico de projetos.' },
    { phase: 4, id: 'GLOBAL_SCALE', year: '2028', title: 'ESCALA GLOBAL', status: 'pending', kpi: 'Internacionalização', description: 'Expansão do sistema operacional da marcenaria digital para mercados globais.' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'roadmap' | 'stats'>('roadmap');
    const [allProjects, setAllProjects] = useState<ProjectHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getHistory().then(hData => {
                setAllProjects(hData);
                setIsLoading(false);
            }).catch(() => setIsLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/98 z-[1000] flex justify-center items-center p-4 backdrop-blur-3xl animate-fadeIn font-mono">
            <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-blue-500/10">
                <header className="px-10 py-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-[#1e293b]/50 gap-6">
                    <div className="flex items-center gap-5">
                        <div className="bg-emerald-500 p-3 rounded-2xl text-black shadow-lg">
                            <TrendingUpIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Evolução MarcenApp</h2>
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mt-2">Plano de Infraestrutura Global</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
                        <button onClick={() => setActiveTab('roadmap')} className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'roadmap' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Fases do Sistema</button>
                        <button onClick={() => setActiveTab('stats')} className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Métricas Técnicas</button>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-4xl leading-none">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto p-10 custom-scrollbar bg-gradient-to-b from-[#0f172a] to-[#020617]">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>
                    ) : activeTab === 'roadmap' ? (
                        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                            {ROADMAP.map((item) => (
                                <div key={item.id} className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between transition-all gap-8 ${item.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xl' : 'bg-white/5 border-white/5 opacity-50'}`}>
                                    <div className="flex items-center gap-8">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${item.status === 'active' ? 'bg-emerald-500 text-black' : 'bg-black text-gray-500'}`}>{item.phase}</div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{item.year} - META: {item.kpi}</p>
                                            <h4 className="text-xl font-black text-white uppercase italic">{item.title}</h4>
                                            <p className="text-[10px] text-gray-400 mt-2 italic max-w-md">{item.description}</p>
                                        </div>
                                    </div>
                                    {item.status === 'active' ? (
                                        <div className="bg-emerald-500 text-black px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Ativo</div>
                                    ) : (
                                        <div className="bg-white/10 text-gray-500 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">Aguardando</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
                             <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 text-center">
                                 <MicIcon className="w-10 h-10 text-emerald-500 mx-auto mb-6" />
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Projetos via Vox</p>
                                 <p className="text-3xl font-black text-white">{allProjects.length}</p>
                             </div>
                             <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 text-center">
                                 <ToolsIcon className="w-10 h-10 text-blue-500 mx-auto mb-6" />
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">BOMs Geradas</p>
                                 <p className="text-3xl font-black text-white">{allProjects.filter(p => p.bom).length}</p>
                             </div>
                             <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 text-center">
                                 <GlobeIcon className="w-10 h-10 text-emerald-400 mx-auto mb-6" />
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Eficiência Estela</p>
                                 <p className="text-3xl font-black text-emerald-400">100%</p>
                             </div>
                        </div>
                    )}
                </main>

                <footer className="p-10 border-t border-white/5 bg-[#1e293b]/50 text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Iara Vision Dynamics • Estela Finance • Bento Engineering • Juca Audit</p>
                </footer>
            </div>
        </div>
    );
};
