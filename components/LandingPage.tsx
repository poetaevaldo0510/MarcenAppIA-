
import React from 'react';
import { LogoIcon, SparklesIcon, ToolsIcon, BlueprintIcon, CurrencyDollarIcon, CheckIcon, ArrowRightIcon } from './Shared';

interface LandingPageProps {
  onStart: () => void;
}

const BenefitCard = ({ icon: Icon, title, desc, delay }: any) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] hover:border-[#d4ac6e]/50 transition-all group animate-fadeInUp shadow-2xl" style={{ animationDelay: delay }}>
    <div className="bg-[#d4ac6e]/10 w-16 h-16 rounded-2xl flex items-center justify-center text-[#d4ac6e] mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-3">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-[#d4ac6e] selection:text-black">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#d4ac6e]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3e3535]/20 blur-[100px] rounded-full"></div>
      </div>

      <nav className="relative z-50 flex justify-between items-center px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white/5 p-2.5 rounded-2xl text-white/40 border border-white/10">
            <LogoIcon className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black uppercase italic tracking-tighter opacity-80">MarcenaPP</span>
        </div>
        <button onClick={onStart} className="bg-white/5 hover:bg-[#d4ac6e] hover:text-black border border-white/10 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">Acessar Oficina</button>
      </nav>

      <section className="relative z-10 pt-12 md:pt-20 pb-24 px-6 md:px-10 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#d4ac6e]/10 border border-[#d4ac6e]/20 px-5 py-2.5 rounded-full mb-10 animate-fadeIn">
          <SparklesIcon className="w-4 h-4 text-[#d4ac6e]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4ac6e]">IA Especializada em Marcenaria Profissional</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] mb-10 animate-fadeInUp">
          Venda em <span className="text-[#d4ac6e]">Segundos</span>,<br/>Fabrique em Dias.
        </h1>
        <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto mb-16 font-medium leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          O MarcenaPP resolve o "Vale da Morte" do projeto: o tempo perdido entre o rascunho de papel e o fechamento do contrato. IA de alto nível no seu bolso.
        </p>
        <button onClick={onStart} className="bg-[#d4ac6e] text-black font-black py-7 px-16 rounded-[2.5rem] shadow-[0_25px_60px_rgba(212,172,110,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm group">
          Começar Obra Agora <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </button>
      </section>

      {/* SEÇÃO ESTRATÉGICA: DOR VS SOLUÇÃO */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 mb-5">O Problema do Mercado</h2>
              <p className="text-4xl font-black uppercase italic tracking-tighter leading-none">Onde o marceneiro <span className="text-gray-500">perde dinheiro?</span></p>
            </div>
            <div className="space-y-6">
              {[
                "Lentidão: Dias para fazer um render no SketchUp/Promob.",
                "Incerteza: Erros no plano de corte geram desperdício de MDF.",
                "Venda: O cliente não visualiza o projeto e desiste do orçamento.",
                "Burocracia: Falta de contratos profissionais gera insegurança jurídica."
              ].map((txt, i) => (
                <div key={i} className="flex gap-4 items-start border-l-2 border-red-500/20 pl-6">
                  <p className="text-sm font-bold text-gray-400">{txt}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#120e0e] rounded-[3.5rem] p-12 border border-[#d4ac6e]/30 shadow-3xl">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#d4ac6e] mb-5">A Revolução MarcenaPP</h2>
            <p className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-10 text-white">Produtividade <span className="text-[#d4ac6e]">Industrial</span>.</p>
            <div className="space-y-8">
              {[
                { t: "Iara Vision", d: "Foto de rascunho vira render 8K instantaneamente." },
                { t: "Engenharia Automática", d: "BOM e Plano de Corte gerados por lógica de oficina." },
                { t: "Venda na Hora", d: "Apresente o projeto em AR no ambiente do cliente." },
                { t: "Ecossistema", d: "Envio direto da lista para o balcão do fornecedor." }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="bg-[#d4ac6e] p-1.5 rounded-lg h-fit mt-1"><CheckIcon className="w-3 h-3 text-black" /></div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-white mb-1">{item.t}</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <BenefitCard icon={SparklesIcon} title="Venda 8K" desc="Impacto visual imediato que fecha contratos na primeira visita." delay="0.1s" />
          <BenefitCard icon={BlueprintIcon} title="Corte IA" desc="Otimização de chapas para desperdício zero na sua serra." delay="0.2s" />
          <BenefitCard icon={CurrencyDollarIcon} title="Preço Real" desc="Orçamentos precisos baseados no custo atual do MDF." delay="0.3s" />
          <BenefitCard icon={ToolsIcon} title="Dossiê PDF" desc="Documentação profissional com sua logo em segundos." delay="0.4s" />
        </div>
      </section>

      <footer className="relative z-10 py-24 border-t border-white/5 bg-black/40 text-center">
        <LogoIcon className="w-10 h-10 mx-auto opacity-20 mb-8" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">MarcenaPP © 2025 • Aljariri Startups</p>
      </footer>
    </div>
  );
};
