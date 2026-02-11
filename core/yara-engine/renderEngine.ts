
import { GoogleGenAI } from "@google/genai";
import { ProjectData } from '../../types';

export const RenderEngine = {
  /**
   * Gera renders fotorrealistas baseados no rascunho.
   * Prioriza a geometria do rascunho original.
   */
  generate: async (project: ProjectData, sketchData?: string): Promise<{ faithful: string, decorated: string }> => {
    // Criamos a instância aqui para garantir o uso da chave mais recente do ambiente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const materials = project.modules?.map(m => `${m.material} (${m.finish})`).join(", ") || "Madeira MDF";
    const modulesInfo = project.modules?.map(m => `${m.type} ${m.dimensions.w}x${m.dimensions.h}mm`).join(", ");

    const callModel = async (prompt: string, imageBase64?: string) => {
      const parts: any[] = [];
      
      // A imagem de referência (rascunho) é o âncora principal
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }
      
      parts.push({ text: prompt });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
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
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
        return '';
      } catch (err: any) {
        console.error("Render Engine Error:", err);
        throw err; // Propaga para tratamento de 403 no nível superior
      }
    };

    // Prompt 1: Fidelidade Técnica (Foco em proporção e material)
    const faithfulPrompt = `
      TECHNICAL 3D CAD RENDERING - HIGH FIDELITY.
      SUBJECT: Custom furniture from the attached sketch.
      ENGINEERING GOAL: Follow the EXACT geometric proportions, lines, and layout of the provided image. 
      DETAILS: ${modulesInfo}. Materials: ${materials}.
      LIGHTING: Balanced technical studio lighting, neutral background, sharp shadows to show depth.
      STYLE: Industrial design visualization, 8K resolution, photorealistic textures.
    `;

    // Prompt 2: Estética Architectural Digest (Foco em atmosfera e luxo)
    const decoratedPrompt = `
      ARCHITECTURAL DIGEST LUXURY INTERIOR PHOTOGRAPHY.
      FURNITURE: The custom piece from the sketch, fully finished in ${materials}.
      ATMOSPHERE: High-end contemporary residence, elegant styling.
      LIGHTING: Professional soft-diffused natural daylight from a large window. Cinematic depth of field.
      COMPOSITION: Architectural framing, 35mm lens look, magazine cover quality, 8K, sophisticated color palette.
      Keep the furniture's core design identical to the sketch.
    `;

    // Execução paralela para performance
    const [faithful, decorated] = await Promise.all([
      callModel(faithfulPrompt, sketchData),
      callModel(decoratedPrompt, sketchData)
    ]);

    return { faithful, decorated };
  }
};
