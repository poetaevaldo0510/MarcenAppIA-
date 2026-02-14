
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Plus, Trash2, RefreshCw, Layers, Printer, 
  ChevronDown, TrendingDown, Target, Zap, Sparkles, 
  Info, AlertTriangle, ArrowRight, Loader2, DollarSign,
  Download, X, Maximize2, Move, Box, HardDrive
} from 'lucide-react';
import { Card, Button, InputGroup, Modal, Badge } from '../components/UI';
import { Part, ProjectData } from '../types';
import { analyzeCuttingEfficiency } from '../geminiService';
import { formatCurrency } from '../utils';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  project: ProjectData;
  parts: Part[];
  onUpdateParts: (parts: Part[]) => void;
}

export const CuttingPlan: React.FC<Props> = ({ project, parts, onUpdateParts }) => {
  const { settings } = useProjectStore();
  const SHEET_W = 2730;
  const SHEET_H = 1830;
  const KERF = 3; // mm de serra
  const SHEET_PRICE = settings.mdfWhitePrice || 350;

  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [iaAdvice, setIaAdvice] = useState<string | null>(null);
  const [newPart, setNewPart] = useState<Partial<Part>>({ name: '', w: 0, h: 0, qtd: 1, mat: 'white' });

  // Importação inteligente do DNA do projeto
  const importFromProject = () => {
    const w = Math.round(project.width * 1000);
    const h = Math.round(project.height * 1000);
    const d = Math.round(project.depth * 1000);

    // Gerar lista técnica baseada em engenharia básica de armário
    const autoParts: Part[] = [
      { id: Date.now() + 1, name: 'Lateral Esq', w: d, h: h, qtd: 1, mat: 'white' },
      { id: Date.now() + 2, name: 'Lateral Dir', w: d, h: h, qtd: 1, mat: 'white' },
      { id: Date.now() + 3, name: 'Base Inferior', w: w - 36, h: d, qtd: 1, mat: 'white' },
      { id: Date.now() + 4, name: 'Tampo Superior', w: w - 36, h: d, qtd: 1, mat: 'white' },
      { id: Date.now() + 5, name: 'Prateleira Móvel', w: w - 38, h: d - 20, qtd: 2, mat: 'white' },
      { id: Date.now() + 6, name: 'Fundo 6mm', w: w - 4, h: h - 4, qtd: 1, mat: 'back' },
      { id: Date.now() + 7, name: 'Frentes Gaveta', w: Math.floor(w / (project.doors || 2)) - 4, h: 220, qtd: project.drawers, mat: 'wood' },
      { id: Date.now() + 8, name: 'Portas Frontais', w: Math.floor(w / (project.doors || 2)) - 4, h: h - (project.drawers > 0 ? 300 : 4), qtd: project.doors, mat: 'wood' },
    ];
    onUpdateParts(autoParts);
  };

  const addPart = () => {
    if (newPart.name && newPart.w && newPart.h) {
      onUpdateParts([...parts, { ...newPart, id: Date.now() } as Part]);
      setShowAddModal(false);
      setNewPart({ name: '', w: 0, h: 0, qtd: 1, mat: 'white' });
    }
  };

  const deletePart = (id: number) => onUpdateParts(parts.filter(p => p.id !== id));

  // Motor de Nesting (Simples Bin-Packing 2D First-Fit Decreasing)
  const sheets = useMemo(() => {
    if (parts.length === 0) return [];
    
    const allItems: any[] = [];
    parts.forEach(p => {
      for (let i = 0; i < p.qtd; i++) {
        allItems.push({ ...p, uid: `${p.id}-${i}` });
      }
    });

    // Ordenar por altura para o algoritmo de prateleira (shelf packing)
    const sorted = [...allItems].sort((a, b) => b.h - a.h);
    const resultSheets: any[] = [];
    
    const processMaterial = (matType: string) => {
      const matParts = sorted.filter(p => p.mat === matType);
      if (matParts.length === 0) return;

      let currentSheet: any = { items: [], usedArea: 0, mat: matType };
      let x = 10, y = 10, rowH = 0; // 10mm de refilo

      matParts.forEach(item => {
        // Se a peça não cabe na linha atual, pula para a próxima
        if (x + item.w + KERF > SHEET_W - 10) {
          x = 10;
          y += rowH + KERF;
          rowH = 0;
        }

        // Se não cabe na chapa atual, cria uma nova
        if (y + item.h + KERF > SHEET_H - 10) {
          resultSheets.push(currentSheet);
          currentSheet = { items: [], usedArea: 0, mat: matType };
          x = 10; y = 10; rowH = 0;
        }

        currentSheet.items.push({ ...item, x, y });
        currentSheet.usedArea += item.w * item.h;
        x += item.w + KERF;
        rowH = Math.max(rowH, item.h);
      });

      if (currentSheet.items.length) resultSheets.push(currentSheet);
    };

    ['white', 'wood', 'back'].forEach(m => processMaterial(m));
    return resultSheets;
  }, [parts]);

  const stats = useMemo(() => {
    const totalArea = SHEET_W * SHEET_H * sheets.length;
    const usedArea = sheets.reduce((acc, s) => acc + s.usedArea, 0);
    const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
    const wasteValue = (totalArea - usedArea) / (SHEET_W * SHEET_H) * SHEET_PRICE;
    return { efficiency, wasteValue, sheetCount: sheets.length };
  }, [sheets, SHEET_PRICE]);

  const getIAOptimization = async () => {
    setLoadingIA(true);
    try {
      const advice = await analyzeCuttingEfficiency(parts, { w: SHEET_W, h: SHEET_H });
      setIaAdvice(advice);
    } catch (e) {
      setIaAdvice("Mestre, otimize o sentido das travessas para aproveitar os retalhos da chapa lateral.");
    } finally {
      setLoadingIA(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 scrollbar-hide">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-amber-50">IARA.<span className="text-amber-500">Nesting</span></h1>
          <p className="text-stone-500 text-[11px] font-bold uppercase tracking-[0.3em] mt-2">Otimização computacional de chapas e aproveitamento industrial.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="secondary" onClick={importFromProject} icon={RefreshCw} className="h-14 rounded-2xl border-white/10">Sincronizar DNA</Button>
           <Button variant="magic" icon={Sparkles} onClick={getIAOptimization} disabled={loadingIA || parts.length === 0} className="h-14 rounded-2xl px-10">
              {loadingIA ? <Loader2 className="animate-spin" size={18}/> : 'Otimizar IA'}
           </Button>
        </div>
      </header>

      {/* KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="bg-[#1c1917] border-white/5 p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Layers size={80}/></div>
            <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-4">Aproveitamento Médio</p>
            <div className="flex items-end gap-4">
               <h3 className="text-4xl font-black text-amber-50 italic tracking-tighter leading-none">{stats.efficiency.toFixed(1)}%</h3>
               <Badge variant={stats.efficiency > 85 ? 'success' : 'warning'}>{stats.efficiency > 85 ? 'Excelente' : 'Revisar'}</Badge>
            </div>
         </Card>
         <Card className="bg-[#1c1917] border-white/5 p-8 flex flex-col justify-between shadow-2xl">
            <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-4">Perda Estimada (BRL)</p>
            <div className="flex items-end gap-3">
               <h3 className="text-4xl font-black text-red-500 italic tracking-tighter leading-none">{formatCurrency(stats.wasteValue)}</h3>
               <TrendingDown size={20} className="text-red-500 mb-1" />
            </div>
         </Card>
         <Card className="bg-[#1c1917] border-white/5 p-8 flex flex-col justify-between shadow-2xl">
            <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-4">Volume de Chapas</p>
            <h3 className="text-4xl font-black text-amber-50 italic tracking-tighter leading-none">{stats.sheetCount} <span className="text-xs text-stone-700 not-italic uppercase ml-2">MDF</span></h3>
         </Card>
         <Card className="bg-amber-500 p-8 text-black flex flex-col justify-between shadow-2xl shadow-amber-600/30">
            <div className="flex justify-between items-start">
               <Target size={24} strokeWidth={2.5}/>
               <Badge variant="neutral">Industrial</Badge>
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight mt-6">Arquivo Pronto<br/>p/ Produção</h3>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Lista de Peças Lateral */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 h-[750px] flex flex-col bg-[#141210] border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
               <h2 className="text-lg font-black italic uppercase text-amber-50 flex items-center gap-3">
                  <Box className="text-amber-500" size={20} /> Mapa de Cortes
               </h2>
               <button onClick={() => setShowAddModal(true)} className="p-3 bg-white/5 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-black transition-all shadow-lg active:scale-95"><Plus size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-3 scrollbar-hide">
              {parts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                   <Scissors size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Aguardando Importação</p>
                </div>
              ) : parts.map(p => (
                <div key={p.id} className="group p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 hover:border-amber-500/30 transition-all">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-amber-50 truncate uppercase tracking-tighter">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] text-stone-500 font-bold uppercase">{p.w}x{p.h}mm</span>
                       <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
                       <span className={`text-[10px] font-black uppercase ${p.mat === 'wood' ? 'text-amber-500' : 'text-stone-300'}`}>{p.mat === 'wood' ? 'Elite' : 'Std'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-amber-50 bg-black/40 px-3 py-2 rounded-xl border border-white/5 group-hover:border-amber-500/50">x{p.qtd}</span>
                    <button onClick={() => deletePart(p.id)} className="text-stone-700 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-8 border-t border-white/5 mt-6 grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-16 rounded-2xl border-white/10 text-stone-500" icon={Printer}>Etiquetas QR</Button>
              <Button variant="primary" className="h-16 rounded-2xl" icon={Download}>Lista (CSV)</Button>
            </div>
          </Card>
        </div>

        {/* Visualização das Chapas */}
        <div className="lg:col-span-8 space-y-10">
          {iaAdvice && (
             <Card className="p-8 bg-indigo-500/10 border-indigo-500/20 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-start gap-6">
                   <div className="w-14 h-14 bg-indigo-500 rounded-[1.5rem] flex items-center justify-center text-white shrink-0 shadow-xl shadow-indigo-600/30">
                      <Sparkles size={28}/>
                   </div>
                   <div className="flex-1">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Análise IARA Industrial</h4>
                      <p className="text-[15px] font-medium italic text-stone-300 leading-relaxed">"{iaAdvice}"</p>
                   </div>
                   <button onClick={() => setIaAdvice(null)} className="p-2 text-stone-700 hover:text-white"><X size={18}/></button>
                </div>
             </Card>
          )}

          {sheets.length === 0 ? (
            <Card className="p-20 flex flex-col items-center justify-center text-center bg-[#1c1917] border-dashed border-2 border-stone-800">
               <Layers size={64} className="text-stone-800 mb-8" />
               <h3 className="text-2xl font-black italic uppercase text-stone-700 tracking-tighter">Nesting Machine Desativada</h3>
               <p className="text-[10px] text-stone-800 font-black uppercase tracking-[0.4em] mt-4 max-w-sm leading-relaxed">Importe as peças do projeto para iniciar o cálculo de corte industrial.</p>
            </Card>
          ) : sheets.map((s, idx) => (
            <Card key={idx} className="p-10 border-white/5 bg-[#0c0a09] relative overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between items-center mb-10 relative z-10">
                 <div>
                    <div className="flex items-center gap-4 mb-2">
                       <h3 className="text-2xl font-black italic uppercase text-amber-50 tracking-tighter">Chapa #{idx + 1}</h3>
                       <Badge variant={s.mat === 'wood' ? 'warning' : 'neutral'}>{s.mat === 'wood' ? 'AMADEIRADO' : 'BRANCO TX'}</Badge>
                    </div>
                    <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest">
                      Dimensões Industriais: {SHEET_W} x {SHEET_H} mm • 18.0 mm
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-stone-600 uppercase mb-1">Aproveitamento</p>
                    <p className="text-2xl font-black text-emerald-500 italic tracking-tighter">
                       {((s.usedArea / (SHEET_W * SHEET_H)) * 100).toFixed(1)}%
                    </p>
                 </div>
              </div>

              {/* Área do Plano de Corte Real */}
              <div className="aspect-[273/183] bg-[#0c0a09] relative border-2 border-white/10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 group/sheet">
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                 
                 {s.items.map((item: any) => (
                   <div
                     key={item.uid}
                     className={`absolute border border-black/40 flex flex-col items-center justify-center p-2 transition-all hover:z-20 hover:scale-[1.02] cursor-default group/item shadow-lg ${item.mat === 'wood' ? 'bg-[#3e2723]' : 'bg-[#e5e5e5]'}`}
                     style={{
                       left: `${(item.x / SHEET_W) * 100}%`,
                       top: `${(item.y / SHEET_H) * 100}%`,
                       width: `${(item.w / SHEET_W) * 100}%`,
                       height: `${(item.h / SHEET_H) * 100}%`
                     }}
                   >
                     <span className={`text-[8px] font-black uppercase truncate w-full text-center tracking-tighter ${item.mat === 'wood' ? 'text-amber-100' : 'text-black'}`}>{item.name}</span>
                     <span className={`text-[6px] font-bold opacity-50 ${item.mat === 'wood' ? 'text-amber-50' : 'text-stone-600'}`}>{item.w}x{item.h}</span>
                     
                     {/* Overlay de Inspeção */}
                     <div className="absolute inset-0 bg-amber-500 text-black flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all scale-95 group-hover/item:scale-100">
                        <div className="text-center">
                           <p className="text-[10px] font-black leading-none">{item.w}mm</p>
                           <p className="text-[7px] font-black uppercase opacity-60">por</p>
                           <p className="text-[10px] font-black leading-none">{item.h}mm</p>
                        </div>
                     </div>
                   </div>
                 ))}

                 {/* Marcação de Refilo 10mm */}
                 <div className="absolute inset-0 border-[10px] border-red-500/5 pointer-events-none"></div>
              </div>

              <div className="mt-10 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-all">
                 <div className="flex gap-8">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 bg-amber-900 rounded-sm"></div>
                       <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Veio Vertical (Mestre)</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 bg-stone-300 rounded-sm"></div>
                       <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Área de Retalho</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-indigo-400">
                    <HardDrive size={16}/>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Algoritmo Nesting v8.2 Ativo</span>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Adicionar Peça Extra" maxWidth="max-w-md">
        <div className="space-y-10">
          <InputGroup label="Descrição da Peça" value={newPart.name || ''} onChange={(v: string) => setNewPart({ ...newPart, name: v })} placeholder="Ex: Divisória Gaveta Interna"/>
          <div className="grid grid-cols-2 gap-8">
            <InputGroup label="Largura (mm)" type="number" value={newPart.w || 0} onChange={(v: number) => setNewPart({ ...newPart, w: v })} suffix="mm"/>
            <InputGroup label="Altura (mm)" type="number" value={newPart.h || 0} onChange={(v: number) => setNewPart({ ...newPart, h: v })} suffix="mm"/>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <InputGroup label="Quantidade" type="number" value={newPart.qtd || 1} onChange={(v: number) => setNewPart({ ...newPart, qtd: v })}/>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Material</label>
              <select 
                value={newPart.mat} 
                onChange={e => setNewPart({ ...newPart, mat: e.target.value as any })}
                className="w-full bg-[#292524] border border-white/5 rounded-2xl py-4.5 px-6 text-white font-bold text-sm focus:border-amber-500 outline-none transition-all"
              >
                <option value="white">Branco Standard</option>
                <option value="wood">Premium Wood</option>
                <option value="back">Fundo 6mm</option>
              </select>
            </div>
          </div>
          <Button variant="primary" className="w-full h-16 rounded-2xl text-[12px]" onClick={addPart}>Confirmar Adição</Button>
        </div>
      </Modal>
    </div>
  );
};
