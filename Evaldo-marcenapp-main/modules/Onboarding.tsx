
import React, { useState } from 'react';
import { 
  Sparkles, Bot, Zap, Hammer, ShieldCheck, 
  ChevronRight, ChevronLeft, X, Building2,
  Users, Home, Ruler, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '../components/UI';
import { Logo } from '../components/Logo';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  onFinish: () => void;
}

export const Onboarding: React.FC<Props> = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const { setWorkshopSize, completeOnboarding } = useProjectStore();

  const handleFinalize = async (size: 'small' | 'medium' | 'large') => {
    setFinalizing(true);
    setWorkshopSize(size);
    await new Promise(r => setTimeout(r, 1200));
    completeOnboarding();
    onFinish();
  };

  const steps = [
    {
      title: "Seu Novo Braço Direito",
      desc: "O MarcenaPP transforma rascunhos e áudios em projetos 3D e planos de corte.",
      icon: <Logo size={70} />,
      color: "from-indigo-600 to-indigo-900"
    },
    {
      title: "Como você trabalha?",
      desc: "Isso ajustará as ferramentas para o seu dia a dia.",
      icon: <Building2 size={40} className="text-amber-500" />,
      isSelection: true,
      color: "from-amber-600 to-amber-900"
    }
  ];

  const current = steps[step];

  if (finalizing) {
    return (
      <div className="fixed inset-0 z-[600] bg-[#0d1418] flex flex-col items-center justify-center p-6">
         <Loader2 className="text-indigo-500 animate-spin mb-6" size={64} strokeWidth={3}/>
         <h2 className="text-2xl font-black italic uppercase text-white">Sincronizando Oficina...</h2>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#0d1418] flex items-center justify-center p-4 overflow-y-auto">
      <div className={`absolute inset-0 bg-gradient-to-br ${current.color} opacity-10 transition-all duration-1000 fixed`}></div>
      
      <div className="w-full max-w-lg relative z-10 space-y-6 py-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center px-4">
           <div className="inline-block mb-4 transform hover:scale-105 transition-all">
              {current.icon}
           </div>
           <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-2 leading-tight">
             {current.title}
           </h2>
           <p className="text-stone-400 text-xs md:text-sm font-medium italic">
             "{current.desc}"
           </p>
        </div>

        {current.isSelection ? (
          <div className="flex flex-col gap-2.5 px-2">
            {[
              { id: 'small', label: 'Pequena', icon: Home, color: 'text-amber-500', desc: 'Orçamentos rápidos e corte.' },
              { id: 'medium', label: 'Média', icon: Users, color: 'text-indigo-400', desc: 'Equipe e fluxo de compras.' },
              { id: 'large', label: 'Indústria', icon: Building2, color: 'text-emerald-500', desc: 'Múltiplas obras e BI avançado.' }
            ].map((opt) => (
              <button 
                key={opt.id}
                onClick={() => handleFinalize(opt.id as any)}
                className="p-4 bg-[#1c272d] border-2 border-white/5 rounded-[1.2rem] hover:border-indigo-500/50 transition-all flex items-center gap-5 group active:scale-95 shadow-xl text-left"
              >
                <div className={`${opt.color} bg-white/5 p-3 rounded-xl group-hover:scale-110 transition-transform shrink-0`}>
                  <opt.icon size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white uppercase leading-none">{opt.label}</h3>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1 truncate">{opt.desc}</p>
                </div>
                <ChevronRight className="ml-auto text-stone-700 group-hover:text-white shrink-0" size={18} />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex justify-center pt-4">
            <Button variant="magic" className="h-14 px-10 rounded-full text-xs shadow-2xl" onClick={() => setStep(1)} icon={ChevronRight}>
              Começar Agora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
