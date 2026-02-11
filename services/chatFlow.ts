
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { RenderEngine } from '../core/yara-engine/renderEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { CreditsEngine } from '../core/yara-engine/creditsEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData } from '../types';

export const ChatFlowService = {
  /**
   * Pipeline Yara Supreme. 
   * Orquestra parsing, render, precificação e otimização CNC.
   */
  async executeMaterialization(text: string, image: string | null) {
    const store = useStore.getState();
    
    // UI Otimista: Yara responde que começou
    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA ativando núcleos de engenharia...',
      status: 'processing',
      progressiveSteps: { parsed: 'active', render: false, pricing: false, cutPlan: false }
    });

    try {
      // 1. DNA TÉCNICO (Parsing)
      const project = await YaraEngine.processInput(
        text, 
        image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined
      );
      
      if (!project) throw new Error("Não consegui interpretar as especificações técnicas.");
      
      store.updateMessage(iaraId, {
        text: `Projeto "${project.title}" interpretado. Iniciando Renderização 8K e Orçamento Hub...`,
        progressiveSteps: { parsed: 'done', render: 'active', pricing: false, cutPlan: false }
      });

      // 2. CRÉDITOS E SEGURANÇA
      const cost = CreditsEngine.COSTS.COMBO_FULL;
      if (!store.consumeCredits(cost, `Engenharia Pro: ${project.title}`)) {
        store.updateMessage(iaraId, { 
          text: "SALDO HUB INSUFICIENTE. Por favor, recarregue seus créditos para processar este projeto.",
          status: 'error'
        });
        return;
      }

      // 3. RENDERIZAÇÃO (Fidelidade AD Style)
      let renders;
      try {
        renders = await RenderEngine.generateRender(project, image || undefined);
      } catch (renderError: any) {
        console.error("Render fail:", renderError);
        // Fallback de estado se render falhar mas precificação puder seguir
        store.updateMessage(iaraId, {
           progressiveSteps: { parsed: 'done', render: 'error', pricing: 'active', cutPlan: false }
        });
      }

      // 4. PRECIFICAÇÃO E CNC (Processamento Local Industrial)
      const projectWithRender: ProjectData = {
        ...project,
        render: renders ? { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated } : { status: 'error' }
      };

      store.updateMessage(iaraId, {
        progressiveSteps: { parsed: 'done', render: renders ? 'done' : 'error', pricing: 'active', cutPlan: 'active' }
      });

      const pricing = BudgetEngine.calculate(projectWithRender, store.industrialRates);
      const cutPlan = CutPlanEngine.optimize(projectWithRender);
      
      const finalProject: ProjectData = { ...projectWithRender, pricing, cutPlan };

      // 5. FINALIZAÇÃO
      store.updateMessage(iaraId, { 
        text: renders 
          ? "Materialização industrial concluída com sucesso. Visualize os renders e o orçamento abaixo."
          : "Orçamento e Plano CNC concluídos, porém houve um erro no motor de renderização (verifique sua chave API).",
        project: finalProject, 
        progressiveSteps: { parsed: 'done', render: renders ? 'done' : 'error', pricing: 'done', cutPlan: 'done' },
        status: 'done'
      });

    } catch (e: any) {
      console.error("Yara Critical Failure:", e);
      const msg = e.message || JSON.stringify(e);
      
      store.updateMessage(iaraId, { 
        text: `ERRO DE HUB: ${msg.includes("403") ? "Chave API sem permissão para este motor." : msg}`, 
        status: 'error'
      });
    } finally {
      store.setLoadingAI(false);
    }
  }
};
