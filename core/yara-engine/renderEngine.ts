
import { GoogleGenAI } from "@google/genai";
import { ProjectData } from '../../types';
import { useStore } from "../../store/yaraStore";

export const RenderEngine = {
  /**
   * RECONSTRUTOR DE ALTA FIDELIDADE v3.85.
   * Utiliza o rascunho como âncora geométrica primária.
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
        throw new Error("O hardware não retornou dados de imagem.");
      } catch (err: any) {
        const errorMsg = err.message || JSON.stringify(err);
        
        // Fallback automático para Gemini 2.5 Flash se Pro falhar por billing/quota
        if (modelName === 'gemini-3-pro-image-preview' && (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("429"))) {
          console.warn("Restrição de acesso no motor Pro. Tentando Fallback Flash...");
          return callModel(prompt, sketch, 'gemini-2.5-flash-image');
        }
        throw err;
      }
    };

    const modulesDesc = project.modules?.map(m => `${m.type} em ${m.material} (${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm)`).join(", ");

    const faithfulPrompt = `
      TECHNICAL 3D RECONSTRUCTION.
      FIDELITY: Use the attached sketch as the absolute reference for geometry, proportions, and layout. 
      SUBJECT: Professional furniture prototype of "${project.title}".
      MODULES: ${modulesDesc}.
      STYLE: Clean industrial product photography. 
      LIGHTING: Balanced high-key studio lighting, neutral light-gray seamless background.
      DETAIL: Sharp focus on joinery, wood grain textures, and specified materials. No decoration.
    `;

    const decoratedPrompt = `
      ARCHITECTURAL DIGEST STYLE INTERIOR.
      CENTERPIECE: The object from the sketch is the main architectural element.
      ENVIRONMENT: Integrate the object into a luxury modern minimalist penthouse interior.
      LIGHTING: Professional "Golden Hour" diffused sunlight coming from a side window. Warm highlights and long, soft cinematic shadows.
      COMPOSITION: Symmetrical architectural photography, wide angle, straight vertical lines.
      ATMOSPHERE: Sophisticated, quiet luxury, extremely detailed premium materials (matte wood, brushed metal).
      QUALITY: 8K Photorealistic, subtle depth of field.
    `;

    // Processamento assíncrono paralelo para performance máxima
    const [faithful, decorated] = await Promise.all([
      callModel(faithfulPrompt, sketchBase64),
      callModel(decoratedPrompt, sketchBase64)
    ]);

    return { faithful, decorated };
  }
};
