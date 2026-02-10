
import React, { useState, useEffect } from 'react';
import { DollarSign, Box, CheckCircle, ArrowRight, Cloud, Loader2, Layers, TrendingUp } from 'lucide-react';
import { IaraDesignOutput, ProjectHistoryItem, UserProfile } from '../types';
import { syncToCorteCloud } from '../services/corteCloudService';
import { getCarpenterProfile } from '../services/historyService';

interface BudgetProps {
  budgetData: IaraDesignOutput['budgetPreview'];
  projectName: string;
  project?: ProjectHistoryItem;
  onApprove?: () => void;
  onOpenOffice?: () => void;
}

export const BudgetBubble: React.FC<BudgetProps> = ({ budgetData, projectName, project, onApprove, onOpenOffice }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
      getCarpenterProfile().then(setProfile);
  }, []);

  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!budgetData) return null;

  return (
    <div className="w-full max-w-sm bg-[#202c33] rounded-3xl border border-emerald-500/30 shadow-2xl my-4 overflow-hidden animate-fadeInUp">
      <div className="bg-[#075e54] p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="bg-emerald-500/20 p-2 rounded-xl">
                <DollarSign size={16} className="text-emerald-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100">CFO Estela PhD</span>
        </div>
        <div className="bg-emerald-500/10 px-3 py-1 rounded-full text-[9px] font-black text-emerald-300 uppercase tracking-widest">IA Financeira</div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-1">
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Orçamento Estimativo</p>
           <h4 className="text-white font-black text-lg uppercase tracking-tighter truncate">{projectName}</h4>
        </div>

        <div className="space-y-3">
            <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <Box size={14} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Insumos Técnicos</span>
                </div>
                <span className="text-sm font-black text-slate-100">{formatBRL(budgetData.materialCost)}</span>
            </div>

            <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <TrendingUp size={14} className="text-orange-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mão de Obra (ROI)</span>
                </div>
                <span className="text-sm font-black text-slate-100">{formatBRL(budgetData.laborCost)}</span>
            </div>

            <div className="pt-2">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em]">Investimento Total</span>
                    <span className="text-2xl font-black text-white tracking-tighter">{formatBRL(budgetData.total || (budgetData.materialCost + budgetData.laborCost))}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                </div>
            </div>
        </div>
        
        <div className="flex gap-2 pt-2">
            <button 
                onClick={onOpenOffice}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
            >
                Abrir Office
            </button>
            <button 
                onClick={onApprove}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
            >
                Aprovar Proposta <ArrowRight size={16} />
            </button>
        </div>
      </div>
      
      <div className="bg-[#1a242b] p-3 text-center">
          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
            *Valores baseados em inteligência de mercado local e complexidade do rascunho.
          </p>
      </div>
    </div>
  );
};
