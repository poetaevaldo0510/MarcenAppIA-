
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { PricingEngine } from '../core/yara-engine/pricingEngine';
import { RenderEngine } from '../core/yara-engine/renderEngine';
import { ProjectData } from '../types';

export const ChatFlowService = {
  /**
   * Executa o pipeline completo de materialização do projeto.
   */
  async executeMaterialization(
    text: string, 
    image: string | null, 
    onUpdate: (payload: any) => void
  ) {
    // 1. Análise de DNA Técnico (Flash Model)
    const project = await YaraEngine.processInput(
      text, 
      image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined
    );
    
    if (!project) throw new Error("Falha na análise técnica.");
    onUpdate({ project, step: 'parsed' });

    // 2. Cálculo Industrial (Pricing Engine)
    // Usamos os rates default ou do store (passados externamente se necessário)
    const pricing = PricingEngine.calculate(project, { mdf: 440, markup: 2.2 });
    onUpdate({ project: { ...project, pricing }, step: 'pricing' });

    // 3. Renderização Fotorrealista (Pro Image Model)
    const renders = await RenderEngine.generate(project, image || undefined);
    
    return {
      ...project,
      pricing,
      render: {
        status: 'done' as const,
        faithfulUrl: renders.faithful,
        decoratedUrl: renders.decorated
      }
    };
  }
};
