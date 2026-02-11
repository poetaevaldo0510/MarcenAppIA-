
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { RenderEngine } from '../core/yara-engine/renderEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { CreditsEngine } from '../core/yara-engine/creditsEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData, RenderVersion } from '../types';

export const ChatFlowService = {
  /**
   * FASE 1-4: Captura, Extração e Validação Técnica
   */
  async executeMaterialization(text: string, image: string | null) {
    const store = useStore.getState();
    
    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA: Extraindo DNA Estrutural...',
      status: 'processing',
      progressiveSteps: { parsed: 'active', render: false, pricing: false, cutPlan: false }
    });

    try {
      const project = await YaraEngine.processInput(
        text, 
        image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined
      );
      
      if (!project) throw new Error("O DNA industrial não pôde ser processado.");

      const isReadyForLock = project.validation?.isValid;

      store.updateMessage(iaraId, {
        text: isReadyForLock 
          ? `Mestre Evaldo, DNA Extraído com fidelidade técnica. Por favor, confirme as medidas abaixo para prosseguirmos com o BLOQUEIO DE PRODUÇÃO (LOCK).`
          : `BLOQUEIO DE SEGURANÇA: O DNA extraído possui inconsistências críticas de medida.`,
        project: { ...project, status: 'validated' },
        status: isReadyForLock ? 'waiting_confirmation' : 'error',
        progressiveSteps: { 
          parsed: isReadyForLock ? 'done' : 'error', 
          render: false, 
          pricing: false, 
          cutPlan: false 
        }
      });

    } catch (e: any) {
      store.updateMessage(iaraId, { 
        text: `FALHA NO HARDWARE YARA: ${e.message}`, 
        status: 'error',
        progressiveSteps: { parsed: 'error', render: false, pricing: false, cutPlan: false }
      });
    } finally {
      store.setLoadingAI(false);
    }
  },

  /**
   * FASE 5: CONFIRMAÇÃO DE PRODUÇÃO (DNA LOCK)
   * Travamento do projeto e geração de entregáveis.
   */
  async confirmAndProduce(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project) return;

    store.updateMessage(messageId, {
      text: "Mestre, confirmando produção. Travando DNA Estrutural (LOCK v1) e ativando hardware de renderização...",
      status: 'processing',
      progressiveSteps: { parsed: 'done', render: 'active', pricing: 'active', cutPlan: 'active' }
    });

    try {
      const project = msg.project;
      
      if (!store.consumeCredits(CreditsEngine.COSTS.COMBO_FULL, `PRODUÇÃO LOCK: ${project.title}`)) {
        throw new Error("Créditos insuficientes para produção industrial completa.");
      }

      // Execução paralela para performance SaaS
      const [renders, pricing, cutPlan] = await Promise.all([
        RenderEngine.generateRender(project, msg.src || undefined),
        BudgetEngine.calculate(project, store.industrialRates),
        CutPlanEngine.optimize(project)
      ]);

      const initialVersion: RenderVersion = {
        version: 1,
        timestamp: new Date().toISOString(),
        faithfulUrl: renders.faithful,
        decoratedUrl: renders.decorated
      };

      const lockedProject: ProjectData = {
        ...project,
        status: 'LOCKED',
        currentVersion: 1,
        renderHistory: [initialVersion],
        render: { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated },
        pricing,
        cutPlan
      };

      store.updateMessage(messageId, {
        text: "PRODUÇÃO BLOQUEADA (LOCKED). Estrutura técnica agora é imutável. Versão 1 materializada com sucesso.",
        project: lockedProject,
        status: 'done',
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'done' }
      });

    } catch (e: any) {
      store.updateMessage(messageId, { 
        text: `ERRO DURANTE PRODUÇÃO: ${e.message}`, 
        status: 'error',
        progressiveSteps: { parsed: 'done', render: 'error', pricing: 'error', cutPlan: 'error' }
      });
    }
  },

  /**
   * RE-RENDERIZAÇÃO DE DNA LOCKED
   */
  async reRenderLocked(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project || msg.project.status !== 'LOCKED') return;

    store.setLoadingAI(true);
    store.updateMessage(messageId, { 
      text: `Acionando hardware para nova visualização do DNA Travado v${msg.project.currentVersion}...`,
      status: 'processing' 
    });

    try {
      const project = msg.project;
      
      if (!store.consumeCredits(CreditsEngine.COSTS.RENDER, `RE-RENDER DNA LOCK: ${project.title}`)) {
        throw new Error("Créditos insuficientes para renderização adicional.");
      }

      const renders = await RenderEngine.generateRender(project, msg.src || undefined);
      
      const newVersionNum = project.currentVersion + 1;
      const newVersion: RenderVersion = {
        version: newVersionNum,
        timestamp: new Date().toISOString(),
        faithfulUrl: renders.faithful,
        decoratedUrl: renders.decorated
      };

      const updatedProject: ProjectData = {
        ...project,
        currentVersion: newVersionNum,
        renderHistory: [...project.renderHistory, newVersion],
        render: { 
          status: 'done', 
          faithfulUrl: renders.faithful, 
          decoratedUrl: renders.decorated 
        }
      };

      store.updateMessage(messageId, {
        text: `Materialização v${newVersionNum} concluída. Geometria original preservada integralmente.`,
        project: updatedProject,
        status: 'done'
      });

    } catch (e: any) {
      store.updateMessage(messageId, { 
        text: `FALHA NO RE-RENDER: ${e.message}`, 
        status: 'error' 
      });
    } finally {
      store.setLoadingAI(false);
    }
  }
};
