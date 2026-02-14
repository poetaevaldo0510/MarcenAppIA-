
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text, Float, Stage, Sparkles as Sparkles3D } from '@react-three/drei';
import { ChevronLeft, ChevronRight, Info, Hammer, CheckCircle2, RotateCcw, Box, Eye, Sparkles, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Button, Badge, Card } from '../components/UI';
import { ProjectData, ModuleType } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  /* Updated onNavigate to use ModuleType to fix App.tsx dispatch error */
  onNavigate: (m: ModuleType) => void;
}

const AnimatedPart: React.FC<{ 
  position: [number, number, number]; 
  args: [number, number, number]; 
  color: string; 
  visible: boolean; 
  label: string;
  isActive: boolean;
  explodedOffset?: [number, number, number];
}> = ({ position, args, color, visible, label, isActive, explodedOffset = [0, 0, 0] }) => {
  if (!visible) return null;
  
  const finalPosition: [number, number, number] = isActive 
    ? [position[0] + explodedOffset[0], position[1] + explodedOffset[1], position[2] + explodedOffset[2]]
    : position;

  return (
    /* @ts-ignore - Added type ignore for R3F elements to fix JSX IntrinsicElements errors */
    <group position={finalPosition}>
      {/* @ts-ignore */}
      <mesh castShadow receiveShadow>
        {/* @ts-ignore */}
        <boxGeometry args={args} />
        {/* @ts-ignore */}
        <meshStandardMaterial 
          color={isActive ? '#fbbf24' : color} 
          transparent 
          opacity={isActive ? 1 : 0.4}
          roughness={0.2}
          metalness={0.1}
          emissive={isActive ? '#fbbf24' : '#000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
      {isActive && (
        /* @ts-ignore */
        <group position={[0, args[1] / 2 + 0.1, 0]}>
           {/* @ts-ignore */}
           <Float speed={5} rotationIntensity={0} floatIntensity={0.3}>
             <Text
               fontSize={0.05}
               color="#fbbf24"
               anchorX="center"
               font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
             >
               {label}
             </Text>
           </Float>
        </group>
      )}
    </group>
  );
};

const AssemblyModel: React.FC<{ project: ProjectData; currentStep: number }> = ({ project, currentStep }) => {
  const { width, height, depth, externalMaterial, doors, drawers } = project;
  const isWood = externalMaterial.includes('wood');
  const materialColor = isWood ? '#a16207' : '#ffffff';
  const internalColor = '#f1f5f9';
  const thickness = 0.018;
  const plinthHeight = 0.1;
  const bodyHeight = height - plinthHeight;
  const drawerSectionHeight = drawers > 0 ? (bodyHeight * 0.35) : 0;
  const doorHeight = bodyHeight - drawerSectionHeight;

  return (
    /* @ts-ignore */
    <group position={[0, -height / 2, 0]}>
      {/* Passo 1: Rodapé */}
      <AnimatedPart 
        position={[0, plinthHeight / 2, 0]} 
        args={[width - 0.04, plinthHeight, depth - 0.04]} 
        color="#0f172a" 
        visible={currentStep >= 1} 
        isActive={currentStep === 1}
        explodedOffset={[0, -0.2, 0]}
        label="Base Estrutural (Rodapé)"
      />

      {/* Passo 2: Base Inferior */}
      <AnimatedPart 
        position={[0, plinthHeight + thickness / 2, 0]} 
        args={[width, thickness, depth]} 
        color={internalColor} 
        visible={currentStep >= 2} 
        isActive={currentStep === 2}
        explodedOffset={[0, -0.1, 0]}
        label="Fundo da Caixa"
      />

      {/* Passo 3: Laterais */}
      <AnimatedPart 
        position={[-width / 2 + thickness / 2, plinthHeight + bodyHeight / 2, 0]} 
        args={[thickness, bodyHeight, depth]} 
        color={internalColor} 
        visible={currentStep >= 3} 
        isActive={currentStep === 3}
        explodedOffset={[-0.3, 0, 0]}
        label="Lateral Esquerda"
      />
      <AnimatedPart 
        position={[width / 2 - thickness / 2, plinthHeight + bodyHeight / 2, 0]} 
        args={[thickness, bodyHeight, depth]} 
        color={internalColor} 
        visible={currentStep >= 3} 
        isActive={currentStep === 3}
        explodedOffset={[0.3, 0, 0]}
        label="Lateral Direita"
      />

      {/* Passo 4: Topo Superior */}
      <AnimatedPart 
        position={[0, plinthHeight + bodyHeight - thickness / 2, 0]} 
        args={[width, thickness, depth]} 
        color={internalColor} 
        visible={currentStep >= 4} 
        isActive={currentStep === 4}
        explodedOffset={[0, 0.3, 0]}
        label="Painel Superior"
      />

      {/* Passo 5: Gavetas */}
      {drawers > 0 && Array.from({ length: drawers }).map((_, i) => {
        const dHeight = drawerSectionHeight / drawers;
        const yPos = plinthHeight + (i * dHeight) + dHeight / 2;
        return (
          <AnimatedPart 
            key={`dw-${i}`}
            position={[0, yPos, depth / 2 + 0.01]} 
            args={[width - 0.01, dHeight - 0.01, thickness]} 
            color={materialColor} 
            visible={currentStep >= 5} 
            isActive={currentStep === 5}
            explodedOffset={[0, 0, 0.4]}
            label={`Frente Gaveta ${i+1}`}
          />
        );
      })}

      {/* Passo 6: Portas */}
      {doors > 0 && Array.from({ length: doors }).map((_, i) => {
        const doorWidth = width / doors;
        const xPos = -width / 2 + doorWidth / 2 + i * doorWidth;
        const yPos = plinthHeight + drawerSectionHeight + doorHeight / 2;
        return (
          <AnimatedPart 
            key={`dr-${i}`}
            position={[xPos, yPos, depth / 2 + 0.01]} 
            args={[doorWidth - 0.005, doorHeight - 0.005, thickness]} 
            color={materialColor} 
            visible={currentStep >= 6} 
            isActive={currentStep === 6}
            explodedOffset={[i % 2 === 0 ? -0.2 : 0.2, 0, 0.4]}
            label={`Porta ${i+1}`}
          />
        );
      })}
    </group>
  );
};

export const AssemblyManual: React.FC<Props> = ({ onNavigate }) => {
  const { projects, activeProjectId } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const project = activeProject?.environments[0]?.dna;

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const totalSteps = 6;

  if (!project) return null;

  const toggleStep = (s: number) => {
    setCompletedSteps(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const stepInfo = [
    { title: "Estrutura do Rodapé", desc: "A base de todo móvel de alto padrão. Use parafusos 4.0x40 e garanta o esquadro perfeito. O recuo frontal deve ser de 40mm.", hardware: "12x Parafusos 4x40, Cantoneiras L", checks: ["Validar esquadro", "Verificar nível do piso"] },
    { title: "Fixação da Base", desc: "Instale a base principal sobre o rodapé. Use cavilhas e cola PVA para evitar movimentação futura da caixa.", hardware: "6x Cavilhas 8mm, 4x Minifix", checks: ["Aplicar cola PVA", "Travar Minifix"] },
    { title: "Ereção das Laterais", desc: "Suba as laterais externas. Verifique se o veio da madeira está na posição vertical.", hardware: "8x Tambor Minifix, 4x Cavilhas", checks: ["Conferir veio vertical", "Alinhamento frontal"] },
    { title: "Travamento Superior", desc: "Encaixe o chapéu (topo). Este passo trava toda a estrutura e garante que o móvel não torça durante o uso.", hardware: "4x Parafusos, 4x Minifix", checks: ["Esquadro superior", "Fixação firme"] },
    { title: "Sistemas de Gavetas", desc: "Instale as corrediças a 37mm da borda frontal. Encaixe as caixas e regule o alinhamento das frentes.", hardware: `${project.drawers} Pares de Corrediças`, checks: ["Nivelar corrediças", "Teste de abertura"] },
    { title: "Frentes e Portas", desc: "Fixe as dobradiças com amortecedor. Regule a altura, profundidade e lateralidade para fechamento silencioso.", hardware: `${project.doors * 2} Dobradiças Amortecedor`, checks: ["Regular folga 4mm", "Ajustar amortecimento"] },
  ];

  const currentInfo = stepInfo[step - 1];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => onNavigate('production')} className="p-4 bg-white/5 text-stone-400 rounded-2xl hover:text-amber-500 transition-all border border-white/5 shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="info">Manual Interativo v8.0</Badge>
              <Badge variant="neutral">Obra: #{activeProject?.id.slice(-4).toUpperCase()}</Badge>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-amber-50 mt-2">Engenharia de Montagem</h1>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 bg-[#1c1917] p-5 rounded-[2rem] border border-white/5 shadow-2xl">
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Progresso Técnico:</span>
              <span className="text-xl font-black text-amber-50 italic">{Math.round((completedSteps.length / totalSteps) * 100)}%</span>
           </div>
           <div className="w-56 h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(245,158,11,0.3)]" style={{ width: `${(completedSteps.length / totalSteps) * 100}%` }}></div>
           </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-hidden min-h-0">
        {/* Viewport 3D de Montagem */}
        <div className="flex-1 bg-[#0c0a09] rounded-[3.5rem] border border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative group overflow-hidden ring-1 ring-white/5">
          <Canvas shadows gl={{ antialias: true }}>
            <PerspectiveCamera makeDefault position={[5, 4, 6]} fov={35} />
            <Suspense fallback={null}>
              <Stage intensity={0.4} environment="studio" adjustCamera={false} shadows="contact">
                <AssemblyModel project={project} currentStep={step} />
              </Stage>
              <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.7} />
              <ContactShadows opacity={0.6} scale={15} blur={3} far={10} />
            </Suspense>
          </Canvas>
          
          <div className="absolute top-10 right-10 flex flex-col gap-4">
            <button onClick={() => setStep(1)} className="p-5 bg-black/60 backdrop-blur-xl text-amber-500 rounded-3xl border border-white/10 hover:bg-amber-500 hover:text-black transition-all shadow-2xl active:scale-95 group">
              <RotateCcw size={24} className="group-hover:rotate-[-90deg] transition-transform duration-500" />
            </button>
            <button className="p-5 bg-black/60 backdrop-blur-xl text-stone-500 rounded-3xl border border-white/10 hover:text-white transition-all shadow-2xl active:scale-95">
              <Eye size={24} />
            </button>
          </div>

          <div className="absolute bottom-10 left-10 max-w-sm">
             <div className="bg-indigo-500/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                      <Sparkles size={20}/>
                   </div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Consultoria IARA Pro</p>
                </div>
                <p className="text-[13px] font-bold text-stone-300 leading-relaxed italic">
                  "Mestre, para este projeto com MDF {project.externalMaterial.split('_')[1]}, aplique selador nas bordas não fitadas para evitar estufamento em áreas úmidas."
                </p>
             </div>
          </div>
        </div>

        {/* Sidebar de Instruções Técnicas */}
        <aside className="w-full lg:w-[460px] flex flex-col gap-8 shrink-0 h-full overflow-y-auto pr-4 scrollbar-hide pb-32">
          <Card className="p-10 border-amber-500/20 bg-[#141210] relative overflow-hidden shadow-2xl ring-1 ring-white/5">
            <div className="absolute -top-12 -right-12 opacity-5 pointer-events-none"><Hammer size={160}/></div>
            
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-amber-500 rounded-[1.8rem] flex items-center justify-center text-black shadow-xl shadow-amber-600/30">
                <Hammer size={32} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[9px] font-black text-stone-600 uppercase tracking-[0.4em]">Passo {step} / {totalSteps}</span>
                <h2 className="text-3xl font-black italic uppercase text-amber-50 leading-tight tracking-tighter">{currentInfo.title}</h2>
              </div>
            </div>

            <p className="text-stone-400 text-[15px] font-medium leading-relaxed mb-10 italic border-l-2 border-amber-500/30 pl-6">
              "{currentInfo.desc}"
            </p>

            <div className="space-y-8">
               <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Box size={14}/> Insumos da Etapa</p>
                  <p className="text-sm font-black text-amber-50 italic">{currentInfo.hardware}</p>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ClipboardCheck size={14}/> Checklist Industrial</p>
                  {currentInfo.checks.map((check, i) => (
                    <button 
                      key={i} 
                      onClick={() => toggleStep(step * 10 + i)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98] ${
                        completedSteps.includes(step * 10 + i) 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-white/5 border-white/5 text-stone-500 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-tight">{check}</span>
                      {completedSteps.includes(step * 10 + i) ? <CheckCircle2 size={18}/> : <div className="w-5 h-5 rounded-lg border-2 border-stone-800"></div>}
                    </button>
                  ))}
               </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <Button 
                variant="secondary" 
                className="h-20 rounded-[2rem] border-white/5" 
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                icon={ChevronLeft}
             >
               Anterior
             </Button>
             <Button 
                variant={step === totalSteps ? 'magic' : 'primary'} 
                className="h-20 rounded-[2rem]" 
                onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
                icon={step === totalSteps ? CheckCircle2 : ChevronRight}
             >
               {step === totalSteps ? 'Concluir' : 'Próximo'}
             </Button>
          </div>

          {step === totalSteps && completedSteps.length >= 4 && (
            <Card className="p-10 bg-emerald-500/10 border-emerald-500/20 text-center animate-in zoom-in duration-500 shadow-2xl">
              <div className="w-20 h-20 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/20">
                <CheckCircle2 size={40} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black italic uppercase text-emerald-50 tracking-tighter">OS Consolidada!</h3>
              <p className="text-[11px] text-stone-500 font-bold uppercase tracking-widest mt-4 leading-relaxed max-w-xs mx-auto">Mestre, o móvel foi montado seguindo 100% dos requisitos de engenharia.</p>
              <div className="grid grid-cols-1 gap-4 mt-10">
                <Button variant="primary" className="w-full h-16 rounded-2xl" onClick={() => onNavigate('crm')}>Notificar Cliente</Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl text-stone-600 border-white/5" onClick={() => onNavigate('dashboard')}>Finalizar Ordem</Button>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};
