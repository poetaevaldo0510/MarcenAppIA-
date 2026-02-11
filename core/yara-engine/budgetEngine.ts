
import { ProjectData } from '../../types';
import { LABOR_RATE_M2 } from '../../constants';

export const BudgetEngine = {
  /**
   * Calcula o orçamento comercial completo do projeto seguindo o Padrão Yara 1.0.
   */
  calculate: (project: ProjectData, rates: { mdf: number; markup: number }) => {
    const totalArea = project.modules?.reduce((acc, mod) => acc + (mod.dimensions.w * mod.dimensions.h) / 1000000, 0) || 0;
    
    // Cálculo de Chapas e Materiais
    const chapasCount = Math.ceil(totalArea / 4.3); 
    const mdfCost = chapasCount * rates.mdf;
    const hardwareCost = mdfCost * 0.22; // Ferragens estimadas em 22% do MDF
    const otherCosts = (mdfCost + hardwareCost) * 0.08; // Outros (cola, fitas, parafusos)
    
    // Mão de Obra
    const laborCost = totalArea * LABOR_RATE_M2;
    
    // Total de Custos Diretos
    const totalCost = mdfCost + hardwareCost + laborCost + otherCosts;
    
    // Preço Comercial
    const finalPrice = totalCost * rates.markup;
    const profit = finalPrice - totalCost;
    const margin = (profit / finalPrice) * 100;

    return {
      status: 'done' as const,
      materials: [
        { name: 'MDF Estrutural (Chapas)', cost: mdfCost },
        { name: 'Ferragens & Acessórios Pro', cost: hardwareCost },
        { name: 'Insumos & Outros', cost: otherCosts }
      ],
      total: totalCost,
      labor: laborCost,
      finalPrice: finalPrice,
      profit: profit,
      margin: margin,
      chapas: chapasCount,
      prazoDias: 30 + (project.complexity * 2),
      creditsUsed: 10 // Custo fixo do combo full
    };
  }
};
