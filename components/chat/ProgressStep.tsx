
import React, { memo } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export const ProgressStep = memo(({ label, status }: { label: string, status: 'active' | 'done' | false }) => (
  <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 ${status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : status === 'active' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
    {status === 'done' ? <CheckCircle2 size={14} /> : status === 'active' ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </div>
));
