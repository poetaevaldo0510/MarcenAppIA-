
import { GoogleGenAI } from "@google/genai";
import { Attachment, ProjectData } from '../../types';
import { IARA_SYSTEM_PROMPT } from '../../constants';
import { useStore } from "../../store/yaraStore";

export const YaraEngine = {
  getAi: () => {
    const apiKey = useStore.getState().manualApiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("Chave API ausente no hardware.");
    return new GoogleGenAI({ apiKey });
  },

  testConnection: async (keyToTest?: string): Promise<boolean> => {
    try {
      const apiKey = keyToTest || useStore.getState().manualApiKey || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ text: 'PING' }],
        config: { maxOutputTokens: 2 }
      });
      return !!response.text;
    } catch (e: any) { return false; }
  },

  /**
   * FASE 2 & 3: EXTRAÇÃO TÉCNICA E VALIDAÇÃO GEOMÉTRICA
   */
  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    try {
      const ai = YaraEngine.getAi();
      const parts: any[] = [{ text: text || "Analise as medidas e estrutura deste projeto de marcenaria." }];
      
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
      const projectData = parsed.project || parsed;
      
      // Validação Adicional via Código (Camada de Segurança)
      const sumModulesW = projectData.modules?.reduce((acc: number, m: any) => acc + (m.dimensions?.w || 0), 0) || 0;
      const envW = projectData.environment?.width || 0;
      
      if (envW > 0 && Math.abs(sumModulesW - envW) > 10) { // Tolerância de 10mm
        projectData.validation.isValid = false;
        projectData.validation.alerts.push(`CONFLITO GEOMÉTRICO: A soma dos módulos (${sumModulesW}mm) não bate com a largura total (${envW}mm).`);
      }

      // Populate complexity with a default value of 5 if not provided by the AI
      return {
        ...projectData,
        complexity: projectData.complexity || 5,
        projectId: projectData.projectId || `YARA-${Date.now()}`,
        status: projectData.validation?.isValid ? 'validated' : 'draft',
        render: { status: 'pending' },
        pricing: { status: 'pending' },
        cutPlan: { status: 'pending' }
      } as ProjectData;

    } catch (e: any) {
      const errorMsg = e.message || JSON.stringify(e);
      if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
        throw new Error("ERRO 403: Hardware Master bloqueado. Ative sua API KEY no painel de Engenharia.");
      }
      throw e;
    }
  }
};
