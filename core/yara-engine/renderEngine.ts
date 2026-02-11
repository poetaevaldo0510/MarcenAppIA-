
import { GoogleGenAI } from "@google/genai";
import { ProjectData } from '../../types';
import { useStore } from "../../store/yaraStore";

export const RenderEngine = {
  /**
   * RECONSTRUTOR GEOMÉTRICO 8K.
   * Utiliza o rascunho como âncora de proporção e o motor Pro para renderização.
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
        throw new Error("Motor falhou ao processar imagem.");
      } catch (err: any) {
        const errorMsg = err.message || JSON.stringify(err);
        // Fallback automático para evitar 403 em ambientes limitados
        if (modelName === 'gemini-3-pro-image-preview' && (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("429"))) {
          console.warn("Recorrendo ao motor Flash por restrição de acesso Pro.");
          return callModel(prompt, sketch, 'gemini-2.5-flash-image');
        }
        throw err;
      }
    };

    const modulesDesc = project.modules?.map(m => `${m.type} (${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm)`).join(", ");

    const faithfulPrompt = `
      TASK: SCIENTIFIC RECONSTRUCTION.
      REFERENCE: Attached sketch is the ABSOLUTE layout.
      SUBJECT: Professional furniture rendering of "${project.title}".
      MODULES: ${modulesDesc}.
      STYLE: Clean industrial product photography. 
      LIGHTING: Balanced studio lighting, white high-key background.
      DETAIL: Show wood grain textures and metallic hardware precisely as specified. 
      FIDELITY: Match all proportions from the sketch exactly.
    `;

    const decoratedPrompt = `
      TASK: ARCHITECTURAL DIGEST INTERIOR PHOTOGRAPHY.
      SUBJECT: The centerpiece is the furniture from the sketch.
      ENVIRONMENT: Luxury modern high-end penthouse during sunset.
      LIGHTING: Diffused side-window sunlight (Golden Hour). Warm soft highlights, long cinematic shadows.
      COMPOSITION: Straight vertical lines, wide angle, perfect architectural symmetry.
      ATMOSPHERE: Sophisticated, quiet luxury, extremely detailed wood and stone textures.
      QUALITY: 8K Photorealistic, shallow depth of field.
    `;

    // Disparo assíncrono paralelo para não travar a thread de UI
    const [faithful, decorated] = await Promise.all([
      callModel(faithfulPrompt, sketchBase64),
      callModel(decoratedPrompt, sketchBase64)
    ]);

    return { faithful, decorated };
  }
};
