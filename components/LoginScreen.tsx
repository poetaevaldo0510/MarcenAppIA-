
import React, { useState } from 'react';
import { LogoIcon, Spinner, LockIcon, UserIcon, SparklesIcon, WhatsappIcon, ToolsIcon, CubeIcon } from './Shared';
import type { UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (email: string, role: UserRole, isNewUser: boolean, phone?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('marceneiro');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "E-mail é obrigatório.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Formato de e-mail inválido.";
    }

    if (activeTab === 'register') {
      if (!phone.trim()) {
        newErrors.phone = "WhatsApp é obrigatório.";
      } else if (phone.replace(/\D/g, '').length < 10) {
        newErrors.phone = "Número incompleto (DDD + Número).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(cleanEmail, role, activeTab === 'register', phone);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-[#d4ac6e]/5 blur-[120px] rounded-full animate-pulse"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fadeInUp">
        <div className="bg-[#0e0c0c]/80 backdrop-blur-xl rounded-[3.5rem] border border-white/5 p-8 md:p-12 shadow-3xl text-center">
          
          <div className="flex flex-col items-center mb-10">
            <div className="bg-[#1a1414] p-5 rounded-[2rem] text-[#d4ac6e] border border-white/5 shadow-2xl mb-6">
              <LogoIcon className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
              Oficina <span className="text-[#d4ac6e]">Digital</span>
            </h1>
          </div>

          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-8">
            <button 
              onClick={() => { setActiveTab('register'); setErrors({}); }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-[#d4ac6e] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Novo Mestre
            </button>
            <button 
              onClick={() => { setActiveTab('login'); setErrors({}); }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-[#d4ac6e] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Entrar
            </button>
          </div>

          <form onSubmit={handleAction} className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">E-mail Profissional</label>
              <div className="relative">
                <div className={`absolute left-6 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-500' : 'text-white/10'}`}><UserIcon className="w-5 h-5" /></div>
                <input 
                  type="email" value={email} onChange={e => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }} 
                  placeholder="ex: mestre@marcenaria.com" 
                  className={`w-full bg-[#121010] border rounded-3xl p-6 pl-16 text-white font-bold outline-none transition-all ${errors.email ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-white/5 focus:border-[#d4ac6e]'}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-[9px] font-black uppercase ml-4 mt-1 animate-fadeIn">{errors.email}</p>}
            </div>

            {activeTab === 'register' && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">WhatsApp</label>
                <div className="relative">
                  <div className={`absolute left-6 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-500' : 'text-white/10'}`}><WhatsappIcon className="w-5 h-5" /></div>
                  <input 
                    type="tel" value={phone} onChange={e => { setPhone(e.target.value); if(errors.phone) setErrors({...errors, phone: ''}); }} 
                    placeholder="(00) 00000-0000" 
                    className={`w-full bg-[#121010] border rounded-3xl p-6 pl-16 text-white font-bold outline-none transition-all ${errors.phone ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-white/5 focus:border-[#d4ac6e]'}`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[9px] font-black uppercase ml-4 mt-1 animate-fadeIn">{errors.phone}</p>}
              </div>
            )}

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-[#d4ac6e] text-black font-black py-7 rounded-[2.5rem] uppercase tracking-[0.3em] text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-4"
            >
              {isLoading ? <Spinner size="sm" /> : <span>{activeTab === 'register' ? 'Inicializar Oficina' : 'Abrir Bancada'}</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
