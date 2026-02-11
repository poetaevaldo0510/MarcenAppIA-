
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { PricingEngine } from '../core/yara-engine/pricingEngine';
import { RenderEngine } from '../core/yara-engine/renderEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { CreditsEngine } from '../core/yara-engine/creditsEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData } from '../types';

export const ChatFlowService = {
  /**
   * Executa o pipeline industrial completo e sequencial com consumo de créditos.
   */
  async executeMaterialization(
    text: string, 
    image: string | null, 
    onUpdate: (payload: { project: ProjectData, step: string }) => void
  ) {
    const store = useStore.getState();
    
    // 1. INPUT -> PARSER -> JSON ÚNICO (GRÁTIS)
    const project = await YaraEngine.processInput(
      text, 
      image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined
    );
    
    if (!project) throw new Error("Falha no Hardware de Análise (Parser).");
    onUpdate({ project, step: 'parsed' });

    // Verificação de Créditos para o Combo Completo
    const cost = CreditsEngine.COSTS.COMBO_FULL;
    const canProceed = store.consumeCredits(cost, `Projeto Materializado: ${project.title}`);
    
    if (!canProceed) {
      throw new Error("CRÉDITOS INSUFICIENTES. Recarregue seu HUB no painel financeiro.");
    }

    // 2. RENDER (Baseado no JSON Único)
    const renders = await RenderEngine.generate(project, image || undefined);
    const projectWithRender: ProjectData = {
      ...project,
      render: {
        status: 'done',
        faithfulUrl: renders.faithful,
        decoratedUrl: renders.decorated
      }
    };
    onUpdate({ project: projectWithRender, step: 'render' });

    // 3. ORÇAMENTO (Baseado no JSON Único)
    const pricing = PricingEngine.calculate(projectWithRender, store.industrialRates);
    const projectWithPricing: ProjectData = {
      ...projectWithRender,
      pricing: {
        ...pricing,
        // Garantindo que creditsUsed seja atribuído conforme exigido pela interface ProjectData
        creditsUsed: cost
      }
    };
    onUpdate({ project: projectWithPricing, step: 'pricing' });

    // 4. PLANO DE CORTE (Baseado no JSON Único)
    const cutPlan = CutPlanEngine.optimize(projectWithPricing);
    const finalProject: ProjectData = {
      ...projectWithPricing,
      cutPlan
    };
    onUpdate({ project: finalProject, step: 'cutPlan' });

    return finalProject;
  }
};
