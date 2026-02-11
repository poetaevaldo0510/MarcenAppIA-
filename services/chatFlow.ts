
import { YaraEngine } from '../core/yara-engine/yaraEngine';
// Import corrected from PricingEngine to BudgetEngine as pricingEngine.ts is deprecated.
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { RenderEngine } from '../core/yara-engine/renderEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { CreditsEngine } from '../core/yara-engine/creditsEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData, Message } from '../types';

export const ChatFlowService = {
  /**
   * Executa a sequência industrial YARA 1.0
   * Passo 1: Parser (Grátis)
   * Passo 2: Verificação de Créditos
   * Passo 3: Renderização -> Orçamento -> Corte
   */
  async executeMaterialization(
    text: string, 
    image: string | null
  ) {
    const store = useStore.getState();
    
    // Adiciona o typing indicator
    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'Analisando rascunho e interpretando DNA técnico...',
      status: 'processing'
    });

    try {
      // 1. PARSER -> JSON ÚNICO (Grátis)
      const project = await YaraEngine.processInput(
        text, 
        image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined
      );
      
      if (!project) throw new Error("Falha no Hardware de Análise (Parser).");
      
      store.updateMessage(iaraId, {
        text: `Entendi seu projeto: "${project.title}". Iniciando materialização industrial...`,
        progressiveSteps: { parsed: 'done', render: 'active', pricing: false, cutPlan: false }
      });

      // 2. VERIFICAÇÃO DE CRÉDITOS
      const cost = CreditsEngine.COSTS.COMBO_FULL;
      const canProceed = store.consumeCredits(cost, `Projeto: ${project.title}`);
      
      if (!canProceed) {
        store.updateMessage(iaraId, { 
          text: "CRÉDITOS INSUFICIENTES. Por favor, recarregue seu HUB para gerar renders e plano de corte.",
          status: 'error',
          type: 'text'
        });
        return;
      }

      // 3. RENDER (Assíncrono, foco em fidelidade e AD Style)
      // O typing indicator e o estado global 'loadingAI' garantem feedback visual
      const renders = await RenderEngine.generateRender(project, image || undefined);
      
      const projectWithRender: ProjectData = {
        ...project,
        render: {
          status: 'done',
          faithfulUrl: renders.faithful,
          decoratedUrl: renders.decorated
        }
      };

      store.updateMessage(iaraId, { 
        project: projectWithRender,
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'active', cutPlan: false }
      });

      // 4. ORÇAMENTO (Síncrono local)
      // Fix: Use BudgetEngine instead of PricingEngine
      const pricing = BudgetEngine.calculate(projectWithRender, store.industrialRates);
      const projectWithPricing: ProjectData = {
        ...projectWithRender,
        pricing: { ...pricing, creditsUsed: cost }
      };

      store.updateMessage(iaraId, { 
        project: projectWithPricing,
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'active' }
      });

      // 5. PLANO DE CORTE (Síncrono local)
      const cutPlan = CutPlanEngine.optimize(projectWithPricing);
      const finalProject: ProjectData = {
        ...projectWithPricing,
        cutPlan
      };

      // FINALIZAÇÃO: Converte typing para text e status done
      store.updateMessage(iaraId, { 
        text: "Pipeline industrial concluído. Todos os arquivos técnicos e renders 8K já estão disponíveis.",
        project: finalProject, 
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'done' },
        status: 'done',
        type: 'text'
      });

    } catch (e: any) {
      console.error("Pipeline Failure:", e);
      store.updateMessage(iaraId, { 
        text: e.message || "Erro crítico no hardware de materialização.", 
        status: 'error',
        type: 'text'
      });
    } finally {
      store.setLoadingAI(false);
    }
  }
};
