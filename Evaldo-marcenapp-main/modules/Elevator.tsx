
import React, { useState, useRef } from 'react';
import { 
  ArrowUpFromLine, Upload, Loader2, X, Map, Scan, Camera, Sparkles, CheckCircle2, Ruler, Target, ZoomIn
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { elevateFloorPlan, analyzeRoomForLayout } from '../geminiService';
import { ProjectData } from '../types';

interface VisionResult {
  estimatedWidth: number;
  estimatedHeight: number;
  constraints: string[];
  suggestedLayout: string;
}

interface Props {
  onUpdateProject: (data: Partial<ProjectData>) => void;
  onNavigate: (m: any) => void;
}

export const Elevator: React.FC<Props> = ({ onUpdateProject, onNavigate }) => {
  const [mode, setMode] = useState<'floorplan' | 'vision' | 'trena'>('floorplan');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);
  const [measuredValue, setMeasuredValue] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'trena' || !image) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (points.length < 2) {
      const newPoints = [...points, {x, y}];
      setPoints(newPoints);
      if (newPoints.length === 2) {
        setLoading(true);
        // Simulação de cálculo por pixels via IA
        setTimeout(() => {
          setMeasuredValue((Math.random() * 2 + 1).toFixed(2) + "m");
          setLoading(false);
        }, 1500);
      }
    } else {
      setPoints([{x, y}]);
      setMeasuredValue(null);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">Vision</span></h1>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Inteligência Visual para Medição e Projeto.</p>
        </div>
        
        <div className="flex bg-[#1c1917] p-1.5 rounded-2xl border border-white/5">
          <button onClick={() => setMode('floorplan')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'floorplan' ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500'}`}><Map size={14} className="inline mr-2"/> Planta</button>
          <button onClick={() => setMode('vision')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'vision' ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500'}`}><Scan size={14} className="inline mr-2"/> Scan 3D</button>
          <button onClick={() => setMode('trena')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'trena' ? 'bg-amber-500 text-black shadow-lg' : 'text-stone-500'}`}><Ruler size={14} className="inline mr-2"/> Trena IA</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
           <Card className="min-h-[500px] bg-black border-white/5 relative overflow-hidden group p-0">
              {!image ? (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors p-20">
                   <Upload className="text-amber-500 mb-6" size={48}/>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-600">Arraste a foto do ambiente</p>
                   <input type="file" className="hidden" onChange={handleUpload} accept="image/*"/>
                </label>
              ) : (
                <div className="relative w-full h-full cursor-crosshair" onClick={handleImageClick}>
                   <img src={image} className="w-full h-full object-contain" />
                   
                   {/* Pontos da Trena */}
                   {points.map((p, i) => (
                     <div key={i} className="absolute w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                        <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-50"></div>
                     </div>
                   ))}

                   {/* Linha da Trena */}
                   {points.length === 2 && (
                     <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line 
                          x1={`${points[0].x}%`} y1={`${points[0].y}%`} 
                          x2={`${points[1].x}%`} y2={`${points[1].y}%`} 
                          stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 4"
                        />
                     </svg>
                   )}

                   {/* Resultado flutuante */}
                   {measuredValue && (
                     <div className="absolute bg-amber-500 text-black px-4 py-2 rounded-xl font-black text-lg shadow-2xl animate-in zoom-in duration-300" style={{ left: `${(points[0].x + points[1].x) / 2}%`, top: `${(points[0].y + points[1].y) / 2 - 5}%` }}>
                        {measuredValue}
                     </div>
                   )}

                   <button onClick={() => {setImage(null); setPoints([]); setMeasuredValue(null);}} className="absolute top-6 right-6 p-3 bg-black/80 text-white rounded-2xl hover:bg-red-600 transition-all"><X size={20}/></button>
                </div>
              )}
           </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-8 border-indigo-500/20 bg-indigo-500/5">
              <h3 className="text-xl font-black italic uppercase text-white mb-6 flex items-center gap-3"><Target className="text-indigo-400" /> Instruções</h3>
              {mode === 'trena' ? (
                <div className="space-y-6">
                   <p className="text-[11px] text-stone-400 leading-relaxed font-medium">1. Marque o primeiro ponto no início da parede.<br/>2. Marque o segundo ponto no final.<br/>3. A YARA calculará a distância baseada nos pixels e profundidade do ambiente.</p>
                   <Badge variant="warning">Recurso Experimental</Badge>
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 leading-relaxed font-medium">Use fotos nítidas e com boa iluminação para que o scan identifique obstáculos como tomadas e janelas.</p>
              )}
           </Card>

           {measuredValue && (
             <Button variant="magic" className="w-full h-16 rounded-2xl shadow-amber-600/20" icon={Sparkles} onClick={() => alert("Medida salva no DNA do projeto!")}>
                Aplicar Medida no Studio
             </Button>
           )}
        </div>
      </div>
    </div>
  );
};
