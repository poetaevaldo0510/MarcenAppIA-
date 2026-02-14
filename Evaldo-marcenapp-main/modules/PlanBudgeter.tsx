
import React, { useState } from 'react';
import { 
  Upload, Scan, FileText, CheckCircle2, AlertTriangle, 
  ArrowRight, Loader2, Home, Layout, Ruler, 
  DollarSign, Sparkles, X, ChevronRight, Calculator
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../components/UI';
import { useProjectStore } from '../store/useProjectStore';
import { GoogleGenAI, Type } from '@google/genai';
import { formatCurrency } from '../utils';

interface RoomResult {
  name: string;
  area: number;
  furnitureType: string;
  estimatedLinearMeters: number;
  estimatedValue: number;
}

export const PlanBudgeter: React.FC = () => {
  const { addLead } = useProjectStore();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RoomResult[] | null>(null);
  const [totalEstimate, setTotalEstimate] = useState(0);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzePlan = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      
      const prompt = `Analise esta planta imobiliária. 
      Identifique cada cômodo, a área (m²) e estime a marcenaria necessária.
      Padrão de custo: R$ 3.500 por metro linear de armário.
      Retorne um JSON estrito.
      Exemplo: [{"name": "Cozinha", "area": 12, "furnitureType": "Armários Planejados", "estimatedLinearMeters": 4.5, "estimatedValue": 15750}]`;

      // Optimized for complex reasoning on image data
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: 'image/png' } }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      setResults(parsed);
      setTotalEstimate(parsed.reduce((acc: number, r: RoomResult) => acc + r.estimatedValue, 0));
    } catch (err) {
      alert("Erro ao ler planta. Tente uma imagem mais nítida.");
    } finally {
      setLoading(false);
    }
  };

  const saveAsOpportunity = () => {
    if (!results) return;
    addLead({
      name: `Apartamento via Planta - ${new Date().toLocaleDateString()}`,
      phone: '',
      status: 'new',
      estimatedValue: totalEstimate
    });
    alert("Oportunidade salva no CRM!");
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">AutoBudget</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Orçamento instantâneo via análise de planta baixa.</p>
        </div>
        <Badge variant="info">Vision v4.2 Alpha</Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Lado do Upload */}
        <div className="lg:col-span-5 space-y-6">
          <Card className={`h-[450px] border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all ${image ? 'border-amber-500/50' : 'border-stone-800'}`}>
            {!image ? (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                 <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mb-6">
                    <Upload size={32} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Upload da Planta (PNG/JPG)</p>
                 <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
              </label>
            ) : (
              <>
                <img src={image} className="w-full h-full object-contain opacity-40 p-10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                   <div className="w-24 h-24 border-2 border-amber-500 rounded-full animate-ping opacity-20"></div>
                   <button onClick={() => setImage(null)} className="p-4 bg-black/80 text-white rounded-2xl hover:bg-red-600 transition-all shadow-2xl"><X size={24}/></button>
                </div>
              </>
            )}
          </Card>

          <Button 
            variant="magic" 
            className="w-full h-20 rounded-3xl" 
            onClick={analyzePlan} 
            disabled={loading || !image}
            icon={loading ? Loader2 : Scan}
          >
            {loading ? <span className="animate-pulse">IARA está Medindo...</span> : 'Escanear Planta'}
          </Button>

          <Card className="p-8 border-indigo-500/10 bg-indigo-500/5">
             <div className="flex items-start gap-5">
                <Sparkles className="text-indigo-400 shrink-0" size={24}/>
                <div>
                   <h4 className="text-[10px] font-black text-amber-50 uppercase tracking-widest">IA de Reconhecimento Geométrico</h4>
                   <p className="text-[9px] text-stone-500 font-bold uppercase leading-relaxed mt-2 tracking-widest">O motor Vision identifica paredes, nichos e áreas molhadas para sugerir a marcenaria ideal.</p>
                </div>
             </div>
          </Card>
        </div>

        {/* Lado dos Resultados */}
        <div className="lg:col-span-7">
           <Card className="min-h-[600px] bg-black border-white/5 p-12 flex flex-col relative overflow-hidden">
              {!results ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                   <Layout size={80} className="mb-8" />
                   <h3 className="text-xl font-black uppercase italic tracking-tighter">Aguardando Planta</h3>
                   <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-4">Os resultados aparecerão aqui após o scan.</p>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
                   <div className="flex justify-between items-end border-b border-white/5 pb-8">
                      <div>
                         <h3 className="text-3xl font-black text-amber-50 italic uppercase tracking-tighter">Orçamento Global</h3>
                         <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mt-1">Estimativa técnica para projeto completo.</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-stone-600 font-black uppercase mb-1">Total Aproximado</p>
                         <p className="text-4xl font-black text-amber-50 tracking-tighter italic">{formatCurrency(totalEstimate)}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Ambientes Detectados</p>
                      <div className="grid grid-cols-1 gap-4">
                         {results.map((room, i) => (
                           <div key={i} className="group p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Home size={24} />
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-black text-amber-50 uppercase tracking-tighter">{room.name}</h4>
                                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">{room.area}m² • {room.furnitureType}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-black text-amber-50">{formatCurrency(room.estimatedValue)}</p>
                                 <p className="text-[8px] text-stone-700 font-black uppercase">~{room.estimatedLinearMeters}m Lineares</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-16 rounded-2xl border-white/10" icon={Calculator}>Ver Detalhes do Markup</Button>
                      <Button variant="primary" className="h-16 rounded-2xl" icon={ChevronRight} onClick={saveAsOpportunity}>Salvar no Funil</Button>
                   </div>
                </div>
              )}
           </Card>
        </div>
      </div>
    </div>
  );
};
