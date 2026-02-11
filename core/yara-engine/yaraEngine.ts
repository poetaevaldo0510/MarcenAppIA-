
import { GoogleGenAI } from "@google/genai";
import { Attachment, ProjectData } from '../../types';
import { IARA_SYSTEM_PROMPT } from '../../constants';

export const YaraEngine = {
  getAi: () => new GoogleGenAI({ apiKey: process.env.API_KEY }),

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
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
