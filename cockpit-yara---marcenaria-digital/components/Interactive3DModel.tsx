
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Spinner, RefreshCcw, Rotate3DIcon, CubeIcon, SunIcon, ToolsIcon, ArrowsExpandIcon } from './Shared';
import type { IaraDesignOutput } from '../types';

interface Interactive3DModelProps {
    spec?: IaraDesignOutput;
    isProcessing?: boolean;
}

export const Interactive3DModel: React.FC<Interactive3DModelProps> = ({ spec, isProcessing }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    const [explodeFactor, setExplodeFactor] = useState(0); // 0 a 1
    const [lightMode, setLightMode] = useState<'natural' | 'studio'>('studio');
    
    const sceneRef = useRef<{ 
        scene: THREE.Scene, 
        camera: THREE.PerspectiveCamera, 
        renderer: THREE.WebGLRenderer, 
        controls: OrbitControls,
        group: THREE.Group,
        lights: { main: THREE.DirectionalLight, ambient: THREE.AmbientLight }
    } | null>(null);

    const updateExplosion = (factor: number) => {
        if (!sceneRef.current) return;
        const group = sceneRef.current.group;
        group.children.forEach((mesh: any, idx: number) => {
            if (mesh.userData.originalPos) {
                const dir = mesh.userData.originalPos.clone().normalize().multiplyScalar(factor * 1200);
                mesh.position.copy(mesh.userData.originalPos.clone().add(dir));
            }
        });
    };

    const resetCamera = useCallback(() => {
        if (!sceneRef.current) return;
        const { camera, controls, group } = sceneRef.current;
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        camera.position.set(center.x + maxDim * 1.5, center.y + maxDim, center.z + maxDim * 1.5);
        controls.target.copy(center);
        controls.update();
    }, []);

    useEffect(() => {
        if (!containerRef.current || !spec?.components) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        scene.fog = new THREE.Fog(0x0a0a0a, 5000, 25000);
        
        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 10, 50000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.maxDistance = 20000;
        controls.minDistance = 500;
        controls.autoRotate = isAutoRotating;

        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5000, 8000, 5000);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.set(1024, 1024);
        scene.add(ambient, mainLight);

        const group = new THREE.Group();
        spec.components.forEach((comp, idx) => {
            const w = comp.dimensions.w || 400;
            const h = comp.dimensions.h || 700;
            const d = comp.dimensions.d || 500;
            const geometry = new THREE.BoxGeometry(w, h, d);
            const isWood = comp.material?.toLowerCase().includes('freijó') || comp.material?.toLowerCase().includes('amadeirado');
            
            const material = new THREE.MeshStandardMaterial({ 
                color: isWood ? 0x96694c : 0xe9edef,
                roughness: isWood ? 0.8 : 0.2,
                metalness: 0.1
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.y = h / 2;
            mesh.position.x = (idx * (w + 40)) - ((spec.components.length * w) / 2);
            mesh.userData = { ...comp, originalPos: mesh.position.clone() };
            
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xd4ac6e, opacity: 0.1, transparent: true }));
            mesh.add(line);
            group.add(mesh);
        });
        scene.add(group);

        const animate = () => {
            const frameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
            return frameId;
        };
        const frameId = animate();
        sceneRef.current = { scene, camera, renderer, controls, group, lights: { main: mainLight, ambient } };
        setIsLoaded(true);
        resetCamera();

        return () => {
            cancelAnimationFrame(frameId);
            renderer.dispose();
        };
    }, [spec]);

    useEffect(() => {
        if (sceneRef.current) sceneRef.current.controls.autoRotate = isAutoRotating;
    }, [isAutoRotating]);

    useEffect(() => {
        updateExplosion(explodeFactor);
    }, [explodeFactor]);

    useEffect(() => {
        if (!sceneRef.current) return;
        const { main, ambient } = sceneRef.current.lights;
        if (lightMode === 'natural') {
            main.intensity = 1.8;
            main.color.setHex(0xfffaf0);
            ambient.intensity = 0.6;
        } else {
            main.intensity = 1.2;
            main.color.setHex(0xffffff);
            ambient.intensity = 0.3;
        }
    }, [lightMode]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#0a0a0a]">
            
            {/* CONTROLES HUD 3D */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4">
                
                {/* Slider de Explosão */}
                <div className="bg-black/60 backdrop-blur-2xl p-4 rounded-[2rem] border border-white/10 flex items-center gap-4 shadow-3xl">
                    <ToolsIcon className="w-4 h-4 text-[#d4ac6e]" />
                    <input 
                        type="range" min="0" max="1" step="0.01" 
                        value={explodeFactor} 
                        onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                        className="w-32 h-1 bg-white/10 rounded-full appearance-none accent-[#d4ac6e] cursor-pointer"
                    />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest w-12">Explosão</span>
                </div>

                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-2 rounded-full border border-white/10 shadow-3xl">
                    <button onClick={() => setLightMode(prev => prev === 'natural' ? 'studio' : 'natural')} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${lightMode === 'natural' ? 'bg-[#d4ac6e] text-black shadow-[0_0_15px_#d4ac6e]' : 'text-white/40 hover:bg-white/5'}`}>
                        <SunIcon className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-white/10"></div>
                    <button onClick={resetCamera} className="w-12 h-12 flex items-center justify-center text-[#d4ac6e] hover:bg-[#d4ac6e]/10 rounded-full transition-all">
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-white/10"></div>
                    <button onClick={() => setIsAutoRotating(!isAutoRotating)} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isAutoRotating ? 'bg-[#25d366] text-black shadow-[0_0_15px_#25d366]' : 'text-white/40 hover:bg-white/5'}`}>
                        <Rotate3DIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {(!isLoaded || isProcessing) && (
                <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50">
                    <Spinner size="lg" />
                    <p className="mt-8 text-xs font-black uppercase text-[#d4ac6e] animate-pulse">Sincronizando Malha 3D...</p>
                </div>
            )}
        </div>
    );
};
