
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  const downloadLogo = () => {
    const svg = document.getElementById('marcenapp-logo-svg')?.outerHTML;
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'M-MarcenaPP-Logo.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`relative inline-block cursor-pointer ${className}`} onClick={downloadLogo} title="Baixar Identidade Industrial">
      <svg 
        id="marcenapp-logo-svg"
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Moldura Hexagonal Industrial Refinada (Estilo Porca/Parafuso) */}
        <path 
          d="M50 5L92 27V73L50 95L8 73V27L50 5Z" 
          stroke="url(#logoGradient)" 
          strokeWidth="8" 
          strokeLinejoin="miter" 
          fill="#0d1418"
          filter="url(#glow)"
        />
        
        {/* Letra M - Única, Forte e Dominante (Estilo Viga I) */}
        <path 
          d="M25 75V25L50 50L75 25V75" 
          stroke="white" 
          strokeWidth="14" 
          strokeLinecap="square" 
          strokeLinejoin="miter" 
        />
        
        {/* Marcador de Precisão Digital */}
        <rect x="47" y="59" width="6" height="6" fill="#4f46e5">
           <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  );
};
