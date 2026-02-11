
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { RenderEngine } from '../core/yara-engine/renderEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { CreditsEngine } from '../core/yara-engine/creditsEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData } from '../types';

export const ChatFlowService = {
  /**
   * Orquestrador de Engenharia Industrial Yara.
   * Mantém o usuário informado através de estados granulares de progresso.
   */
  async executeMaterialization(text: string, image: string | null) {
    const store = useStore.getState();
    
    // Passo 0: Resposta Otimista Imediata
    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA ativando núcleos de engenharia industrial...',
      status: 'processing',
      progressiveSteps: { parsed: 'active', render: false, pricing: false, cutPlan: false }
    });

    try {
      // 1. DNA TÉCNICO (Yara Parsers)
      const project = await YaraEngine.processInput(
        text, 
        image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined
      );
      
      if (!project) throw new Error("Falha ao interpretar as especificações técnicas.");
      
      store.updateMessage(iaraId, {
        text: `Projeto "${project.title}" interpretado. Iniciando Renderização 8K e Orçamento...`,
        progressiveSteps: { parsed: 'done', render: 'active', pricing: false, cutPlan: false }
      });

      // 2. SISTEMA DE CRÉDITOS
      const cost = CreditsEngine.COSTS.COMBO_FULL;
      if (!store.consumeCredits(cost, `Engenharia Industrial: ${project.title}`)) {
        store.updateMessage(iaraId, { 
          text: "SALDO HUB INSUFICIENTE. O MarcenApp requer créditos para processar o motor Pro.",
          status: 'error',
          progressiveSteps: { parsed: 'done', render: 'error', pricing: 'error', cutPlan: 'error' }
        });
        return;
      }

      // 3. RENDERIZAÇÃO (Processamento Assíncrono)
      let renders;
      try {
        renders = await RenderEngine.generateRender(project, image || undefined);
      } catch (renderError: any) {
        console.error("Render fail:", renderError);
        // O projeto continua mesmo se o render falhar (ex: chave sem permissão de imagem)
        store.updateMessage(iaraId, {
           progressiveSteps: { parsed: 'done', render: 'error', pricing: 'active', cutPlan: false }
        });
      }

      // 4. PRECIFICAÇÃO & CNC (Engines Locais)
      const projectWithPartialData: ProjectData = {
        ...project,
        render: renders ? { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated } : { status: 'error' }
      };

      store.updateMessage(iaraId, {
        progressiveSteps: { 
          parsed: 'done', 
          render: renders ? 'done' : 'error', 
          pricing: 'active', 
          cutPlan: 'active' 
        }
      });

      const pricing = BudgetEngine.calculate(projectWithPartialData, store.industrialRates);
      const cutPlan = CutPlanEngine.optimize(projectWithPartialData);
      
      const finalProject: ProjectData = { ...projectWithPartialData, pricing, cutPlan };

      // 5. CONCLUSÃO DO PROCESSO
      store.updateMessage(iaraId, { 
        text: renders 
          ? "Materialização industrial completa. O projeto está pronto para apresentação e produção."
          : "Orçamento e Plano de Corte concluídos. Aviso: O motor de Render Pro não pôde ser ativado (verifique sua chave API).",
        project: finalProject, 
        progressiveSteps: { parsed: 'done', render: renders ? 'done' : 'error', pricing: 'done', cutPlan: 'done' },
        status: 'done'
      });

    } catch (e: any) {
      console.error("Pipeline Failure:", e);
      const msg = e.message || JSON.stringify(e);
      
      store.updateMessage(iaraId, { 
        text: `ERRO DE HUB: ${msg.includes("403") || msg.includes("PERMISSION_DENIED") 
          ? "Sua chave API não possui as permissões necessárias para o motor industrial." 
          : msg}`, 
        status: 'error'
      });
    } finally {
      store.setLoadingAI(false);
    }
  }
};
