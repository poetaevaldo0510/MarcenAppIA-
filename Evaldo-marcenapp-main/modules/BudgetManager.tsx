
import React, { useMemo, useState } from 'react';
import { Calculator, DollarSign, Package, User, FileText, Printer, Sparkles, Loader2, Scissors, ArrowRight, Save, UserPlus, FileOutput, TrendingUp, TrendingDown, Info, ShieldCheck, Target, Layers, CreditCard, Link as LinkIcon } from 'lucide-react';
import { Card, Button, InputGroup, Modal, Badge } from '../components/UI';
import { ProjectData } from '../types';
import { formatCurrency } from '../utils';
import { GoogleGenAI } from '@google/genai';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  project: ProjectData;
  onUpdate: (data: Partial<ProjectData>) => void;
  onNavigate: (m: any) => void;
}

export const BudgetManager: React.FC<Props> = ({ project, onUpdate, onNavigate }) => {
  const { addTransaction, addLead, settings, createPaymentSession, activeProjectId } = useProjectStore();
  const [loadingPitch, setLoadingPitch] = useState(false);
  const [pitch, setPitch] = useState<string>('');
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [clientName, setClientName] = useState(project.clientName || '');

  const materials = {
    mdf15_white: { name: 'MDF 15mm Branco', price: settings.mdfWhitePrice, area: 5.08 },
    mdf18_wood: { name: 'MDF 18mm Amadeirado', price: settings.mdfWoodPrice, area: 5.08 },
    mdf6_white: { name: 'MDF 6mm Fundo Branco', price: 180, area: 5.08 },
  };

  const calculation = useMemo(() => {
    const frontalArea = project.width * project.height;
    const perimeter = (project.width + project.height) * 4; 
    
    const sheetsInt = Math.ceil((frontalArea * 2.5) / 5.08);
    const sheetsExt = Math.ceil((frontalArea * 1.5) / 5.08);
    
    const costInt = sheetsInt * (materials[project.internalMaterial as keyof typeof materials]?.price || 300);
    const costExt = sheetsExt * (materials[project.externalMaterial as keyof typeof materials]?.price || 500);
    const costHard = (project.drawers * 65) + (project.doors * 25) + 350; 
    const costEdge = perimeter * settings.edgeBandPrice;
    
    const materialTotal = costInt + costExt + costHard + costEdge;
    const labor = settings.laborDailyRate * 2; 
    const overhead = (materialTotal + labor) * (settings.workshopOverhead / 100);
    
    const subtotal = materialTotal + labor + overhead;
    const taxes = subtotal * (settings.taxRate / 100);
    const profit = (subtotal + taxes) * (project.profitMargin / 100);
    const total = subtotal + taxes + profit;

    return { total, materialTotal, labor, profit, sheetsInt, sheetsExt, edgeBand: perimeter, taxes };
  }, [project, settings]);

  const generatePitch = async () => {
    setLoadingPitch(true);
    setShowPitchModal(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Atue como um vendedor de elite de marcenaria. Escreva um pitch persuasivo para WhatsApp sobre um projeto de ${project.width}x${project.height}m. O valor é ${formatCurrency(calculation.total)}. Destaque o acabamento em ${project.externalMaterial}, o uso de ferragens premium e a durabilidade. Seja elegante e direto.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setPitch(String(response.text || ''));
    } catch (err) {
      setPitch('Erro ao gerar pitch. Valor final: ' + formatCurrency(calculation.total));
    } finally {
      setLoadingPitch(false);
    }
  };

  const handleCreateCheckout = () => {
    if (!activeProjectId) return;
    createPaymentSession(activeProjectId, calculation.total, calculation.materialTotal);
    onNavigate('checkout');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">Engenharia.<span className="text-amber-500">Financeira</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Breakdown industrial de custos e lucratividade.</p>
        </div>
        <div className="flex gap-4">
           <Badge variant="success">Margem Líquida: {project.profitMargin}%</Badge>
           <Button variant="magic" icon={CreditCard} onClick={handleCreateCheckout} className="h-16 px-10 rounded-2xl">Gerar Checkout Cliente</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {/* Identificação */}
          <Card className="p-8 border-white/5">
            <h2 className="text-lg font-black italic text-amber-50 mb-8 uppercase flex items-center gap-3">
              <UserPlus className="text-amber-500" /> Detalhes do Cliente
            </h2>
            <InputGroup 
              label="Nome da Obra / Cliente" 
              value={clientName} 
              onChange={(v: string) => { setClientName(v); onUpdate({ clientName: v }); }} 
              placeholder="João Silva - Cozinha Gourmet"
            />
          </Card>

          {/* Breakdown de Custos */}
          <Card className="p-0 border-white/5 overflow-hidden">
             <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-black italic uppercase text-amber-50 flex items-center gap-3">
                   <Layers className="text-amber-500" /> Detalhamento de Insumos
                </h3>
                <Badge variant="info">Estimativa IARA</Badge>
             </div>
             <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <div className="flex justify-between items-center group">
                         <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">MDF Interno ({calculation.sheetsInt} un)</span>
                         <span className="text-xs font-black text-amber-50">{formatCurrency(calculation.sheetsInt * settings.mdfWhitePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                         <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">MDF Externo ({calculation.sheetsExt} un)</span>
                         <span className="text-xs font-black text-amber-50">{formatCurrency(calculation.sheetsExt * settings.mdfWoodPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                         <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ferragens & Acessórios</span>
                         <span className="text-xs font-black text-amber-50">{formatCurrency(project.drawers * 65 + project.doors * 25 + 350)}</span>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center group">
                         <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Fita de Borda ({calculation.edgeBand.toFixed(1)}m)</span>
                         <span className="text-xs font-black text-amber-50">{formatCurrency(calculation.edgeBand * settings.edgeBandPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                         <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Mão de Obra (Técnico)</span>
                         <span className="text-xs font-black text-amber-50">{formatCurrency(calculation.labor)}</span>
                      </div>
                      <div className="flex justify-between items-center group border-t border-white/5 pt-6">
                         <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Impostos (Estimados)</span>
                         <span className="text-xs font-black text-red-400">{formatCurrency(calculation.taxes)}</span>
                      </div>
                   </div>
                </div>
             </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="p-8 border-amber-500/10 bg-amber-500/5">
                <div className="flex items-center gap-4 mb-6">
                   <Target className="text-amber-500" />
                   <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest">Ponto de Equilíbrio</h4>
                </div>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed mb-6">
                  Para cobrir apenas os custos deste projeto, você deve cobrar no mínimo:
                </p>
                <p className="text-3xl font-black text-amber-50 italic">{formatCurrency(calculation.materialTotal + calculation.labor + calculation.taxes)}</p>
             </Card>

             <Card className="p-8 border-indigo-500/10 bg-indigo-500/5">
                <div className="flex items-center gap-4 mb-6">
                   <ShieldCheck className="text-indigo-400" />
                   <h4 className="text-sm font-black text-amber-50 uppercase tracking-widest">Margem de Segurança</h4>
                </div>
                <div className="flex items-end gap-3">
                   <p className="text-3xl font-black text-indigo-400 italic">15.0%</p>
                   <span className="text-[9px] font-bold text-stone-500 uppercase mb-2">Adicionado ao markup</span>
                </div>
                <p className="text-[9px] text-stone-600 font-bold uppercase mt-4">Proteção contra erros de medida e desperdício.</p>
             </Card>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="bg-gradient-to-br from-[#1c1917] to-black border-amber-500/40 p-10 shadow-3xl sticky top-10 ring-1 ring-amber-500/20">
              <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em]">Proposta Final Estimada</span>
              <div className="text-5xl font-black text-amber-50 mt-6 mb-12 tracking-tighter italic">
                {formatCurrency(calculation.total)}
              </div>
              
              <div className="space-y-6 mb-12">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-stone-500 text-[9px] font-black uppercase tracking-widest">Lucro Líquido Real</span>
                    <span className="text-2xl font-black text-emerald-500 italic">{formatCurrency(calculation.profit)}</span>
                 </div>
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[35%]" style={{ width: `${project.profitMargin}%` }}></div>
                 </div>
              </div>

              <div className="space-y-4">
                 <Button variant="magic" className="w-full h-16 rounded-2xl" onClick={generatePitch} icon={Sparkles}>Pitch Inteligente</Button>
                 <Button variant="primary" className="w-full h-16 rounded-2xl" onClick={() => onNavigate('export')} icon={FileOutput}>Exportar PDF</Button>
                 <Button variant="outline" className="w-full h-14 rounded-2xl border-white/5 text-stone-500" icon={LinkIcon} onClick={handleCreateCheckout}>Link de Pagamento</Button>
              </div>
           </Card>
        </div>
      </div>

      <Modal isOpen={showPitchModal} onClose={() => setShowPitchModal(false)} title="IARA Sales Pitch Expert">
        {loadingPitch ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin text-amber-500 mx-auto mb-8" size={64}/>
            <p className="text-amber-50 font-black italic uppercase text-xs tracking-widest animate-pulse">Construindo narrativa de alto valor...</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="bg-[#0c0a09] p-10 rounded-[2.5rem] border border-white/10 whitespace-pre-wrap text-[15px] text-stone-300 leading-relaxed italic shadow-inner font-medium">
              "{String(pitch)}"
            </div>
            <div className="flex gap-4">
               <Button variant="primary" className="flex-1 h-16 rounded-2xl" onClick={() => { navigator.clipboard.writeText(String(pitch)); alert("Copiado!"); }} icon={Save}>Copiar para WhatsApp</Button>
               <Button variant="secondary" className="px-12 h-16 rounded-2xl" onClick={() => setShowPitchModal(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
