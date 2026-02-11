
import { GoogleGenAI } from "@google/genai";
import { ProjectData } from '../../types';
import { useStore } from "../../store/yaraStore";

export const RenderEngine = {
  /**
   * MOTOR DE MATERIALIZAÇÃO PURISTA v5.3 (DNA LOCKED)
   * Foco: Fidelidade Máxima Absoluta e Consistência entre Renders.
   */
  generateRender: async (project: ProjectData, sketchBase64?: string): Promise<{ faithful: string, decorated: string }> => {
    const callModel = async (prompt: string, sketch?: string, modelName: string = 'gemini-3-pro-image-preview') => {
      const apiKey = useStore.getState().manualApiKey || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const parts: any[] = [];
      if (sketch) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: sketch.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }
      parts.push({ text: prompt });

      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        throw new Error("O hardware de renderização não devolveu uma imagem válida.");
      } catch (err: any) {
        // Fallback para flash se o pro falhar por qualquer motivo (quota, etc)
        if (modelName === 'gemini-3-pro-image-preview') {
          return callModel(prompt, sketch, 'gemini-2.5-flash-image');
        }
        throw err;
      }
    };

    const modulesSummary = project.modules?.map(m => 
      `- ${m.type.toUpperCase()}: L=${m.dimensions.w}mm, A=${m.dimensions.h}mm, P=${m.dimensions.d}mm. MDF: ${m.material}.`
    ).join("\n");

    // PROTOCOLO DE BLINDAGEM VISUAL: Zero criatividade, apenas materialização técnica.
    const strictLockPrompt = (style: string) => `
      INDUSTRIAL ARCHITECTURAL RENDER - PROTOCOLO DNA LOCK v5.3.
      
      DADOS TÉCNICOS OBRIGATÓRIOS:
      - Largura Total: ${project.environment.width}mm.
      - Altura Total: ${project.environment.height}mm.
      - Profundidade Total: ${project.environment.depth}mm.
      - Estrutura de Módulos:
      ${modulesSummary}
      
      CONDIÇÕES DE FIDELIDADE (STRICT MODE):
      - NÃO REDESENHE. Mantenha as proporções milimétricas exatas do DNA.
      - NÃO adicione ornamentos ou volumes não descritos.
      - Iluminação: Neutra de estúdio, difusa.
      - Lente: 50mm (sem distorção de perspectiva).
      - Acabamento: Texturas reais de MDF conforme descrição.
      - Detalhes de Marcenaria: Frestas de 3mm entre frentes de gavetas e portas.
      
      CONTEXTO VISUAL: ${style}
    `;

    const [faithful, decorated] = await Promise.all([
      callModel(strictLockPrompt("Render de Produção Industrial. Fundo neutro e isolado. Foco em detalhes de montagem e ferragens."), sketchBase64),
      callModel(strictLockPrompt("Render de Arquitetura em Ambiente Real. Estilo minimalista, luz natural suave vindo de janela lateral. Sem alterar a geometria do móvel."), sketchBase64)
    ]);

    return { faithful, decorated };
  }
};
