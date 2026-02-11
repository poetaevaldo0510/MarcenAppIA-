
import { GoogleGenAI } from "@google/genai";
import { Attachment, ProjectData, Module } from '../../types';
import { IARA_SYSTEM_PROMPT } from '../../constants';
import { useStore } from "../../store/yaraStore";

export const YaraEngine = {
  getAi: () => {
    const apiKey = useStore.getState().manualApiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("Chave API ausente no hardware.");
    return new GoogleGenAI({ apiKey });
  },

  testConnection: async (apiKey?: string): Promise<boolean> => {
    try {
      const key = apiKey || useStore.getState().manualApiKey || process.env.API_KEY;
      if (!key) return false;
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
      });
      return !!response.text;
    } catch (e) {
      console.error("YARA ENGINE: Erro de conexão", e);
      return false;
    }
  },

  /**
   * PROTOCOLO B: MOTOR DE CORREÇÃO AUTOMÁTICA
   * Se a geometria falhar, Yara sugere o ajuste técnico.
   */
  suggestCorrection: (projectData: any): string | null => {
    const sumModulesW = projectData.modules?.reduce((acc: number, m: any) => acc + (m.dimensions?.w || 0), 0) || 0;
    const envW = projectData.environment?.width || 0;

    if (sumModulesW > envW && envW > 0) {
      const diff = sumModulesW - envW;
      // Busca o maior módulo para sugerir redução
      const modules = [...(projectData.modules || [])].sort((a, b) => b.dimensions.w - a.dimensions.w);
      if (modules.length > 0) {
        const target = modules[0];
        const newW = target.dimensions.w - diff;
        return `SUGESTÃO YARA: Reduzir módulo '${target.type}' de ${target.dimensions.w}mm para ${newW}mm para respeitar a largura de ${envW}mm.`;
      }
    }
    return null;
  },

  validateGeometry: (projectData: any): { isValid: boolean, alerts: string[] } => {
    const alerts: string[] = [];
    const sumModulesW = projectData.modules?.reduce((acc: number, m: any) => acc + (m.dimensions?.w || 0), 0) || 0;
    const envW = projectData.environment?.width || 0;
    const envH = projectData.environment?.height || 0;

    if (!envW || !envH) alerts.push("ERRO: Medidas do ambiente não informadas.");
    if (!projectData.modules || projectData.modules.length === 0) alerts.push("ERRO: Nenhum módulo identificado.");

    if (envW > 0 && sumModulesW > 0) {
      if (sumModulesW > envW) {
        alerts.push(`INCONSISTÊNCIA: Soma (${sumModulesW}mm) > Ambiente (${envW}mm).`);
      }
    }

    return {
      isValid: alerts.filter(a => a.startsWith("ERRO") || a.startsWith("INCONSISTÊNCIA")).length === 0,
      alerts
    };
  },

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
      const validation = YaraEngine.validateGeometry(projectData);

      return {
        ...projectData,
        complexity: projectData.complexity || 5,
        projectId: projectData.projectId || `YARA-${Date.now()}`,
        status: validation.isValid ? 'validated' : 'draft',
        validation: {
          isValid: validation.isValid,
          alerts: validation.alerts,
          coherenceScore: validation.isValid ? 100 : 0
        },
        render: { status: 'pending' },
        pricing: { status: 'pending' },
        cutPlan: { status: 'pending' }
      } as ProjectData;
    } catch (e: any) {
      throw e;
    }
  }
};
