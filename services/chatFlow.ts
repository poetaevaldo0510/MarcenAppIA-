
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { YaraEngine } from '../core/yara-engine/yaraEngine';
import { BudgetEngine } from '../core/yara-engine/budgetEngine';
import { CutPlanEngine } from '../core/yara-engine/cutPlanEngine';
import { useStore } from '../store/yaraStore';
import { ProjectData, RenderVersion } from '../types';
import { IARA_SYSTEM_PROMPT } from '../constants';

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
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      store.addMessage({ from: 'iara', text: "ERRO: Chave Master necessária para hardware de voz.", status: 'error' });
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
      
      const transcriptionResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/webm;codecs=opus', data: audioBase64 } },
            { text: "Você é um transcritor industrial de marcenaria. Extraia as medidas (em mm) e os módulos mencionados. Retorne apenas a transcrição limpa." }
          ]
        }
      });
      const transcript = transcriptionResponse.text || "Comando vocal não interpretado.";

      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `DNA Estrutural capturado para: ${transcript}. Validando geometria para travamento industrial. Deseja prosseguir com o LOCK?` }] }],
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

      await this.executeMaterialization(transcript, null, iaraId);
    } catch (e: any) {
      console.error("Voice Pipeline Error:", e);
      const errorMsg = e.message?.toLowerCase().includes("failed to fetch")
        ? "Erro de Conexão: Hardware de Voz inacessível."
        : `Erro Industrial: ${e.message}`;
      store.updateMessage(iaraId, { text: errorMsg, status: 'error' });
      store.setLoadingAI(false);
    }
  },

  async executeMaterialization(text: string, image: string | null, existingId?: string) {
    const store = useStore.getState();
    const apiKey = process.env.API_KEY;
    const iaraId = existingId || store.addMessage({
      from: 'iara',
      type: 'typing',
      text: 'YARA: Escaneando DNA Industrial...',
      status: 'processing'
    });

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. EXTRAÇÃO DE DNA VIA GEMINI 3 FLASH
      const parts: any[] = [{ text: text || "Analise as medidas e estrutura deste projeto de marcenaria." }];
      if (image) {
        parts.push({ 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: image.split(',')[1] 
          } 
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: { 
          systemInstruction: IARA_SYSTEM_PROMPT, 
          responseMimeType: "application/json" 
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      const projectData = parsed.project || parsed;
      const validation = YaraEngine.validateGeometry(projectData);
      
      // 2. AUDITORIA ESTRATÉGICA (COPILOTO)
      const auditResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Audite este DNA de marcenaria para viabilidade técnica e sugira melhorias de design industrial: ${JSON.stringify(projectData)}`,
        config: {
          systemInstruction: "Você é um auditor sênior de marcenaria industrial. Analise folgas, travamentos e ergonomia."
        }
      });
      const auditReport = auditResponse.text || "Auditoria concluída.";

      const enrichedProject: ProjectData = {
        ...projectData,
        projectId: projectData.projectId || `YARA-${Date.now()}`,
        complexity: projectData.complexity || 5,
        seed_base: Math.floor(Math.random() * 900000) + 100000,
        version_count: 0,
        currentVersion: 0,
        renderHistory: [],
        status: validation.isValid ? 'validated' : 'draft',
        validation: {
          isValid: validation.isValid,
          alerts: validation.alerts,
          coherenceScore: validation.isValid ? 100 : 0
        },
        render: { status: 'pending' }
      };

      const correction = YaraEngine.suggestCorrection(enrichedProject);
      let responseText = enrichedProject.validation?.isValid 
        ? `DNA Validado. Estrutura industrial de ${enrichedProject.environment.width}mm verificada com ${enrichedProject.modules.length} módulos.\n\nAUDITORIA: ${auditReport}\n\nDeseja TRAVAR O LOCK para materialização?`
        : `BLOQUEIO TÉCNICO: ${enrichedProject.validation?.alerts.join(', ')}`;

      if (correction) {
        responseText += `\n\n${correction}`;
      }

      store.updateMessage(iaraId, {
        text: responseText,
        project: enrichedProject,
        status: enrichedProject.validation?.isValid ? 'waiting_confirmation' : 'sent',
      });
    } catch (e: any) {
      console.error("Materialization Error:", e);
      const errorMsg = e.message?.toLowerCase().includes("failed to fetch")
        ? "Erro de Rede: O motor de Geometria Yara falhou ao conectar com o hub central."
        : `FALHA NO ESCANEAMENTO: ${e.message}`;
      store.updateMessage(iaraId, { text: errorMsg, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  },

  async confirmAndProduce(messageId: string) {
    const store = useStore.getState();
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;

    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project) return;

    store.updateMessage(messageId, { 
      status: 'processing', 
      text: 'DNA LOCK ATIVADO. Materializando hardware e gerando custos...',
      progressiveSteps: { parsed: 'done', render: 'active', pricing: 'active', cutPlan: 'active' }
    });

    try {
      const project = msg.project;
      const ai = new GoogleGenAI({ apiKey });
      const finalSeed = project.seed_base + 1;
      const modulesSummary = project.modules?.map((m: any) => 
        `${m.type.toUpperCase()}: ${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm. ${m.material}.`
      ).join("\n");

      // RENDERIZAÇÃO 1:1 (FAITHFUL)
      const renderPrompt = `INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK]. SEED_ID: ${finalSeed}. Renderize exatamente: Ambiente ${project.environment.width}x${project.environment.height}mm com módulos: ${modulesSummary}. Estúdio técnico de marcenaria, iluminação suave, foco na precisão milimétrica.`;

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

      if (!base64Image) throw new Error("Hardware de renderização retornou vazio.");

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
        projectId: `P-${Date.now()}`,
        status: 'LOCKED',
        currentVersion: 1,
        renderHistory: [v1],
        render: { status: 'done', faithfulUrl: v1.faithfulUrl, decoratedUrl: v1.decoratedUrl },
        pricing,
        cutPlan
      };

      store.updateMessage(messageId, {
        text: "DNA BLOQUEADO COM SUCESSO. Hardware materializado com plano de corte e orçamento industrial pronto.",
        project: updatedProject,
        status: 'done',
        progressiveSteps: { parsed: 'done', render: 'done', pricing: 'done', cutPlan: 'done' }
      });
      
      await store.consumeCredits(10, `PROJETO: ${project.title}`);
    } catch (e: any) {
      console.error("Confirm/Produce Error:", e);
      const errorMsg = e.message?.toLowerCase().includes("failed to fetch")
        ? "Erro de Conexão: O servidor de renderização industrial não respondeu."
        : `ERRO INDUSTRIAL: ${e.message}`;
      store.updateMessage(messageId, { text: errorMsg, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  },

  async reRenderLocked(messageId: string) {
    const store = useStore.getState();
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;

    const msg = store.messages.find(m => m.id === messageId);
    if (!msg || !msg.project) return;

    const project = msg.project;
    const nextVersion = (project.currentVersion || 1) + 1;

    try {
      store.updateMessage(messageId, { status: 'processing', text: `Recalibrando renderização v${nextVersion}...` });

      const ai = new GoogleGenAI({ apiKey });
      const finalSeed = project.seed_base + nextVersion;
      const prompt = `INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK]. SEED_ID: ${finalSeed}. AJUSTE VERSÃO ${nextVersion} DE MARCENARIA. Foco total em proporções industriais e acabamento premium.`;

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

      if (!base64Image) throw new Error("Falha ao gerar nova versão de imagem.");

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

      store.updateMessage(messageId, { project: updatedProject, status: 'done', text: `Versão ${nextVersion} materializada.` });
      await store.consumeCredits(5, `AJUSTE: ${project.title}`);
    } catch (e: any) {
      console.error("Re-render Error:", e);
      store.updateMessage(messageId, { text: `ERRO DE AJUSTE: ${e.message}`, status: 'error' });
    } finally {
      store.setLoadingAI(false);
    }
  }
};
