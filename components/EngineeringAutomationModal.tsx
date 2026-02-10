
import React, { useState, useEffect } from 'react';
/* Added missing LogoIcon to imports from Shared */
import { Spinner, CheckIcon, SparklesIcon, BlueprintIcon, CurrencyDollarIcon, BookIcon, GlobeIcon, LogoIcon } from './Shared';
import { performEngineeringExplosion, researchRealPrices, estimateProjectCosts } from '../services/geminiService';
import type { ProjectHistoryItem } from '../types';

interface EngineeringAutomationModalProps {
    isOpen: boolean;
    project: ProjectHistoryItem;
    onComplete: (updates: Partial<ProjectHistoryItem>) => void;
    onClose: () => void;
}

type Step = 'explosion' | 'research' | 'budget';

export const EngineeringAutomationModal: React.FC<EngineeringAutomationModalProps> = ({ isOpen, project, onComplete, onClose }) => {
    const [currentStep, setCurrentStep] = useState<Step>('explosion');
    const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
    const [sources, setSources] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && completedSteps.size === 0) {
            runAutomation();
        }
    }, [isOpen]);

    const runAutomation = async () => {
        try {
            // Módulo 2: Explosão do Móvel
            setCurrentStep('explosion');
            const engineeringData = await performEngineeringExplosion(
                project.technicalSpec || { description: project.description }, 
                project.views3d[project.views3d.length - 1]
            );
            setCompletedSteps(prev => new Set(prev).add('explosion'));

            // Módulo 3: Pesquisa de Preços Real (Grounding)
            setCurrentStep('research');
            const priceResearch = await researchRealPrices(engineeringData.termos_busca_orcamento || []);
            setSources(priceResearch.sources);
            setCompletedSteps(prev => new Set(prev).add('research'));

            // Finalização: Consolidação do Orçamento
            setCurrentStep('budget');
            const costs = await estimateProjectCosts(project, priceResearch.summary);
            
            // Transformação do Plano de Corte JSON para Markdown amigável seguindo os novos campos
            // Proteção contra undefined no mapeamento das peças
            const cuttingPlanMd = `## Plano de Corte Otimizado (Iara Engine v2)\n\n` + 
                (engineeringData.plano_de_corte_pecas || []).map((p: any) => `- **${p.nome_peca}**: ${p.qtd}x ${p.medidas_corte_mm?.[0] || 0}x${p.medidas_corte_mm?.[1] || 0}mm (${p.material}) | Bordas: ${p.fita_borda}`).join('\n');

            // Formatação da Lista de Materiais Consolidados com verificações de estrutura
            const chapasMd = (engineeringData.lista_compras_consolidada?.chapas || []).map((c: any) => `- ${c.tipo}: ${c.estimativa_chapas} un.`).join('\n');
            const ferragensMd = (engineeringData.lista_compras_consolidada?.ferragens || []).map((f: any) => `- ${f.item}: ${f.qtd || f.qtd_estimada} un.`).join('\n');
            const fitaMetros = engineeringData.lista_compras_consolidada?.fita_borda_total_metros || 0;

            const bomMd = `## Lista Consolidada de Materiais e Ferragens\n\n` +
                `### Chapas Estimadas\n` + (chapasMd || "Nenhuma chapa listada.") +
                `\n\n### Ferragens e Acessórios\n` + (ferragensMd || "Nenhuma ferragem listada.") +
                `\n\n### Acabamento\n- **Fita de Borda Total:** ${fitaMetros} metros`;

            const updates: Partial<ProjectHistoryItem> = {
                bom: bomMd,
                cuttingPlan: cuttingPlanMd,
                materialCost: costs.materialCost,
                laborCost: costs.laborCost,
                priceSources: priceResearch.sources,
                engineeringStatus: 'completed'
            };
            
            setTimeout(() => onComplete(updates), 1500);

        } catch (error) {
            console.error("Erro na automação:", error);
            // Em caso de erro crítico, tenta fechar o modal ou sinalizar erro para evitar loop
            onClose();
        }
    };

    if (!isOpen) return null;

    const StepItem = ({ id, label, icon: Icon, stepLabel }: { id: Step, label: string, icon: any, stepLabel: string }) => {
        const isCompleted = completedSteps.has(id);
        const isCurrent = currentStep === id;

        return (
            <div className={`flex items-center gap-4 p-5 rounded-3xl transition-all border-2 ${isCurrent ? 'bg-[#fdfaf5] border-[#d4ac6e] shadow-xl scale-105' : 'opacity-50 border-transparent'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isCompleted ? 'bg-green-500 text-white' : (isCurrent ? 'bg-[#3e3535] text-[#d4ac6e]' : 'bg-gray-100 text-gray-400')}`}>
                    {isCompleted ? <CheckIcon className="w-6 h-6" /> : <Icon className={`w-6 h-6 ${isCurrent ? 'animate-pulse' : ''}`} />}
                </div>
                <div className="flex-grow">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCurrent ? 'text-[#b99256]' : 'text-gray-400'}`}>{stepLabel}</p>
                    <h4 className={`font-bold text-sm ${isCurrent ? 'text-[#3e3535]' : 'text-gray-500'}`}>{label}</h4>
                </div>
                {isCurrent && <Spinner size="sm" />}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[200] flex justify-center items-center p-4 backdrop-blur-xl animate-fadeIn">
            <div className="bg-white dark:bg-[#1a1414] rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-white/5 animate-scaleIn">
                <header className="p-10 text-center bg-[#f5f1e8] dark:bg-[#2d2424] border-b border-[#e6ddcd] dark:border-white/5">
                    <div className="flex justify-center mb-6">
                        <div className="bg-[#3e3535] p-5 rounded-[2rem] text-[#d4ac6e] shadow-2xl">
                            <SparklesIcon className="w-10 h-10" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter italic">Engenharia de Produção</h2>
                    <p className="text-sm text-[#8a7e7e] mt-2 font-medium">Iara Engine processando regras de oficina e mercado.</p>
                </header>

                <main className="p-10 space-y-4">
                    <StepItem id="explosion" label="Explosão Técnica do Móvel" stepLabel="Módulo 2" icon={BlueprintIcon} />
                    <StepItem id="research" label="Pesquisa de Preços Real (Grounding)" stepLabel="Módulo 3" icon={GlobeIcon} />
                    <StepItem id="budget" label="Consolidação de Budget BRL" stepLabel="Finalização" icon={CurrencyDollarIcon} />
                </main>

                <footer className="p-8 bg-gray-50 dark:bg-[#2d2424] text-center border-t border-gray-100 dark:border-white/5">
                    <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
                        <LogoIcon className="w-24 h-24" />
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.3em] animate-pulse">Aguarde... Iara está calculando milímetros e valores.</p>
                </footer>
            </div>
        </div>
    );
};
