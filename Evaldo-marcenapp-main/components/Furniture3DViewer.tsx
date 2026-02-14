
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  ContactShadows, 
  Environment, 
  Grid, 
  PerspectiveCamera, 
  Text, 
  Float,
  PresentationControls,
  Stage,
  Backdrop
} from '@react-three/drei';
import { ProjectData } from '../types';

interface Props {
  project: ProjectData;
}

const Handle: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({ position, rotation = [Math.PI / 2, 0, 0] }) => (
  /* @ts-ignore - Added type ignore for mesh to fix JSX IntrinsicElements error */
  <mesh position={position} rotation={rotation}>
    {/* @ts-ignore */}
    <cylinderGeometry args={[0.006, 0.006, 0.15, 12]} />
    {/* @ts-ignore */}
    <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
  </mesh>
);

const CabinetModel: React.FC<{ project: ProjectData }> = ({ project }) => {
  const { width, height, depth, externalMaterial, doors, drawers } = project;
  
  const isWood = externalMaterial.includes('wood');
  const materialColor = isWood ? '#854d0e' : '#f8fafc';
  const internalColor = '#ffffff';
  const thickness = 0.018;
  const plinthHeight = 0.1;

  const bodyHeight = height - plinthHeight;
  const drawerSectionHeight = drawers > 0 ? (bodyHeight * 0.35) : 0;
  const doorHeight = bodyHeight - drawerSectionHeight;

  return (
    /* @ts-ignore */
    <group position={[0, 0, 0]}>
      {/* Plinth (Base) */}
      {/* @ts-ignore */}
      <mesh position={[0, plinthHeight / 2, 0.01]} castShadow>
        {/* @ts-ignore */}
        <boxGeometry args={[width - 0.04, plinthHeight, depth - 0.04]} />
        {/* @ts-ignore */}
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Main Body (Structure) */}
      {/* @ts-ignore */}
      <mesh position={[0, plinthHeight + bodyHeight / 2, 0]} castShadow receiveShadow>
        {/* @ts-ignore */}
        <boxGeometry args={[width, bodyHeight, depth]} />
        {/* @ts-ignore */}
        <meshStandardMaterial color={internalColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Internal Shelves (Visible through gaps or if doors were open) */}
      {/* @ts-ignore */}
      <mesh position={[0, plinthHeight + doorHeight / 2 + drawerSectionHeight, 0]} receiveShadow>
        {/* @ts-ignore */}
        <boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} />
        {/* @ts-ignore */}
        <meshStandardMaterial color={internalColor} />
      </mesh>

      {/* Doors (Top Section) */}
      {/* @ts-ignore */}
      {doors > 0 && Array.from({ length: doors }).map((_, i) => {
        const doorWidth = width / doors;
        const xPos = -width / 2 + doorWidth / 2 + i * doorWidth;
        const yPos = plinthHeight + drawerSectionHeight + doorHeight / 2;
        
        return (
          /* @ts-ignore */
          <group key={`door-${i}`} position={[xPos, yPos, depth / 2 + 0.01]}>
            {/* @ts-ignore */}
            <mesh castShadow>
              {/* @ts-ignore */}
              <boxGeometry args={[doorWidth - 0.004, doorHeight - 0.004, thickness]} />
              {/* @ts-ignore */}
              <meshStandardMaterial 
                color={materialColor} 
                roughness={isWood ? 0.6 : 0.2} 
                metalness={isWood ? 0 : 0.05}
              />
            </mesh>
            {/* Elegant Vertical Handle */}
            <Handle 
              position={[i % 2 === 0 ? doorWidth / 2 - 0.05 : -doorWidth / 2 + 0.05, 0, thickness / 2]} 
              rotation={[0, 0, 0]}
            />
          </group>
        );
      })}

      {/* Drawers (Bottom Section) */}
      {/* @ts-ignore */}
      {drawers > 0 && Array.from({ length: drawers }).map((_, i) => {
        const dHeight = drawerSectionHeight / drawers;
        const yPos = plinthHeight + (i * dHeight) + dHeight / 2;
        
        return (
          /* @ts-ignore */
          <group key={`drawer-${i}`} position={[0, yPos, depth / 2 + 0.01]}>
            {/* @ts-ignore */}
            <mesh castShadow>
              {/* @ts-ignore */}
              <boxGeometry args={[width - 0.004, dHeight - 0.004, thickness + 0.005]} />
              {/* @ts-ignore */}
              <meshStandardMaterial 
                color={materialColor} 
                roughness={isWood ? 0.6 : 0.2} 
              />
            </mesh>
            {/* Horizontal Handle */}
            <Handle position={[0, 0, thickness]} rotation={[0, 0, Math.PI / 2]} />
          </group>
        );
      })}

      {/* Dynamic Measurements */}
      {/* @ts-ignore */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text position={[0, height + 0.3, 0]} fontSize={0.1} color="#6366f1" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
          {width.toFixed(2)}m x {height.toFixed(2)}m
        </Text>
      </Float>
    </group>
  );
};

export const Furniture3DViewer: React.FC<Props> = ({ project }) => {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="w-full h-full bg-slate-950 rounded-[3rem] overflow-hidden relative group">
      <Canvas shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={[3, 2, 5]} fov={35} />
        <Suspense fallback={null}>
          <Environment preset="studio" />
          {/* @ts-ignore */}
          <ambientLight intensity={0.4} />
          {/* @ts-ignore */}
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
          >
            {/* @ts-ignore */}
            <group position={[0, -project.height / 2, 0]}>
              <CabinetModel project={project} />
            </group>
          </PresentationControls>

          <ContactShadows 
            position={[0, -project.height / 2, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4.5} 
          />
          
          <Backdrop
            receiveShadow
            scale={[20, 10, 5]}
            floor={1.5}
            segments={20}
            position={[0, -project.height / 2, -2]}
          >
            {/* @ts-ignore */}
            <meshStandardMaterial color="#020617" roughness={1} />
          </Backdrop>

          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            minDistance={2} 
            maxDistance={10}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            makeDefault
          />
        </Suspense>
      </Canvas>
      
      {/* 3D UI Overlays */}
      <div className="absolute bottom-8 left-8 flex flex-col gap-4 pointer-events-none">
        <div className="bg-white/5 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 shadow-2xl">
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-3">Especificações Ativas</p>
          <div className="space-y-2">
            {[
              { label: 'Largura', value: `${project.width}m` },
              { label: 'Altura', value: `${project.height}m` },
              { label: 'Material', value: project.externalMaterial.split('_')[1] }
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between gap-8">
                <span className="text-[9px] text-white/40 uppercase font-bold">{stat.label}</span>
                <span className="text-xs text-white font-black italic">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-8 right-8 flex flex-col gap-3">
        <button 
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all pointer-events-auto border ${autoRotate ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
        >
          {autoRotate ? 'Rotação Auto ON' : 'Rotação Auto OFF'}
        </button>
      </div>

      <div className="absolute bottom-8 right-8 flex items-center gap-3">
         <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em]">Cinematic Render 4.0</span>
         </div>
      </div>
    </div>
  );
};
