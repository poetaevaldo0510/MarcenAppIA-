
import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Camera, X, Smartphone, Maximize, RotateCcw, Box, Sparkles, ChevronLeft, Download, Aperture, Move, RefreshCw, ZoomIn, Layers, Ruler, Target, Zap, Layout } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Text, PresentationControls } from '@react-three/drei';
import { Button, Badge, Card } from '../components/UI';
import { ProjectData, ModuleType } from '../types';

interface Props {
  /* Updated onNavigate to use ModuleType to fix App.tsx dispatch error */
  onNavigate: (m: ModuleType) => void;
}

const CabinetModel: React.FC<{ project: ProjectData; opacity: number; scale: number; rotation: number }> = ({ project, opacity, scale, rotation }) => {
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
    /* @ts-ignore - Added type ignore for R3F elements to fix JSX IntrinsicElements errors */
    <group scale={scale} rotation={[0, rotation, 0]}>
      {/* Rodapé */}
      {/* @ts-ignore */}
      <mesh position={[0, plinthHeight / 2, 0.01]}>
        {/* @ts-ignore */}
        <boxGeometry args={[width - 0.04, plinthHeight, depth - 0.04]} />
        {/* @ts-ignore */}
        <meshStandardMaterial color="#0f172a" transparent opacity={opacity} roughness={0.9} />
      </mesh>
      
      {/* Corpo Principal */}
      {/* @ts-ignore */}
      <mesh position={[0, plinthHeight + bodyHeight / 2, 0]}>
        {/* @ts-ignore */}
        <boxGeometry args={[width, bodyHeight, depth]} />
        {/* @ts-ignore */}
        <meshStandardMaterial color={internalColor} transparent opacity={opacity} roughness={0.3} />
      </mesh>

      {/* Portas */}
      {doors > 0 && Array.from({ length: doors }).map((_, i) => {
        const doorWidth = width / doors;
        const xPos = -width / 2 + doorWidth / 2 + i * doorWidth;
        const yPos = plinthHeight + drawerSectionHeight + doorHeight / 2;
        return (
          /* @ts-ignore */
          <mesh key={`door-${i}`} position={[xPos, yPos, depth / 2 + 0.01]}>
            {/* @ts-ignore */}
            <boxGeometry args={[doorWidth - 0.005, doorHeight - 0.005, thickness]} />
            {/* @ts-ignore */}
            <meshStandardMaterial color={materialColor} transparent opacity={opacity} roughness={0.5} />
          </mesh>
        );
      })}

      {/* Gavetas */}
      {drawers > 0 && Array.from({ length: drawers }).map((_, i) => {
        const dHeight = drawerSectionHeight / drawers;
        const yPos = plinthHeight + (i * dHeight) + dHeight / 2;
        return (
          /* @ts-ignore */
          <mesh key={`drawer-${i}`} position={[0, yPos, depth / 2 + 0.01]}>
            {/* @ts-ignore */}
            <boxGeometry args={[width - 0.005, dHeight - 0.005, thickness + 0.005]} />
            {/* @ts-ignore */}
            <meshStandardMaterial color={materialColor} transparent opacity={opacity} />
          </mesh>
        );
      })}

      {/* HUD de Medidas flutuantes (Drei Text) */}
      {/* @ts-ignore */}
      <group position={[0, height + 0.2, 0]}>
         {/* @ts-ignore */}
         <Float speed={5} rotationIntensity={0} floatIntensity={0.2}>
            <Text fontSize={0.12} color="#fbbf24" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
              {width.toFixed(2)} x {height.toFixed(2)}m
            </Text>
         </Float>
      </group>
    </group>
  );
};

export const ARSimulator: React.FC<Props> = ({ project, onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [opacity, setOpacity] = useState(0.85);
  const [scale, setScale] = useState(0.85);
  const [rotation, setRotation] = useState(0);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
          setTimeout(() => setIsScanning(false), 3000);
        }
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        setHasCamera(false);
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const resetTransforms = () => {
    setScale(0.85);
    setRotation(0);
    setOpacity(0.85);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden animate-in fade-in duration-1000">
      {/* Background Video Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]"
      />

      {/* 3D Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <Canvas shadows gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[0, 0.5, 4]} fov={40} />
          <Suspense fallback={null}>
            <Environment preset="city" />
            {/* @ts-ignore */}
            <ambientLight intensity={0.7} />
            {/* @ts-ignore */}
            <spotLight position={[5, 10, 5]} intensity={1.5} angle={0.25} />
            
            <PresentationControls
              global
              config={{ mass: 1, tension: 170 }}
              snap={{ mass: 2, tension: 190 }}
              rotation={[0, 0, 0]}
              polar={[-Math.PI / 10, Math.PI / 10]}
              azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
              {/* @ts-ignore */}
              <group position={[0, -0.7, 0]}>
                <CabinetModel project={project} opacity={opacity} scale={scale} rotation={rotation} />
              </group>
            </PresentationControls>
            
            <ContactShadows position={[0, -0.7, 0]} opacity={0.5} scale={8} blur={3} far={6} />
          </Suspense>
        </Canvas>
      </div>

      {/* Interactive UI Overlays - FUTURISTIC HUD STYLE */}
      <div className="relative z-20 flex flex-col h-full pointer-events-none">
        
        {/* Superior: HUD Telemetria */}
        <header className="p-8 flex justify-between items-start">
          <button 
            onClick={() => onNavigate('studio')} 
            className="p-6 bg-black/60 backdrop-blur-2xl text-white rounded-3xl border border-white/10 pointer-events-auto active:scale-90 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] group"
          >
            <ChevronLeft size={32} className="group-hover:translate-x-[-4px] transition-transform" />
          </button>
          
          <div className="flex flex-col items-center gap-4">
             <div className="bg-amber-500/20 backdrop-blur-3xl px-8 py-3 rounded-full border border-amber-500/40 flex items-center gap-4 shadow-2xl">
                <Target size={18} className="text-amber-500 animate-spin-slow" />
                <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] drop-shadow-md">Ancoragem Espacial Ativa</span>
             </div>
             <div className="flex gap-2">
                <Badge variant="info">Vision v4.2</Badge>
                <Badge variant="neutral">Obra: #{project.externalMaterial.split('_')[1].toUpperCase()}</Badge>
             </div>
          </div>

          <button className="p-6 bg-black/60 backdrop-blur-2xl text-stone-500 rounded-3xl border border-white/10 pointer-events-auto active:scale-90 transition-all shadow-2xl">
            <Layout size={32} />
          </button>
        </header>

        {/* Central: Scanner Animation */}
        {isScanning && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-[320px] h-[320px] border-2 border-amber-500/20 rounded-[5rem] relative overflow-hidden flex items-center justify-center shadow-[0_0_100px_rgba(245,158,11,0.1)]">
               <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
               {/* Scanner Bar */}
               <div className="absolute inset-x-0 h-0.5 bg-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,1)] animate-[scan_3s_infinite]"></div>
               {/* Corners */}
               <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl-3xl"></div>
               <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr-3xl"></div>
               <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl-3xl"></div>
               <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br-3xl"></div>
               
               <Smartphone size={64} className="text-amber-500 opacity-20 animate-bounce" />
            </div>
            <h3 className="text-amber-50 font-black italic uppercase tracking-[0.6em] mt-16 text-sm drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">Localizando Superfície...</h3>
          </div>
        )}

        {/* HUD de Medidas Laterais (Vertical) */}
        {!isScanning && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6">
             <div className="bg-black/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 text-right">
                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Largura</p>
                <p className="text-lg font-black text-amber-50 italic">{project.width}m</p>
             </div>
             <div className="bg-black/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 text-right">
                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Altura</p>
                <p className="text-lg font-black text-amber-50 italic">{project.height}m</p>
             </div>
             <div className="bg-black/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 text-right">
                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Profund.</p>
                <p className="text-lg font-black text-amber-50 italic">{project.depth}m</p>
             </div>
          </div>
        )}

        {/* Inferior: Master Transform Controls */}
        <footer className="mt-auto p-10 pb-16 pointer-events-auto">
           <div className="max-w-xl mx-auto bg-[#0c0a09]/80 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,1)] space-y-10 ring-1 ring-white/5">
              <div className="grid grid-cols-2 gap-16">
                 {/* Controle de Escala */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-center text-stone-500">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3"><ZoomIn size={16}/> Escala Global</span>
                       <span className="text-[11px] font-black text-amber-50 italic bg-amber-500/10 px-3 py-1 rounded-lg">{Math.round(scale * 100)}%</span>
                    </div>
                    <div className="relative h-1.5 flex items-center">
                       <div className="absolute inset-0 bg-white/5 rounded-full border border-white/5"></div>
                       <input 
                         type="range" min="0.3" max="2.5" step="0.01" value={scale} 
                         onChange={(e) => setScale(parseFloat(e.target.value))}
                         className="w-full h-full bg-transparent appearance-none cursor-pointer accent-amber-500 relative z-10"
                       />
                    </div>
                 </div>
                 
                 {/* Controle de Rotação */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-center text-stone-500">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3"><RefreshCw size={16}/> Rotação</span>
                       <span className="text-[11px] font-black text-amber-50 italic bg-amber-500/10 px-3 py-1 rounded-lg">{Math.round(rotation * 57.29)}°</span>
                    </div>
                    <div className="relative h-1.5 flex items-center">
                       <div className="absolute inset-0 bg-white/5 rounded-full border border-white/5"></div>
                       <input 
                         type="range" min={-Math.PI} max={Math.PI} step="0.01" value={rotation} 
                         onChange={(e) => setRotation(parseFloat(e.target.value))}
                         className="w-full h-full bg-transparent appearance-none cursor-pointer accent-amber-500 relative z-10"
                       />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                 <button onClick={resetTransforms} className="p-6 bg-white/5 rounded-[2rem] text-stone-500 hover:text-white transition-all active:scale-90 border border-white/5 shadow-xl"><RotateCcw size={28}/></button>
                 <button className="col-span-2 p-6 bg-gradient-to-br from-amber-600 to-amber-400 text-black rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.3)]" onClick={() => alert("Capturando foto holográfica...")}>
                    <Aperture size={24} strokeWidth={2.5}/> Frame de Aprovação
                 </button>
                 <button className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-950/50 hover:bg-indigo-500 transition-all active:scale-90 border border-indigo-400/30" onClick={() => onNavigate('showroom')}><Smartphone size={28}/></button>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                 <p className="text-[9px] text-stone-600 text-center uppercase font-black tracking-[0.5em] italic">IARA Vision Imersiva v4.2 Real-Time Engine</p>
              </div>
           </div>
        </footer>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
