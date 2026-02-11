
import { GoogleGenAI } from "@google/genai";
import { Attachment, ProjectData } from '../../types';
import { IARA_SYSTEM_PROMPT } from '../../constants';
import { useStore } from "../../store/yaraStore";

export const YaraEngine = {
  /**
   * Inicializa o hardware GenAI com a melhor chave disponível.
   */
  getAi: (providedKey?: string) => {
    const apiKey = providedKey || useStore.getState().manualApiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("Chave API não configurada no hardware.");
    return new GoogleGenAI({ apiKey });
  },

  /**
   * Valida a integridade da conexão com o Hub Industrial.
   */
  testConnection: async (keyToTest?: string): Promise<boolean> => {
    try {
      const ai = YaraEngine.getAi(keyToTest);
      // Teste leve usando o modelo flash
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ text: 'HEALTH_CHECK' }],
        config: { maxOutputTokens: 2 }
      });
      return !!response.text;
    } catch (e: any) {
      console.error("Hardware test failed:", e);
      return false;
    }
  },

  /**
   * Processa rascunhos e descrições para extrair o DNA técnico do projeto.
   */
  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    try {
      const ai = YaraEngine.getAi();
      const parts: any[] = [{ text: text || "Analise este rascunho de marcenaria tecnicamente." }];
      
      if (attachment?.data) {
        parts.push({ 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: attachment.data 
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
      const project = parsed.project || parsed;
      
      return {
        ...project,
        projectId: project.projectId || `HUB-${Date.now()}`,
        render: { status: 'pending' },
        pricing: { status: 'pending' },
        cutPlan: { status: 'pending' }
      } as ProjectData;

    } catch (e: any) {
      const errorMsg = e.message || JSON.stringify(e);
      console.error("Yara Engine Error:", errorMsg);
      
      if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
        throw new Error("PERMISSÃO NEGADA (403): O hardware base foi bloqueado. Por favor, insira sua própria Chave API no Admin.");
      }
      if (errorMsg.includes("429")) {
        throw new Error("LIMITE EXCEDIDO (429): Muitas solicitações ao Hub. Aguarde um momento.");
      }
      throw e;
    }
  }
};
