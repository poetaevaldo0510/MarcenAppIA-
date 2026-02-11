
export const CreditsEngine = {
  COSTS: {
    PARSER: 0, // Parser básico é cortesia
    RENDER: 5,
    BUDGET: 3,
    CUT_PLAN: 4,
    COMBO_FULL: 10 // Render + Budget + CutPlan (Desconto de 2 créditos)
  },

  PLANS: {
    BASIC: { name: 'Básico', credits: 50, price: 99 },
    PRO: { name: 'Profissional', credits: 150, price: 249 },
    STUDIO: { name: 'Estúdio', credits: 400, price: 599 },
    ENTERPRISE: { name: 'Enterprise', credits: 9999, price: 1999 }
  },

  calculateRequired: (features: { render: boolean; budget: boolean; cutPlan: boolean }) => {
    if (features.render && features.budget && features.cutPlan) return CreditsEngine.COSTS.COMBO_FULL;
    
    let total = 0;
    if (features.render) total += CreditsEngine.COSTS.RENDER;
    if (features.budget) total += CreditsEngine.COSTS.BUDGET;
    if (features.cutPlan) total += CreditsEngine.COSTS.CUT_PLAN;
    
    return total;
  }
};
