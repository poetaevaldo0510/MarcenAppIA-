
import React, { useState } from 'react';
import { convertMarkdownToHtml } from '../utils/helpers';
import { CameraIcon, CurrencyDollarIcon, BookIcon, BlueprintIcon, CheckIcon, CopyIcon, SparklesIcon, DownloadIcon } from './Shared';
import type { IaraPillars } from '../types';

interface ProjectReportProps {
    pillars: IaraPillars;
    projectName: string;
}

export const ProjectReport: React.FC<ProjectReportProps> = ({ pillars, projectName }) => {
    const [activePillar, setActivePillar] = useState<keyof IaraPillars>('render');
    const [copyFeedback, setCopyFeedback] = useState(false);

    const pillarTabs = [
        { id: 'render' as keyof IaraPillars, label: 'Visual 3D', icon: CameraIcon },
        { id: 'budget' as keyof IaraPillars, label: 'Orçamento', icon: CurrencyDollarIcon },
        { id: 'bom' as keyof IaraPillars, label: 'Lista Técnica', icon: BookIcon },
        { id: 'cutlist' as keyof IaraPillars, label: 'Corte Otimizado', icon: BlueprintIcon },
    ];

    const handleCopy = () => {
        navigator.clipboard.writeText(pillars[activePillar]);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-[#2d2424] rounded-[2.5rem] border border-[#e6ddcd] dark:border-white/5 shadow-xl overflow-hidden animate-fadeIn">
            <nav className="flex overflow-x-auto no-scrollbar bg-[#f5f1e8] dark:bg-black/20 border-b border-[#e6ddcd] dark:border-white/5 p-3 gap-2">
                {pillarTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActivePillar(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activePillar === tab.id ? 'bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] shadow-lg' : 'text-[#8a7e7e] hover:bg-white/50'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
                
                <div className="flex-grow"></div>
                
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-white dark:bg-black/20 text-[#3e3535] dark:text-[#d4ac6e] px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm hover:brightness-110 transition-all border border-[#e6ddcd] dark:border-white/5"
                >
                    {copyFeedback ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                    {copyFeedback ? 'Copiado!' : 'Copiar'}
                </button>
            </nav>

            <div className="p-8 min-h-[400px] bg-white dark:bg-[#1a1414]">
                <div className="prose prose-sm dark:prose-invert max-w-none animate-fadeIn" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(pillars[activePillar]) }} />
            </div>
        </div>
    );
};
