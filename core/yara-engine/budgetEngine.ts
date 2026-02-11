
import { ProjectData } from '../../types';
import { LABOR_RATE_M2 } from '../../constants';

export const BudgetEngine = {
  /**
   * Calcula o custo detalhado do projeto
   */
  calculate: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    
    // Estimativa de chapas baseada em área útil
    const chapasCount = Math.ceil(totalArea / 4.5); 
    const mdfCost = chapasCount * rates.mdf;
    
    // Ferragens (15% do valor do material como estimativa base)
    const hardwareCost = mdfCost * 0.15;
    
    // Mão de Obra Master
    const laborCost = totalArea * LABOR_RATE_M2;
    
    const subtotal = mdfCost + hardwareCost + laborCost;
    const finalPrice = subtotal * rates.markup;

    return {
      status: 'done' as const,
      materials: [
        { name: 'MDF Estrutural', cost: mdfCost },
        { name: 'Ferragens Pro', cost: hardwareCost },
      ],
      total: subtotal,
      labor: laborCost,
      finalPrice: finalPrice,
      chapas: chapasCount,
      // Adicionado creditsUsed para satisfazer o contrato da interface ProjectData
      creditsUsed: 0
    };
  }
};
