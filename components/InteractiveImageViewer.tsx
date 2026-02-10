
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DownloadIcon, Spinner, ArrowsExpandIcon, PlusIcon, MinusIcon, RefreshCcw, X, LogoIcon, CubeIcon } from './Shared';
import { downloadBase64File } from '../utils/helpers';

interface InteractiveImageViewerProps {
  src: string;
  alt: string;
  projectName: string;
  allVersions?: string[];
  activeVersionIdx?: number;
  onVersionChange?: (idx: number) => void;
  isProcessing?: boolean;
}

export const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({ 
  src, alt, projectName, allVersions = [], activeVersionIdx = 0, onVersionChange, isProcessing = false
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // Efeito de Tilt Parallax Profundo
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
  }, [src, resetView]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isInteracting || scale > 1.2) {
      if (isInteracting) {
        setDragMoved(true);
        setPosition({ x: e.clientX - lastPos.current.x, y: e.clientY - lastPos.current.y });
      }
      return;
    }

    // Lógica de Tilt (Simulação 3D em 2D)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: x * 12, y: y * -12 }); 
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (isProcessing) return;
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const delta = -e.deltaY * 0.002 * scale;
    const newScale = Math.min(Math.max(1, scale + delta), 8);
    
    if (newScale !== scale) {
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    }
  }, [scale, isProcessing]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isProcessing) return;
    setIsInteracting(true);
    setDragMoved(false);
    
    if ('touches' in e) {
      const touch = e.touches[0];
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
      } else {
        lastPos.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
      }
    } else {
      lastPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
        if (!isInteracting) return;
        if (e.touches.length === 2 && lastTouchDistance.current !== null) {
            setDragMoved(true);
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            const delta = currentDistance / lastTouchDistance.current;
            setScale(prev => Math.min(Math.max(1, prev * delta), 8));
            lastTouchDistance.current = currentDistance;
        } else if (e.touches.length === 1 && scale > 1) {
            const touch = e.touches[0];
            setPosition({ x: touch.clientX - lastPos.current.x, y: touch.clientY - lastPos.current.y });
        }
    } else {
        handleMouseMove(e as React.MouseEvent);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => {
        const factor = direction === 'in' ? 1.4 : 0.6;
        const next = Math.min(Math.max(1, prev * factor), 8);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-colors duration-500 select-none bg-[#050505]`}
      onMouseDown={handleStart} 
      onMouseMove={handleMove} 
      onMouseUp={() => setIsInteracting(false)} 
      onMouseLeave={() => { setIsInteracting(false); setTilt({x:0, y:0}); }} 
      onTouchStart={handleStart} 
      onTouchMove={handleMove} 
      onTouchEnd={() => setIsInteracting(false)}
      onClick={(e) => {
          const now = Date.now();
          if (now - lastClickTime < 300) { resetView(); return; }
          setLastClickTime(now);
      }}
      style={{ touchAction: 'none' }}
    >
      <div 
        className={`relative will-change-transform transition-transform duration-500 ease-out ${isProcessing ? 'blur-3xl opacity-20 scale-105' : 'opacity-100'}`}
        style={{ 
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale}) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`, 
          transformOrigin: 'center center',
          cursor: scale > 1 ? (isInteracting ? 'grabbing' : 'grab') : 'crosshair'
        }}
      >
        <img 
          ref={imgRef} 
          src={src} 
          alt={alt} 
          className="max-w-[100vw] max-h-[100vh] object-contain pointer-events-none drop-shadow-[0_30px_80px_rgba(0,0,0,0.8)]" 
          draggable={false} 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#d4ac6e]/5 to-transparent pointer-events-none opacity-40 mix-blend-overlay"></div>
      </div>

      {/* CONTROLES HUD (ZAP STYLE) */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/10 shadow-3xl pointer-events-auto">
          <button onClick={() => handleZoom('out')} className="w-12 h-12 flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-75">
              <MinusIcon className="w-6 h-6" />
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <button onClick={resetView} className="w-12 h-12 flex items-center justify-center text-[#d4ac6e] hover:bg-[#d4ac6e]/10 rounded-full transition-all active:rotate-180">
              <RefreshCcw className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <button onClick={() => handleZoom('in')} className="w-12 h-12 flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-75">
              <PlusIcon className="w-6 h-6" />
          </button>
      </div>

      {/* STATUS OVERLAY */}
      <div className="absolute top-8 left-8 pointer-events-none animate-fadeIn">
          <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5 flex flex-col gap-1">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Lente de Exibição</p>
              <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${scale > 1.1 ? 'bg-amber-500' : 'bg-[#25d366]'} animate-pulse`}></div>
                  <p className="text-xs font-black text-white uppercase italic tracking-tighter">
                      {scale > 1.1 ? `Digital Zoom x${scale.toFixed(1)}` : 'Óptica 1:1 Nativa'}
                  </p>
              </div>
          </div>
      </div>

      {allVersions.length > 1 && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl pointer-events-auto">
          {allVersions.map((_, i) => (
            <button key={i} onClick={() => onVersionChange?.(i)} className={`h-1.5 rounded-full transition-all duration-500 ${activeVersionIdx === i ? 'bg-[#d4ac6e] w-10 shadow-[0_0_15px_#d4ac6e]' : 'bg-white/20 w-3 hover:bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
};
