
import React, { useState } from 'react';
import { Scale, Sparkles, Plus, Printer, Trash2, Loader2, BookOpen, AlertCircle, FileText, ShieldCheck, Landmark, Gavel } from 'lucide-react';
import { Card, Button, InputGroup, Modal, Badge } from '../components/UI';
import { generateLegalClause } from '../geminiService';

export const LegalAssistant: React.FC = () => {
  const [client, setClient] = useState('Cliente Exemplo');
  const [value, setValue] = useState(15000);
  const [clauses, setClauses] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const handleAddClause = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    try {
      const res = await generateLegalClause(aiPrompt);
      setClauses([...clauses, res.text]);
      setAiPrompt('');
    } catch (err) {
      alert("Erro ao consultar Dr. Ademir");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Proteção contra paredes tortas",
    "Instalação em Drywall",
    "Acessórios do cliente",
    "Atraso por falta de luz no local"
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">Legal</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Dr. Ademir: Blindagem jurídica para marcenarias de alto padrão.</p>
        </div>
        <div className="flex gap-4">
           <Badge variant="info">Motor Gemini 3 Pro Ativo</Badge>
           <Badge variant="success">CDC 2024 Compliance</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-8">
          <Card className="p-8 border-white/5 shadow-2xl">
             <h2 className="text-lg font-black italic text-amber-50 mb-10 uppercase flex items-center gap-3">
               <Landmark className="text-amber-500" /> Dados Contratuais
             </h2>
             <div className="space-y-6">
                <InputGroup label="Nome Completo do Cliente" value={client} onChange={setClient} placeholder="CPF/CNPJ e Nome"/>
                <InputGroup label="Valor do Contrato (R$)" type="number" value={value} onChange={setValue} suffix="BRL"/>
                <div className="pt-6 border-t border-white/5">
                   <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Garantia Estrutural</p>
                   <select className="w-full bg-[#292524] border border-white/5 rounded-2xl py-4.5 px-6 text-white font-bold text-sm outline-none">
                      <option>05 Anos (MDF Premium)</option>
                      <option>01 Ano (Ferragens Standard)</option>
                      <option>Vitalícia (Fidelidade Workshop.OS)</option>
                   </select>
                </div>
             </div>
          </Card>

          <Card className="p-8 border-indigo-500/10 bg-indigo-500/5">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Gavel size={24}/>
                 </div>
                 <h3 className="text-lg font-black italic uppercase text-amber-50">Dr. Ademir AI</h3>
              </div>
              
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-6 leading-relaxed italic">
                "Descreva um risco técnico (ex: parede com infiltração) e eu redigirei uma cláusula que te protege de reclamações futuras."
              </p>

              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ex: Cliente vai instalar o mármore depois..."
                className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 text-sm text-white h-32 mb-6 focus:border-indigo-500 outline-none transition-all resize-none"
              />

              <div className="flex flex-wrap gap-2 mb-8">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setAiPrompt(s)} className="px-4 py-2 bg-white/5 rounded-full text-[8px] font-black text-stone-400 uppercase hover:bg-indigo-500 hover:text-white transition-all border border-white/5">{s}</button>
                ))}
              </div>

              <Button variant="magic" className="w-full h-16 rounded-2xl" onClick={handleAddClause} disabled={loading || !aiPrompt}>
                {loading ? <Loader2 className="animate-spin"/> : 'Redigir Cláusula de Proteção'}
              </Button>
          </Card>

          <Button variant="primary" className="w-full h-20 rounded-3xl" icon={Printer} onClick={() => setShowPrint(true)}>Gerar Contrato Completo</Button>
        </div>

        <div className="lg:col-span-8">
          <Card className="bg-white min-h-[900px] shadow-3xl p-16 font-serif text-slate-900 border-t-[16px] border-amber-600 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Scale size={300}/></div>
            
            <header className="text-center mb-20 relative z-10">
              <h1 className="text-3xl font-bold uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-4 inline-block italic">Contrato de Marcenaria Sob Medida</h1>
              <p className="text-xs mt-6 font-bold tracking-widest uppercase text-slate-500">Documento Gerado via Workshop.OS • ID: {Date.now().toString().slice(-6)}</p>
            </header>

            <section className="space-y-10 text-[15px] leading-loose text-justify relative z-10">
              <p>
                <strong>IDENTIFICAÇÃO DAS PARTES:</strong> Pelo presente instrumento particular, de um lado a <strong>CONTRATADA (MARCENARIA MESTRE)</strong>, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, e de outro lado <strong>{client}</strong>, doravante denominado <strong>CONTRATANTE</strong>, celebram este pacto jurídico sob as seguintes condições:
              </p>

              <div>
                <h3 className="font-extrabold uppercase text-xs tracking-widest mb-4 border-l-4 border-amber-500 pl-4">CLÁUSULA 1ª - DO OBJETO TÉCNICO</h3>
                <p>O objeto deste contrato é a fabricação, transporte e montagem de móveis planejados conforme projeto 3D aprovado e memorial descritivo anexo, cujas medidas foram extraídas em visita técnica prévia.</p>
              </div>

              <div>
                <h3 className="font-extrabold uppercase text-xs tracking-widest mb-4 border-l-4 border-amber-500 pl-4">CLÁUSULA 2ª - VALORES E PAGAMENTOS</h3>
                <p>O valor global pactuado é de <strong>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, a ser quitado conforme cronograma financeiro acordado no ato desta assinatura.</p>
              </div>

              {clauses.map((c, i) => (
                <div key={i} className="bg-amber-50/80 p-8 rounded-3xl relative group border border-amber-200/50 italic text-amber-950 animate-in slide-in-from-right duration-500">
                  <button 
                    onClick={() => setClauses(clauses.filter((_, idx) => idx !== i))}
                    className="absolute top-4 right-4 p-2 text-amber-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16}/>
                  </button>
                  <h3 className="font-bold uppercase text-[10px] mb-3 text-amber-700 tracking-widest">ADENDO DE PROTEÇÃO TÉCNICA {i + 1} (IA DR. ADEMIR):</h3>
                  <p className="font-medium">"{c}"</p>
                </div>
              ))}

              <div className="pt-32 grid grid-cols-2 gap-24">
                <div className="border-t border-slate-900 pt-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">P/ CONTRATADA</p>
                  <p className="text-[8px] text-slate-400 mt-1 italic">Mestre Marceneiro Responsável</p>
                </div>
                <div className="border-t border-slate-900 pt-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">{client.split(' ')[0].toUpperCase()}</p>
                  <p className="text-[8px] text-slate-400 mt-1 italic">Contratante</p>
                </div>
              </div>
            </section>
          </Card>
        </div>
      </div>

      <Modal isOpen={showPrint} onClose={() => setShowPrint(false)} title="Conclusão Jurídica">
         <div className="space-y-8">
            <div className="bg-emerald-500/10 p-8 rounded-3xl border border-emerald-500/20 flex items-start gap-6">
               <ShieldCheck className="text-emerald-500 shrink-0" size={32}/>
               <div>
                  <p className="font-black text-emerald-50 text-base italic uppercase tracking-tighter">Documento Blindado!</p>
                  <p className="text-stone-500 text-[10px] font-bold uppercase mt-2 tracking-widest leading-relaxed">
                    Mestre, as cláusulas geradas garantem que variações de alvenaria e mármores de terceiros não afetem sua garantia. 
                  </p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Button variant="outline" className="h-16 rounded-2xl border-white/10 text-stone-500" onClick={() => window.print()}>Gerar PDF</Button>
               <Button variant="magic" className="h-16 rounded-2xl" icon={Send} onClick={() => { alert("Contrato enviado para assinatura digital!"); setShowPrint(false); }}>Enviar para DocuSign</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

// Missing Send icon needed for Legal
const Send = ({size}: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
);
