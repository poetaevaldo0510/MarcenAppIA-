
import React, { memo } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export const ProgressStep = memo(({ label, status }: { label: string, status: 'active' | 'done' | 'error' | false }) => {
  const isError = status === 'error';
  const isDone = status === 'done';
  const isActive = status === 'active';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 ${
      isDone ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
      isActive ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
      isError ? 'bg-red-500/10 border-red-500/20 text-red-500' :
      'bg-slate-100 border-slate-200 text-slate-400'
    }`}>
      {isDone ? <CheckCircle2 size={14} /> : 
       isActive ? <Loader2 size={14} className="animate-spin" /> : 
       isError ? <XCircle size={14} /> :
       <div className="w-3 h-3 rounded-full border border-slate-300" />}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
});
