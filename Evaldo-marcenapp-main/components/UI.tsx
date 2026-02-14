
import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'magic' | 'dark' | 'outline';
  className?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, onClick, variant = 'primary', className = '', icon: Icon, disabled, type = 'button' 
}) => {
  const variants = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-[0.95] font-black border-b-4 border-indigo-700",
    secondary: "bg-[#3b4a54] text-white border border-white/10 hover:bg-[#4f5d67] active:scale-[0.95]",
    danger: "bg-red-500 text-white hover:bg-red-400 active:scale-[0.95] border-b-4 border-red-700",
    ghost: "text-indigo-400 hover:bg-indigo-500/10 active:scale-[0.95]",
    magic: "bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] font-black active:scale-[0.95] border-b-4 border-amber-600",
    dark: "bg-black text-white border border-white/20 hover:bg-stone-900 active:scale-[0.95]",
    outline: "bg-transparent text-indigo-400 border-2 border-indigo-500 hover:bg-indigo-500 hover:text-white active:scale-[0.95]"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} strokeWidth={3} />}
      {children}
    </button>
  );
};

// Added className prop to Badge to fix module errors
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'info' | 'neutral' | 'danger', className?: string }> = ({ children, variant = 'neutral', className = "" }) => {
  const styles = {
    success: 'bg-emerald-500 text-black border-emerald-400',
    warning: 'bg-amber-500 text-black border-amber-400',
    info: 'bg-indigo-500 text-white border-indigo-400',
    neutral: 'bg-stone-700 text-stone-200 border-stone-600',
    danger: 'bg-red-500 text-white border-red-400'
  };
  return (
    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Added onClick prop to Card to fix module errors
export const Card: React.FC<{ children: React.ReactNode; className?: string; noPadding?: boolean; onClick?: () => void }> = ({ children, className = "", noPadding = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-[#1c272d] rounded-[2rem] border-2 border-white/5 overflow-hidden transition-all duration-300 shadow-2xl ${noPadding ? '' : 'p-6 md:p-8'} ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </div>
);

export const Modal: React.FC<any> = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className={`bg-[#111b21] rounded-[3rem] border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] ${maxWidth} w-full max-h-[95vh] flex flex-col overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">{title}</h3>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-500 hover:text-white text-stone-400 rounded-2xl transition-all shadow-xl active:scale-90"><X size={24}/></button>
        </div>
        <div className="flex-1 overflow-auto p-8 scrollbar-hide">{children}</div>
      </div>
    </div>
  );
};

export const InputGroup: React.FC<any> = ({ label, value, onChange, type = "text", suffix, placeholder }) => (
  <div className="flex flex-col gap-3">
    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">{label}</label>
    <div className="relative group">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#2a3942] border-2 border-white/10 rounded-2xl py-5 px-8 text-white font-black text-base focus:outline-none focus:border-indigo-500 focus:bg-[#32434d] transition-all placeholder:text-stone-600 shadow-inner"
      />
      {suffix && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-indigo-500 px-3 py-1.5 rounded-xl shadow-lg">
          <span className="text-white text-[10px] font-black uppercase">{suffix}</span>
        </div>
      )}
    </div>
  </div>
);
