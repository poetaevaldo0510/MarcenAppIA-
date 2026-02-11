
import React, { memo } from "react";
import { X } from "lucide-react";
import { useStore } from "../../store/yaraStore";

export const Drawer = memo(({ id, title, color, icon: Icon, children }: any) => {
  const { activeModal, setModal } = useStore();
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setModal(null)} />
      <div className="relative w-full max-w-lg bg-white h-[100dvh] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        <header className={`${color} p-6 text-white flex justify-between items-center shrink-0 shadow-lg`}>
          <div className="flex items-center gap-4">{Icon && <Icon size={24} />}<h2 className="text-lg font-black uppercase tracking-tight font-mono">{title}</h2></div>
          <button onClick={() => setModal(null)} className="p-2 bg-white/20 rounded-full active:scale-95 text-white"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar text-zinc-900 text-left">{children}</div>
      </div>
    </div>
  );
});
