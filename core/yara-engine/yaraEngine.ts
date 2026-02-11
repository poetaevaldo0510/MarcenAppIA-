
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

  /**
   * TESTE DE CONEXÃO (PROTOCOLO DE SEGURANÇA)
   * Verifica se a chave API é válida e possui faturamento ativo.
   */
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
   * VALIDAÇÃO MATEMÁTICA RÍGIDA (PROTOCOLO A - BACKEND)
   * Garante que a IA não invente medidas ou ignore erros de projeto.
   */
  validateGeometry: (projectData: any): { isValid: boolean, alerts: string[] } => {
    const alerts: string[] = [];
    const sumModulesW = projectData.modules?.reduce((acc: number, m: any) => acc + (m.dimensions?.w || 0), 0) || 0;
    const envW = projectData.environment?.width || 0;
    const envH = projectData.environment?.height || 0;

    // 1. Verificação de Dados Básicos
    if (!envW || !envH) alerts.push("ERRO: Medidas do ambiente (Largura/Altura) não informadas.");
    if (!projectData.modules || projectData.modules.length === 0) alerts.push("ERRO: Nenhum módulo identificado no projeto.");

    // 2. Coerência Matemática (Protocolo de Bloqueio)
    if (envW > 0 && sumModulesW > 0) {
      if (sumModulesW > envW) {
        alerts.push(`INCONSISTÊNCIA: Soma dos módulos (${sumModulesW}mm) excede largura do ambiente (${envW}mm).`);
      } else if (Math.abs(sumModulesW - envW) > 1) {
         // Se for menor, avisar mas permitir se houver fechamentos planejados (opcional)
         alerts.push(`AVISO: Folga técnica detectada de ${envW - sumModulesW}mm.`);
      }
    }

    // 3. Verificação de Medidas Individuais (Sanidade Industrial)
    projectData.modules?.forEach((m: any, i: number) => {
      if (m.dimensions.w < 100) alerts.push(`Módulo ${i+1}: Largura muito baixa (${m.dimensions.w}mm).`);
      if (m.dimensions.d > 800) alerts.push(`Módulo ${i+1}: Profundidade excessiva (${m.dimensions.d}mm).`);
    });

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
      
      // Validação Matemática de Backend (Protocolo A)
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
