
import React, { memo } from "react";

export const LogoSVG = memo(({ size = 48, animated = false }: { size?: number, animated?: boolean }) => (
  <div className={`relative flex items-center justify-center ${animated ? "animate-pulse" : ""}`} style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#09090b" />
      <path d="M25 75V25H45L50 40L55 25H75V75H62V40L50 65L38 40V75H25Z" fill="white" />
      <circle cx="50" cy="15" r="4" fill="#D97706" />
    </svg>
    {animated && <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-[24px] animate-spin" style={{ margin: "-4px" }} />}
  </div>
));

export const BrandHeading = () => (
  <div className="flex flex-col text-left justify-center ml-1">
    <h1 className="text-xl font-black uppercase tracking-tighter text-white leading-none">MARCENAPP</h1>
    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none mt-1">MARCENARIA DIGITAL</p>
  </div>
);
