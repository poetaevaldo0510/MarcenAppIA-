
import { GoogleGenAI } from "@google/genai";
import { Attachment, ProjectData } from '../../types';
import { IARA_SYSTEM_PROMPT } from '../../constants';
import { useStore } from "../../store/yaraStore";

export const YaraEngine = {
  getAi: () => {
    const apiKey = useStore.getState().manualApiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("Chave API Master não configurada no hardware.");
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
      const parts: any[] = [{ text: text || "Realize o escaneamento técnico do rascunho/descrição e gere o DNA estrutural." }];
      
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

      let parsed;
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch (parseErr) {
        throw new Error("Falha ao processar resposta técnica da Yara. O DNA retornado está corrompido.");
      }

      const projectData = parsed.project || parsed;
      
      // VALIDAÇÃO TÉCNICA (Camada de Hardware)
      const sumModulesW = projectData.modules?.reduce((acc: number, m: any) => acc + (m.dimensions?.w || 0), 0) || 0;
      const envW = projectData.environment?.width || 0;
      const alerts: string[] = projectData.validation?.alerts || [];
      
      if (envW > 0 && Math.abs(sumModulesW - envW) > 5) {
        projectData.validation.isValid = false;
        alerts.push(`CONFLITO DE MEDIDAS: Soma dos módulos (${sumModulesW}mm) ≠ Largura Total (${envW}mm). Ajuste necessário.`);
      }

      if (!projectData.modules || projectData.modules.length === 0) {
        projectData.validation.isValid = false;
        alerts.push("DNA VAZIO: Nenhum módulo estrutural foi identificado no rascunho.");
      }

      return {
        ...projectData,
        complexity: projectData.complexity || 5,
        projectId: projectData.projectId || `YARA-LOCKED-${Date.now()}`,
        status: 'draft', // Mantém em draft até o LOCK do usuário
        validation: {
          ...projectData.validation,
          alerts,
          isValid: alerts.length === 0 && projectData.validation?.isValid !== false
        },
        render: { status: 'pending' },
        currentVersion: 0,
        renderHistory: []
      } as ProjectData;

    } catch (e: any) {
      const errorMsg = e.message || JSON.stringify(e);
      if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
        throw new Error("ERRO 403: Acesso ao hardware de IA bloqueado. Verifique o faturamento da sua API Key.");
      }
      throw new Error(`FALHA NO ESCANEAMENTO: ${errorMsg}`);
    }
  }
};
