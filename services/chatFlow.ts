
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { CreditsEngine } from '../core/yara-engine/creditsEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData, RenderVersion } from '../types';

export const ChatFlowService = {
  /**
   * VOICE PIPELINE v6.0 - IDENTIDADE SONORA EXECUTIVA
   */
  async executeVoicePipeline(audioBase64: string) {
    const store = useStore.getState();
    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA: Analisando Frequência Técnica...',
      status: 'processing'
    });

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioData: audioBase64 })
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Reprodução imediata da voz executiva da YARA
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.play();
      }

      // Encaminha para o motor de extração técnica
      await this.executeMaterialization(data.transcript, null, iaraId);

    } catch (e: any) {
      store.updateMessage(iaraId, { text: `ERRO DE VOZ: ${e.message}`, status: 'error' });
    }
  },

  async executeMaterialization(text: string, image: string | null, existingId?: string) {
    const store = useStore.getState();
    const iaraId = existingId || store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA: Escaneando DNA Industrial...',
      status: 'processing',
      progressiveSteps: { parsed: 'active', render: false, pricing: false, cutPlan: false }
    });

    try {
      const project = await YaraEngine.processInput(text, image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined);
      if (!project) throw new Error("DNA não identificado.");

      const enrichedProject: ProjectData = {
        ...project,
        seed_base: Math.floor(Math.random() * 900000) + 100000,
        version_count: 0,
        max_free_versions: 3,
        currentVersion: 0,
        renderHistory: []
      };

      // Protocolo de Bloqueio Industrial: Se não for válido, não oferece LOCK
      if (!project.validation?.isValid) {
        store.updateMessage(iaraId, {
          text: `BLOQUEIO TÉCNICO: ${project.validation?.alerts[0] || 'Dados insuficientes para engenharia.'}\n\nPor favor, informe as medidas corretas para prosseguir.`,
          project: enrichedProject,
          status: 'sent',
          progressiveSteps: { parsed: 'error', render: false, pricing: false, cutPlan: false }
        });
      } else {
        store.updateMessage(iaraId, {
          text: `DNA Validado com sucesso. Estrutura de ${project.environment.width}mm verificada matematicamente.\n\nConfirmar travamento (DNA LOCK)?`,
          project: enrichedProject,
          status: 'waiting_confirmation',
          progressiveSteps: { parsed: 'done', render: false, pricing: false, cutPlan: false }
        });
      }
    } catch (e: any) {
      store.updateMessage(iaraId, { text: `FALHA NO CORE: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  },

  async confirmAndProduce(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project || !msg.project.validation.isValid) return;

    store.updateMessage(messageId, {
      text: "Protocolo LOCK Ativado. Materializando Hardware Industrial v1...",
      status: 'processing',
      progressiveSteps: { parsed: 'done', render: 'active', pricing: 'active', cutPlan: 'active' }
    });

    try {
      const project = msg.project;
      if (!store.consumeCredits(CreditsEngine.COSTS.COMBO_FULL, `DNA LOCK: ${project.title}`)) {
        throw new Error("Créditos insuficientes no Hub.");
      }

      const [renderRes, pricing, cutPlan] = await Promise.all([
        fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dna: project, version: 1, seed_base: project.seed_base, style: 'faithful' })
        }).then(r => r.json()),
        BudgetEngine.calculate(project, store.industrialRates),
        CutPlanEngine.optimize(project)
      ]);

      if (renderRes.error) throw new Error(renderRes.error);

      const v1: RenderVersion = {
        version: 1,
        timestamp: new Date().toISOString(),
        image_url: renderRes.image,
        faithfulUrl: renderRes.image,
        decoratedUrl: renderRes.image,
        seed: renderRes.seed,
        locked: true
      };

      const lockedProject: ProjectData = {
        ...project,
        status: 'LOCKED',
        dna_locked: { modules: project.modules, environment: project.environment },
        currentVersion: 1,
        version_count: 1,
        renderHistory: [v1],
        render: { status: 'done', faithfulUrl: v1.faithfulUrl, decoratedUrl: v1.decoratedUrl },
        pricing,
        cutPlan
      };

      store.updateMessage(messageId, {
        text: "DNA BLOQUEADO. Engenharia v1 concluída com fidelidade milimétrica.",
        project: lockedProject,
        status: 'done',
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'done' }
      });
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO INDUSTRIAL: ${e.message}`, status: 'error' });
    }
  },

  async reRenderLocked(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project) return;

    const project = msg.project;
    const nextVersion = (project.currentVersion || 1) + 1;

    // SaaS Limit
    if (project.version_count >= project.max_free_versions && store.currentPlan === 'free') {
      alert("LIMITE ATINGIDO: Upgrade para PRO necessário para novas variações.");
      return;
    }

    try {
      store.updateMessage(messageId, { status: 'processing' });
      
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          dna: project.dna_locked || project, 
          version: nextVersion, 
          seed_base: project.seed_base, 
          style: 'faithful' 
        })
      });
      const renderRes = await res.json();
      if (renderRes.error) throw new Error(renderRes.error);

      const newVersion: RenderVersion = {
        version: nextVersion,
        timestamp: new Date().toISOString(),
        image_url: renderRes.image,
        faithfulUrl: renderRes.image,
        decoratedUrl: renderRes.image,
        seed: renderRes.seed,
        locked: true
      };

      const updatedProject: ProjectData = {
        ...project,
        currentVersion: nextVersion,
        version_count: project.version_count + 1,
        renderHistory: [...project.renderHistory, newVersion],
        render: { 
          ...project.render,
          status: 'done', 
          faithfulUrl: newVersion.faithfulUrl, 
          decoratedUrl: newVersion.decoratedUrl 
        }
      };

      store.updateMessage(messageId, {
        project: updatedProject,
        status: 'done'
      });
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO RE-RENDER: ${e.message}`, status: 'error' });
    }
  }
};
