
import React from 'react';
import { Spinner, SparklesIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface RenderingQueueProps {
    queue: ProjectHistoryItem[];
}

export const RenderingQueue: React.FC<RenderingQueueProps> = ({ queue }) => {
    if (queue.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-72 space-y-3 animate-slideInRight">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#b99256] mb-2 px-2">Renderizando agora...</h4>
            {queue.map(project => (
                <div key={project.id} className="bg-[#3e3535] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-pulse-scale">
                    <div className="relative">
                        <Spinner size="sm" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="w-3 h-3 text-[#d4ac6e]" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{project.name}</p>
                        <p className="text-[10px] opacity-60">Iara está projetando...</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
