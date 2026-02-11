
import { GoogleGenAI } from "@google/genai";
import { Attachment, ProjectData } from '../../types';
import { IARA_SYSTEM_PROMPT } from '../../constants';
import { useStore } from "../../store/yaraStore";

export const YaraEngine = {
  getAi: (providedKey?: string) => {
    const apiKey = providedKey || useStore.getState().manualApiKey || process.env.API_KEY;
    return new GoogleGenAI({ apiKey });
  },

  testConnection: async (keyToTest?: string): Promise<boolean> => {
    try {
      const ai = YaraEngine.getAi(keyToTest);
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ text: 'ping' }],
        config: { maxOutputTokens: 1 }
      });
      return true;
    } catch (e: any) {
      console.error("Key test failed:", e);
      return false;
    }
  },

  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    const ai = YaraEngine.getAi();
    const parts: any[] = [{ text: text || "Analise este rascunho tecnicamente." }];
    if (attachment?.data) parts.push({ inlineData: { mimeType: 'image/jpeg', data: attachment.data } });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: { systemInstruction: IARA_SYSTEM_PROMPT, responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "{}");
      const project = parsed.project || parsed;
      return {
        ...project,
        projectId: project.projectId || `P-${Date.now()}`,
        render: { status: 'pending' },
        pricing: { status: 'pending' },
        cutPlan: { status: 'pending' }
      } as ProjectData;
    } catch (e: any) {
      const errorMsg = e.message || JSON.stringify(e);
      if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
        throw new Error("PERMISSÃO NEGADA: O hardware base não tem autorização para este motor. Selecione uma Chave Master válida.");
      }
      throw e;
    }
  }
};
