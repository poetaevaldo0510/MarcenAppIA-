
/**
 * ESTELA FINANCE ENGINE v6.5
 * Motor de cálculo heurístico com suporte a Multiplicador de Complexidade.
 */

export interface SmartBudgetInput {
    width: number;
    height: number;
    depth: number;
    complexity: number; // Fator de 1.0 a 2.0
    drawers: number;
    doors: number;
    laborRate: number;
    profitMargin: number;
    prices: Record<string, { price: number; area: number }>;
    materials: {
        internal: string;
        external: string;
        back: string;
    };
}

export const calculateSmartBudget = (input: SmartBudgetInput) => {
    const { width, height, depth, complexity, drawers, doors, laborRate, profitMargin, prices, materials } = input;

    const frontalArea = height * width;
    const shellArea = (2 * height * depth) + (2 * width * depth);
    
    // Complexidade afeta a densidade de divisórias e tempo de usinagem
    const dividerCount = Math.max(0, Math.ceil((width / 0.6) * (complexity)));
    const dividersArea = dividerCount * height * depth;
    
    const shelfCount = Math.max(1, Math.ceil((height / 0.4) * (complexity)));
    const shelvesArea = shelfCount * width * depth;
    
    const drawersInternalArea = drawers * 0.5; // Fator fixo de chapa por gaveta

    const estimatedSheetAreaInternal = (shellArea + dividersArea + shelvesArea + drawersInternalArea) * complexity;
    const estimatedSheetAreaExternal = frontalArea * 1.3; // Inclui sobras técnicas
    const estimatedBackArea = frontalArea * 1.05;

    const sheetsInternal = Math.ceil((estimatedSheetAreaInternal * 1.15) / (prices[materials.internal]?.area || 5.08) * 10) / 10;
    const sheetsExternal = Math.ceil((estimatedSheetAreaExternal * 1.15) / (prices[materials.external]?.area || 5.08) * 10) / 10;
    const sheetsBack = Math.ceil((estimatedBackArea * 1.15) / (prices[materials.back]?.area || 5.08) * 10) / 10;

    const costInternal = sheetsInternal * (prices[materials.internal]?.price || 265);
    const costExternal = sheetsExternal * (prices[materials.external]?.price || 512);
    const costBack = sheetsBack * (prices[materials.back]?.price || 155);
    
    // Ferragens escalonadas pela complexidade
    const costSlides = drawers * (prices['slide_telescopic']?.price || 35) * (complexity > 1.2 ? 1.5 : 1);
    const costHinges = doors * 2 * (prices['hinge_damper']?.price || 12);
    const miscHardware = 200.00 * complexity;

    const materialTotal = costInternal + costExternal + costBack + costSlides + costHinges + miscHardware;

    // Mão de obra é diretamente afetada pela complexidade do projeto
    const laborCost = (materialTotal * (laborRate / 100)) * complexity;
    const operationalCost = materialTotal * 0.12; 
    
    const subtotal = materialTotal + laborCost + operationalCost;
    const profit = subtotal * (profitMargin / 100);
    const finalPrice = subtotal + profit;

    return {
        materialTotal,
        laborCost,
        profit,
        finalPrice,
        sheets: {
            internal: sheetsInternal,
            external: sheetsExternal,
            back: sheetsBack
        }
    };
};
