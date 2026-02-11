
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useStore } from "./store/yaraStore";
import Workshop from "./app/page";
import { LogoSVG } from "./components/ui/Logo";

function App() {
  const { isReady, setReady, loadingAI } = useStore();

  useEffect(() => {
    // Sincronia Master em 1.5s
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, [setReady]);

  if (!isReady) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-12 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#D9770615_0%,_transparent_75%)]" />
      <LogoSVG size={140} />
      <div className="mt-20 text-center space-y-10 relative">
        <h2 className="text-[13px] font-black uppercase tracking-[1em] animate-pulse text-amber-500 italic">SINCRO HUB SUPREME...</h2>
        <div className="flex gap-4 justify-center">
           {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
        </div>
        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.6em] pt-12 leading-relaxed">Hardware Industrial Engine v3.83 Operacional</p>
      </div>
    </div>
  );
  
  return <Workshop />;
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);

// Custom styles
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar { width: 0; display: none; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  body { overscroll-behavior-y: contain; position: fixed; width: 100%; height: 100%; overflow: hidden; background: #09090b; }
  #root { height: 100%; }
  input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  * { -webkit-tap-highlight-color: transparent; }
`;
document.head.appendChild(style);
