
import { GoogleGenAI } from "@google/genai";
import { ProjectData } from '../../types';
import { useStore } from "../../store/yaraStore";

export const RenderEngine = {
  /**
   * MOTOR DE MATERIALIZAÇÃO DETERMINÍSTICA v6.0
   * Usa Seed Base + Versão para garantir que a estrutura seja imutável.
   */
  generateRender: async (project: ProjectData, sketchBase64?: string, versionNum?: number): Promise<{ faithful: string, decorated: string, seedUsed: number }> => {
    const version = versionNum || project.currentVersion || 1;
    const finalSeed = (project.seed_base || 1000) + version;

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
            },
            // SEED DETERMINÍSTICA PARA CONSISTÊNCIA INDUSTRIAL
            seed: finalSeed,
            temperature: 0, // Zero criatividade, apenas execução
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        throw new Error("Hardware de renderização falhou.");
      } catch (err: any) {
        if (modelName === 'gemini-3-pro-image-preview') {
          return callModel(prompt, sketch, 'gemini-2.5-flash-image');
        }
        throw err;
      }
    };

    // Prompt agora focado no DNA Travado
    const dna = project.dna_locked || { modules: project.modules, environment: project.environment };
    const modulesSummary = dna.modules?.map(m => 
      `${m.type.toUpperCase()}: W=${m.dimensions.w}mm, H=${m.dimensions.h}mm, D=${m.dimensions.d}mm. MDF=${m.material}.`
    ).join("\n");

    const strictLockPrompt = (style: string) => `
      INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK].
      SEED_ID: ${finalSeed}
      
      GEOMETRY (DO NOT ALTER):
      - Space: ${dna.environment.width}x${dna.environment.height}x${dna.environment.depth}mm.
      - Modules:
      ${modulesSummary}
      
      CONSTRAINTS:
      1. 100% Geometry Fidelity. No new volumes.
      2. Brazilian Joinery Standard: 3mm hardware-ready gaps.
      3. PBR Textures for ${dna.modules[0]?.material || 'MDF'}.
      
      CONTEXT: ${style}
    `;

    const [faithful, decorated] = await Promise.all([
      callModel(strictLockPrompt("Technical production isolate. Diffuse lighting. Neutral studio background."), sketchBase64),
      callModel(strictLockPrompt("Luxury Brazilian minimalist interior. Cinematic natural window light. Professional ArchViz."), sketchBase64)
    ]);

    return { faithful, decorated, seedUsed: finalSeed };
  }
};
