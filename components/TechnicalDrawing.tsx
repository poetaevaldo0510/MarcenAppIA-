import React from 'react';

interface TechnicalDrawingProps {
  svgCode: string;
  title?: string;
}

export const TechnicalDrawing: React.FC<TechnicalDrawingProps> = ({ svgCode, title }) => {
  if (!svgCode) return null;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 my-4 shadow-2xl animate-fadeInUp">
      <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
        <h3 className="text-[#d4ac6e] font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-2">
          📐 Traço Técnico (Engine Iara)
        </h3>
        <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Esquemático GIP 1:1</span>
      </div>
      
      <div 
        className="w-full bg-white rounded-xl overflow-hidden shadow-inner p-2 flex justify-center items-center"
        style={{ minHeight: '180px' }}
        dangerouslySetInnerHTML={{ __html: svgCode }} 
      />
      
      <div className="mt-3 text-[8px] text-gray-600 font-bold uppercase tracking-widest text-center italic">
        *Representação lógica. Verifique medidas em obra.
      </div>
    </div>
  );
};