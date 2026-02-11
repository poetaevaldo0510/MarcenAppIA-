
import { GoogleGenAI, Modality } from '@google/genai';
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { useStore } from '../store/yaraStore';
import { supabase } from '../lib/supabase';
import { ProjectData, RenderVersion } from '../types';

export const ChatFlowService = {
  /**
   * VOICE PIPELINE - Execução direta no cliente para evitar erros de rota de API.
   */
  async executeVoicePipeline(audioBase64: string) {
    const store = useStore.getState();
    const apiKey = store.manualApiKey || process.env.API_KEY;
    
    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA: Analisando Frequência Industrial...',
      status: 'processing'
    });

    try {
      if (!apiKey) throw new Error("Chave API ausente no hardware.");
      const ai = new GoogleGenAI({ apiKey });

      // 1. Transcrição e Extração via Gemini
      const transcriptionResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/webm;codecs=opus', data: audioBase64 } },
            { text: "Extraia apenas os dados estruturais (medidas e módulos) deste comando de marcenaria. Seja conciso." }
          ]
        }
      });
      const transcript = transcriptionResponse.text || "comando não identificado";

      // 2. Geração de Resposta Vocal (TTS)
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ 
          parts: [{ 
            text: `DNA Estrutural capturado para ${transcript}. Validando geometria para travamento industrial. Deseja prosseguir com o LOCK?` 
          }] 
        }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });

      const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
        audio.play().catch(console.error);
      }

      await this.executeMaterialization(transcript, null, iaraId);
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
      status: 'processing'
    });

    try {
      const project = await YaraEngine.processInput(text, image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined);
      if (!project) throw new Error("DNA não extraído.");

      const correction = YaraEngine.suggestCorrection(project);

      const enrichedProject: ProjectData = {
        ...project,
        seed_base: Math.floor(Math.random() * 900000) + 100000,
        version_count: 0,
        currentVersion: 0,
        renderHistory: []
      };

      let responseText = project.validation?.isValid 
        ? `DNA Validado. Estrutura industrial de ${project.environment.width}mm verificada. Deseja TRAVAR O LOCK para materialização?`
        : `BLOQUEIO TÉCNICO: ${project.validation?.alerts[0]}`;

      if (correction) {
        responseText += `\n\n${correction}`;
      }

      store.updateMessage(iaraId, {
        text: responseText,
        project: enrichedProject,
        status: project.validation?.isValid ? 'waiting_confirmation' : 'sent',
      });
    } catch (e: any) {
      store.updateMessage(iaraId, { text: `FALHA: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  },

  /**
   * CONFIRMAÇÃO E PRODUÇÃO - Agora executado diretamente no cliente
   */
  async confirmAndProduce(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project || !store.user) return;

    store.updateMessage(messageId, { status: 'processing', text: 'DNA LOCK ATIVADO. Materializando hardware...' });

    try {
      const project = msg.project;
      const apiKey = store.manualApiKey || process.env.API_KEY;
      if (!apiKey) throw new Error("Hardware sem chave API.");

      // 1. Registrar Projeto no Supabase
      const { data: dbProject, error: dbError } = await supabase
        .from('projects')
        .insert({
          user_id: store.user.id,
          title: project.title,
          dna_locked: project,
          status: 'LOCKED'
        })
        .select()
        .single();

      if (dbError) console.warn("Aviso: Supabase DB indisponível ou erro no insert.", dbError);

      // 2. Geração de Render Local
      const ai = new GoogleGenAI({ apiKey });
      const finalSeed = project.seed_base + 1;
      const modulesSummary = project.modules?.map((m: any) => 
        `${m.type.toUpperCase()}: ${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm. ${m.material}.`
      ).join("\n");

      const prompt = `INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK]. SEED_ID: ${finalSeed} Renderize: ${modulesSummary}`;
      
      const renderRes = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" }, seed: finalSeed, temperature: 0 }
      });

      let base64Image = "";
      if (renderRes.candidates?.[0]?.content?.parts) {
        for (const part of renderRes.candidates[0].content.parts) {
          if (part.inlineData) { base64Image = part.inlineData.data; break; }
        }
      }
      if (!base64Image) throw new Error("Falha no hardware de imagem.");

      // 3. Simular/Tentar Upload no Storage (Supabase)
      const publicUrl = `data:image/png;base64,${base64Image}`;
      const fileName = `${dbProject?.id || 'temp'}/v1_faithful_${Date.now()}.png`;
      
      try {
        const binaryString = atob(base64Image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
        await supabase.storage.from('renders').upload(fileName, bytes, { contentType: 'image/png' });
      } catch (stErr) {
        console.warn("Storage skip ou indisponível.");
      }

      // 4. Cálculos e Enriquecimento
      const pricing = BudgetEngine.calculate(project, store.industrialRates);
      const cutPlan = CutPlanEngine.optimize(project);

      const v1: RenderVersion = {
        version: 1,
        timestamp: new Date().toISOString(),
        image_url: publicUrl,
        faithfulUrl: publicUrl,
        decoratedUrl: publicUrl,
        seed: finalSeed,
        locked: true
      };

      const updatedProject: ProjectData = {
        ...project,
        projectId: dbProject?.id || project.projectId,
        status: 'LOCKED',
        currentVersion: 1,
        renderHistory: [v1],
        render: { status: 'done', faithfulUrl: v1.faithfulUrl, decoratedUrl: v1.decoratedUrl },
        pricing,
        cutPlan
      };

      store.updateMessage(messageId, {
        text: "DNA BLOQUEADO. Hardware v1 materializado.",
        project: updatedProject,
        status: 'done'
      });
      
      await store.consumeCredits(10, `DNA LOCK: ${project.title}`);
      await store.syncUserFromDB();
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO INDUSTRIAL: ${e.message}`, status: 'error' });
    }
  },

  async reRenderLocked(messageId: string) {
    const store = useStore.getState();
    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project || !store.user) return;

    const project = msg.project;
    const nextVersion = (project.currentVersion || 1) + 1;
    const apiKey = store.manualApiKey || process.env.API_KEY;

    try {
      if (!apiKey) throw new Error("Hardware sem chave API.");
      store.updateMessage(messageId, { status: 'processing', text: `Executando ajuste v${nextVersion}...` });

      const ai = new GoogleGenAI({ apiKey });
      const finalSeed = project.seed_base + nextVersion;
      const prompt = `INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK]. SEED_ID: ${finalSeed} AJUSTE VERSÃO ${nextVersion}`;
      
      const renderRes = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" }, seed: finalSeed, temperature: 0 }
      });

      let base64Image = "";
      if (renderRes.candidates?.[0]?.content?.parts) {
        for (const part of renderRes.candidates[0].content.parts) {
          if (part.inlineData) { base64Image = part.inlineData.data; break; }
        }
      }
      const publicUrl = `data:image/png;base64,${base64Image}`;

      const newV: RenderVersion = {
        version: nextVersion,
        timestamp: new Date().toISOString(),
        image_url: publicUrl,
        faithfulUrl: publicUrl,
        decoratedUrl: publicUrl,
        seed: finalSeed,
        locked: true
      };

      const updatedProject: ProjectData = {
        ...project,
        currentVersion: nextVersion,
        version_count: project.version_count + 1,
        renderHistory: [...project.renderHistory, newV],
        render: { status: 'done', faithfulUrl: newV.faithfulUrl, decoratedUrl: newV.decoratedUrl }
      };

      store.updateMessage(messageId, { project: updatedProject, status: 'done' });
      await store.consumeCredits(5, `Re-Render v${nextVersion}: ${project.title}`);
      await store.syncUserFromDB();
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO DE AJUSTE: ${e.message}`, status: 'error' });
    }
  }
};
