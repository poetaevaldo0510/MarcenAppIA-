
import { GoogleGenAI } from "@google/genai";
import { ProjectData } from '../../types';

export const RenderEngine = {
  /**
   * YaraEngine.generateRender
   * Motor de materialização visual fotorrealista.
   * Prioriza a geometria do rascunho e aplica estética Architectural Digest.
   */
  generateRender: async (project: ProjectData, sketchBase64?: string): Promise<{ faithful: string, decorated: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const materials = project.modules?.map(m => `${m.material} (${m.finish})`).join(", ") || "MDF Premium";
    const technicalDescription = project.modules?.map(m => `${m.type} (${m.dimensions.w}x${m.dimensions.h}mm)`).join(", ");

    const callModel = async (prompt: string, sketch?: string) => {
      const parts: any[] = [];
      
      // A imagem de rascunho é injetada como a primeira parte para servir de âncora visual (Image-to-Image)
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
        throw new Error("Yara Hardware: Falha ao capturar buffer de imagem.");
      } catch (err) {
        console.error("Render Engine Error:", err);
        throw err;
      }
    };

    // PROMPT 1: Fidelidade Geométrica e de Proporção
    const faithfulPrompt = `
      ACT AS A MASTER CABINET MAKER AND 3D ARTIST.
      TASK: PHOTOREALISTIC 3D RECONSTRUCTION.
      SOURCE: Follow the EXACT perspective, lines, and proportions of the provided sketch. 
      PROJECT: ${project.title}. 
      SPECS: ${technicalDescription}. 
      MATERIALS: ${materials}.
      LIGHTING: High-key studio setup, clean shadows, neutral background. 
      GOAL: A technical render that looks exactly like the sketch but in real-life materials.
    `;

    // PROMPT 2: Composição AD Style (Architectural Digest)
    const decoratedPrompt = `
      ACT AS AN ARCHITECTURAL PHOTOGRAPHER FOR ARCHITECTURAL DIGEST.
      TASK: LUXURY INTERIOR RENDERING.
      FURNITURE: Use the exact modular design from the sketch.
      STYLE: Contemporary luxury, high-end finishing.
      LIGHTING: Architectural Digest signature lighting. Soft global illumination, natural morning sun entering through a side window, warm ambient interior highlights.
      ENVIRONMENT: A curated modern living space with premium textures (marble, oak flooring).
      COMPOSITION: Professional wide-angle framing (24mm style), balanced rule of thirds, cinematic depth of field.
    `;

    // Execução assíncrona paralela: Não bloqueia a UI e processa ambos simultaneamente
    const [faithful, decorated] = await Promise.all([
      callModel(faithfulPrompt, sketchBase64),
      callModel(decoratedPrompt, sketchBase64)
    ]);

    return { faithful, decorated };
  }
};
