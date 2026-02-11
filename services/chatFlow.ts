
import { GoogleGenAI, Modality } from '@google/genai';
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData, RenderVersion } from '../types';

async function playPcmAudio(base64Data: string) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (e) {
    console.error("Erro ao reproduzir áudio PCM:", e);
  }
}

export const ChatFlowService = {
  async executeVoicePipeline(audioBase64: string) {
    const store = useStore.getState();
    const apiKey = store.manualApiKey || process.env.API_KEY;
    
    if (!apiKey) {
      store.addMessage({ from: 'iara', text: "ERRO: Chave Master não detectada.", status: 'error' });
      return;
    }

    const iaraId = store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA: Analisando Frequência Industrial...',
      status: 'processing'
    });

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. Transcrição e Extração via Gemini 3 Flash
      const transcriptionResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/webm;codecs=opus', data: audioBase64 } },
            { text: "Você é um transcritor industrial de marcenaria. Extraia todas as medidas e tipos de módulos informados. Retorne apenas o texto limpo." }
          ]
        }
      });
      const transcript = transcriptionResponse.text || "Comando vocal não capturado.";

      // 2. Processamento do DNA técnico via YaraEngine
      const project = await YaraEngine.processInput(transcript);
      
      // 3. Geração da Confirmação de DNA via TTS
      let confirmationText = "";
      if (project?.validation?.isValid) {
        confirmationText = `DNA Industrial capturado para ${project.title}. Geometria de ${project.environment.width} milímetros validada. Deseja aplicar o LOCK para renderização?`;
      } else {
        confirmationText = `Atenção: Inconsistência geométrica detectada. ${project?.validation?.alerts[0] || 'Por favor, revise os dados.'}`;
      }

      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: confirmationText }] }],
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
        await playPcmAudio(audioData);
      }

      // 4. Sincronização Final da Interface
      store.updateMessage(iaraId, {
        text: confirmationText,
        project: project || undefined,
        status: project?.validation?.isValid ? 'waiting_confirmation' : 'sent'
      });
      store.setLoadingAI(false);

    } catch (e: any) {
      store.updateMessage(iaraId, { text: `FALHA NO CORE: ${e.message}`, status: 'error' });
      store.setLoadingAI(false);
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
      const projectData = await YaraEngine.processInput(text, image ? { type: 'image', url: image, data: image.split(',')[1] } : undefined);
      if (!projectData) throw new Error("DNA indisponível.");

      let responseText = projectData.validation?.isValid 
        ? `DNA Validado. Vão de ${projectData.environment.width}mm reconhecido com ${projectData.modules.length} módulos industriais. Deseja realizar o LOCK?`
        : `BLOQUEIO TÉCNICO: ${projectData.validation?.alerts.join(' ')}`;

      store.updateMessage(iaraId, {
        text: responseText,
        project: projectData,
        status: projectData.validation?.isValid ? 'waiting_confirmation' : 'sent',
      });
    } catch (e: any) {
      store.updateMessage(iaraId, { text: `FALHA NO ESCANEAMENTO: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  },

  async confirmAndProduce(messageId: string) {
    const store = useStore.getState();
    const apiKey = store.manualApiKey || process.env.API_KEY;
    if (!apiKey) return;

    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project) return;

    store.updateMessage(messageId, { 
      status: 'processing', 
      text: 'DNA LOCK ATIVADO. Materializando hardware...',
      progressiveSteps: { parsed: 'done', render: 'active', pricing: 'active', cutPlan: 'active' }
    });

    try {
      const project = msg.project;
      const ai = new GoogleGenAI({ apiKey });
      const finalSeed = project.seed_base + 1;
      const modulesSummary = project.modules?.map((m: any) => 
        `${m.type.toUpperCase()}: ${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm. ${m.material}.`
      ).join("\n");

      const renderPrompt = `INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK]. SEED: ${finalSeed}. Renderize: Ambiente ${project.environment.width}x${project.environment.height}mm com módulos: ${modulesSummary}. Estúdio profissional, iluminação 5000K, fundo neutro.`;

      const renderResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: renderPrompt }] },
        config: {
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
          seed: finalSeed,
          temperature: 0,
        }
      });

      let base64Image = "";
      if (renderResponse.candidates?.[0]?.content?.parts) {
        for (const part of renderResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      const pricing = BudgetEngine.calculate(project, store.industrialRates);
      const cutPlan = CutPlanEngine.optimize(project);

      const v1: RenderVersion = {
        version: 1,
        timestamp: new Date().toISOString(),
        image_url: base64Image,
        faithfulUrl: base64Image,
        decoratedUrl: base64Image,
        seed: finalSeed,
        locked: true
      };

      const updatedProject: ProjectData = {
        ...project,
        status: 'LOCKED',
        currentVersion: 1,
        renderHistory: [v1],
        render: { status: 'done', faithfulUrl: v1.faithfulUrl, decoratedUrl: v1.decoratedUrl },
        pricing,
        cutPlan
      };

      store.updateMessage(messageId, {
        text: "DNA BLOQUEADO. Hardware v1 materializado e validado.",
        project: updatedProject,
        status: 'done',
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'done' }
      });
      
      await store.consumeCredits(10, `PRODUÇÃO: ${project.title}`);
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO INDUSTRIAL: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  },

  async reRenderLocked(messageId: string) {
    const store = useStore.getState();
    const apiKey = store.manualApiKey || process.env.API_KEY;
    if (!apiKey) return;

    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project) return;

    const project = msg.project;
    const nextVersion = (project.currentVersion || 1) + 1;

    try {
      store.updateMessage(messageId, { status: 'processing', text: `Recalibrando renderização industrial v${nextVersion}...` });
      const ai = new GoogleGenAI({ apiKey });
      const finalSeed = project.seed_base + nextVersion;
      const prompt = `INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK]. SEED: ${finalSeed}. AJUSTE VERSÃO ${nextVersion}. Foco em texturas PBR realistas.`;

      const renderResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
          seed: finalSeed,
          temperature: 0,
        }
      });

      let base64Image = "";
      if (renderResponse.candidates?.[0]?.content?.parts) {
        for (const part of renderResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      const newV: RenderVersion = {
        version: nextVersion,
        timestamp: new Date().toISOString(),
        image_url: base64Image,
        faithfulUrl: base64Image,
        decoratedUrl: base64Image,
        seed: finalSeed,
        locked: true
      };

      const updatedProject: ProjectData = {
        ...project,
        currentVersion: nextVersion,
        version_count: (project.version_count || 0) + 1,
        renderHistory: [...(project.renderHistory || []), newV],
        render: { status: 'done', faithfulUrl: newV.faithfulUrl, decoratedUrl: newV.decoratedUrl }
      };

      store.updateMessage(messageId, { project: updatedProject, status: 'done' });
      await store.consumeCredits(5, `AJUSTE V${nextVersion}: ${project.title}`);
    } catch (e: any) {
      store.updateMessage(messageId, { text: `ERRO DE AJUSTE: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  }
};
