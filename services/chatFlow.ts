
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { RenderEngine } from '../core/yara-engine/renderEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { CreditsEngine } from '../core/yara-engine/creditsEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData, RenderVersion } from '../types';

export const ChatFlowService = {
  async executeMaterialization(text: string, image: string | null) {
    const store = useStore.getState();
    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA: Escaneando DNA Industrial...',
      status: 'processing',
      progressiveSteps: { parsed: 'active', render: false, pricing: false, cutPlan: false }
    });

    try {
      const project = await YaraEngine.processInput(text, image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined);
      if (!project) throw new Error("DNA não extraído.");

      // Inicializa controle de versão e seed
      const enrichedProject: ProjectData = {
        ...project,
        seed_base: Math.floor(Math.random() * 900000) + 100000,
        version_count: 0,
        max_free_versions: 3,
        currentVersion: 0,
        renderHistory: []
      };

      store.updateMessage(iaraId, {
        text: project.validation?.isValid 
          ? `DNA Extraído. Proporções milimétricas validadas. Aguardando comando de BLOQUEIO (LOCK) para materialização.`
          : `AVISO: Erros de geometria detectados. Corrija antes do LOCK.`,
        project: enrichedProject,
        status: 'waiting_confirmation',
        progressiveSteps: { parsed: project.validation?.isValid ? 'done' : 'error', render: false, pricing: false, cutPlan: false }
      });
    } catch (e: any) {
      store.updateMessage(iaraId, { text: `FALHA: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  },

  async confirmAndProduce(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project) return;

    store.updateMessage(messageId, {
      text: "Autorizado. Executando DNA LOCK e Render v1...",
      status: 'processing',
      progressiveSteps: { parsed: 'done', render: 'active', pricing: 'active', cutPlan: 'active' }
    });

    try {
      const project = msg.project;
      if (!store.consumeCredits(CreditsEngine.COSTS.COMBO_FULL, `DNA LOCK: ${project.title}`)) {
        throw new Error("Saldo insuficiente.");
      }

      const [renders, pricing, cutPlan] = await Promise.all([
        RenderEngine.generateRender(project, msg.src || undefined, 1),
        BudgetEngine.calculate(project, store.industrialRates),
        CutPlanEngine.optimize(project)
      ]);

      const v1: RenderVersion = {
        version: 1,
        timestamp: new Date().toISOString(),
        image_url: renders.faithful,
        faithfulUrl: renders.faithful,
        decoratedUrl: renders.decorated,
        seed: renders.seedUsed,
        locked: true
      };

      const lockedProject: ProjectData = {
        ...project,
        status: 'LOCKED',
        dna_locked: { modules: project.modules, environment: project.environment },
        currentVersion: 1,
        version_count: 1,
        renderHistory: [v1],
        render: { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated },
        pricing,
        cutPlan
      };

      store.updateMessage(messageId, {
        text: "DNA BLOQUEADO. Estrutura imutável v1 materializada.",
        project: lockedProject,
        status: 'done',
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'done' }
      });
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO: ${e.message}`, status: 'error' });
    }
  },

  async reRenderLocked(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project || msg.project.status !== 'LOCKED') return;

    const project = msg.project;
    
    // Verificação de Limite de Alterações
    if (project.version_count >= project.max_free_versions && store.currentPlan === 'free') {
      alert("LIMITE ATINGIDO: Você já realizou as 2 alterações gratuitas permitidas. Faça o upgrade para o plano PRO para gerar novas versões deste DNA.");
      return;
    }

    store.setLoadingAI(true);
    const newVersionNum = project.version_count + 1;

    store.updateMessage(messageId, { 
      text: `Gerando Versão ${newVersionNum} (Ajuste Controlado)...`,
      status: 'processing' 
    });

    try {
      const cost = newVersionNum > 3 ? CreditsEngine.COSTS.RENDER : 0; // Grátis até 3, depois cobra
      if (cost > 0 && !store.consumeCredits(cost, `Re-render v${newVersionNum}: ${project.title}`)) {
        throw new Error("Saldo insuficiente para alteração extra.");
      }

      const renders = await RenderEngine.generateRender(project, msg.src || undefined, newVersionNum);
      
      const newVersion: RenderVersion = {
        version: newVersionNum,
        timestamp: new Date().toISOString(),
        image_url: renders.faithful,
        faithfulUrl: renders.faithful,
        decoratedUrl: renders.decorated,
        seed: renders.seedUsed,
        locked: true
      };

      const updatedProject: ProjectData = {
        ...project,
        currentVersion: newVersionNum,
        version_count: newVersionNum,
        renderHistory: [...project.renderHistory, newVersion],
        render: { status: 'done', faithfulUrl: renders.faithful, decoratedUrl: renders.decorated }
      };

      store.updateMessage(messageId, {
        text: `Versão ${newVersionNum} materializada. Consistência estrutural preservada via Seed +${newVersionNum}.`,
        project: updatedProject,
        status: 'done'
      });
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  }
};
