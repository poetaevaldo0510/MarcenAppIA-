
import { GoogleGenAI } from "@google/genai";
import { ProjectData } from '../types';
import { useStore } from "../store/yaraStore";

export const RenderEngine = {
  /**
   * MODO FIDELIDADE EXTREMA (STRICT MODE)
   * Travamento de parâmetros para consistência industrial.
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
            },
            // Parâmetros de Fidelidade Máxima Absoluta
            // Nota: temperature no SDK de imagem atual é controlado via prompt rigoroso.
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

    const modulesSummary = project.modules?.map(m => 
      `${m.type.toUpperCase()}: W=${m.dimensions.w}mm, H=${m.dimensions.h}mm, D=${m.dimensions.d}mm. Material=${m.material}.`
    ).join("\n");

    const strictLockPrompt = (style: string) => `
      ARCHITECTURAL PHOTOGRAPHY RIGID PROTOCOL v6.0 [STRICT MODE].
      DNA LOCK IDENTIFIER: ${project.projectId}
      
      GEOMETRIC CONSTRAINTS (DO NOT ALTER):
      - Total Workspace: ${project.environment.width}x${project.environment.height}x${project.environment.depth}mm.
      - Component List:
      ${modulesSummary}
      
      FIRMWARE RULES:
      1. EXACT millimeter proportions mandatory. 
      2. 3mm consistent gaps for doors/drawers.
      3. ZERO artistic interpretation. Materialize ONLY the provided structure.
      4. MDF PBR Textures required.
      
      CAMERA SETTINGS:
      - Lens: 50mm Architectural Prime.
      - Perspective: Neutral Orthographic-style view.
      
      CONTEXT: ${style}
    `;

    const [faithful, decorated] = await Promise.all([
      callModel(strictLockPrompt("Technical production isolate. Studio soft lighting. Neutral grey background. Highlight construction details and edges."), sketchBase64),
      callModel(strictLockPrompt("Professional interior architecture photography. High-end Brazilian minimalist environment. Cinematic natural sunlight window light."), sketchBase64)
    ]);

    return { faithful, decorated };
  }
};
