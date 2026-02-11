
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

  // Teste de conexão para verificar a validade da chave API e faturamento ativo
  testConnection: async (apiKey?: string): Promise<boolean> => {
    try {
      const key = apiKey || useStore.getState().manualApiKey || process.env.API_KEY;
      if (!key) return false;
      
      const ai = new GoogleGenAI({ apiKey: key });
      // Realiza uma chamada de baixo custo para validar as credenciais
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
      });
      return true;
    } catch (e) {
      console.error("Connection test failed:", e);
      return false;
    }
  },

  suggestCorrection: (projectData: any): string | null => {
    const sumModulesW = projectData.modules?.reduce((acc: number, m: any) => acc + (m.dimensions?.w || 0), 0) || 0;
    const envW = projectData.environment?.width || 0;

    if (sumModulesW > envW && envW > 0) {
      const diff = sumModulesW - envW;
      const modules = [...(projectData.modules || [])].sort((a, b) => b.dimensions.w - a.dimensions.w);
      if (modules.length > 0) {
        const target = modules[0];
        const newW = Math.max(0, target.dimensions.w - diff);
        return `SUGESTÃO DE AJUSTE: Ocupação de ${sumModulesW}mm excede vão de ${envW}mm. Recomenda-se reduzir o módulo '${target.type}' para ${newW}mm.`;
      }
    }
    return null;
  },

  validateGeometry: (projectData: any): { isValid: boolean, alerts: string[] } => {
    const alerts: string[] = [];
    const sumModulesW = projectData.modules?.reduce((acc: number, m: any) => acc + (m.dimensions?.w || 0), 0) || 0;
    const envW = projectData.environment?.width || 0;
    const envH = projectData.environment?.height || 0;

    // 1. Verificação de Dimensões Mínimas e Máximas Industriais
    if (!envW || envW < 150) alerts.push("BLOQUEIO: Vão de largura insuficiente para fabricação.");
    if (!envH || envH < 150) alerts.push("BLOQUEIO: Pé-direito incompatível com padrões de mobiliário.");
    
    // 2. Validação de Espessura de MDF (Padrões Industriais: 6, 9, 12, 15, 18, 25, 30)
    const validThicknesses = [6, 9, 12, 15, 18, 25, 30];
    projectData.modules?.forEach((m: any) => {
      if (m.thickness && !validThicknesses.includes(m.thickness)) {
        alerts.push(`ALERTA: Espessura de ${m.thickness}mm no módulo '${m.type}' não é padrão comercial.`);
      }
    });

    // 3. Verificação Rigorosa de Proporção Estrutural
    if (envW > 0 && envH > 0) {
      const ratio = envW / envH;
      // Se a largura for 6x maior que a altura sem divisórias ou apoios claros
      if (ratio > 6) alerts.push("ALERTA: Proporção horizontal instável. Risco de flambagem estrutural.");
      if (ratio < 0.1) alerts.push("ALERTA: Proporção vertical instável (torre excessivamente estreita).");
    }

    // 4. Verificação de Ocupação do Vão
    if (envW > 0 && sumModulesW > envW) {
      alerts.push(`CONFLITO: Soma das larguras dos módulos (${sumModulesW}mm) maior que o vão disponível (${envW}mm).`);
    }

    return {
      isValid: alerts.filter(a => a.startsWith("BLOQUEIO") || a.startsWith("CONFLITO")).length === 0,
      alerts
    };
  },

  processInput: async (text: string, attachment?: Attachment): Promise<ProjectData | null> => {
    try {
      const ai = YaraEngine.getAi();
      const parts: any[] = [{ text: text || "Extraia o DNA técnico deste pedido de marcenaria." }];
      
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

      let parsed = JSON.parse(response.text || "{}");
      let projectData = parsed.project || parsed;
      
      const validation = YaraEngine.validateGeometry(projectData);
      
      // Integrar sugestão de correção caso a geometria seja inválida
      const correction = YaraEngine.suggestCorrection(projectData);
      if (correction && !validation.isValid) {
        validation.alerts.push(correction);
      }

      return {
        ...projectData,
        complexity: projectData.complexity || 5,
        projectId: projectData.projectId || `YARA-${Date.now()}`,
        status: validation.isValid ? 'validated' : 'draft',
        validation: {
          isValid: validation.isValid,
          alerts: validation.alerts,
          coherenceScore: validation.isValid ? 100 : 40
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
