
import { ProjectData } from '../../types';
import { LABOR_RATE_M2 } from '../../constants';

export const PricingEngine = {
  calculate: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    const mdfCost = (totalArea * (rates.mdf / 5)) || 0;
    const labor = totalArea * LABOR_RATE_M2;
    const total = (mdfCost + labor) * 1.35; 
    return {
      status: 'done' as const,
      materials: [
        { name: 'MDF Estrutural (Chapas)', cost: mdfCost },
        { name: 'Ferragens & Acessórios', cost: total * 0.15 },
        { name: 'Acabamentos & Fitas', cost: total * 0.05 }
      ],
      total,
      labor,
      finalPrice: total * rates.markup,
      chapas: Math.ceil(totalArea / 4.3),
      // Adicionado creditsUsed para satisfazer o contrato da interface ProjectData
      creditsUsed: 0
    };
  }
};
