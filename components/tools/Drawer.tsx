
import React, { memo } from "react";
import { X } from "lucide-react";
import { useStore } from "../../store/yaraStore";

interface DrawerProps {
  id: string;
  title: string;
  color: string;
  icon: any;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Drawer = memo(({ id, title, color, icon: Icon, children, noPadding = false }: DrawerProps) => {
  const { activeModal, setModal } = useStore();
  if (activeModal !== id) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setModal(null)} />
      <div className="relative w-full max-w-lg lg:max-w-2xl bg-white h-[100dvh] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        <header className={`${color} p-6 text-white flex justify-between items-center shrink-0 shadow-lg z-20`}>
          <div className="flex items-center gap-4">{Icon && <Icon size={24} />}<h2 className="text-lg font-black uppercase tracking-tight font-mono">{title}</h2></div>
          <button onClick={() => setModal(null)} className="p-2 bg-white/20 rounded-full active:scale-95 text-white transition-all"><X size={20} /></button>
        </header>
        <div className={`flex-1 overflow-y-auto bg-slate-50 custom-scrollbar text-zinc-900 text-left ${noPadding ? '' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
});
