
import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, Loader2, Factory, Sparkles, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, InputGroup, Card } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useProjectStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    
    // Simulação de processamento mestre
    await new Promise(r => setTimeout(r, 1000));
    const success = login(email, password);
    
    if (!success) {
      setError("Credenciais administrativas inválidas.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0d1418] flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 opacity-10 pointer-events-none fixed">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>

      <div className="w-full max-w-sm space-y-6 relative z-10 animate-in fade-in zoom-in duration-700">
         <div className="text-center space-y-4">
            <div className="relative inline-block group">
               <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
               <Logo size={90} className="relative transform group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
               <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
                  Marcena<span className="text-indigo-500">PP</span>
               </h1>
               <p className="text-stone-500 text-[8px] font-black uppercase tracking-[0.4em] mt-2">Sistema Operacional de Ecossistema</p>
            </div>
         </div>

         <Card className="p-6 border-white/5 bg-[#1c1917]/80 backdrop-blur-xl shadow-3xl ring-1 ring-white/10">
            <div className="flex items-center gap-3 mb-6 px-1">
               <ShieldCheck className="text-indigo-500" size={16} />
               <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Portal de Governança</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
               <InputGroup label="E-MAIL" type="email" placeholder="mestre@marcenapp.com.br" value={email} onChange={setEmail} />
               <InputGroup label="CHAVE DE ACESSO" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
               
               {error && (
                 <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <AlertCircle className="text-red-500 shrink-0" size={18}/>
                    <p className="text-[9px] font-black text-red-400 uppercase leading-tight">{error}</p>
                 </div>
               )}

               <div className="pt-2">
                  <Button variant="primary" className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-600/20" type="submit" disabled={loading || !email}>
                    {loading ? <Loader2 className="animate-spin" size={20}/> : 'Entrar no Ecossistema'}
                  </Button>
               </div>
            </form>
         </Card>
      </div>
    </div>
  );
};
