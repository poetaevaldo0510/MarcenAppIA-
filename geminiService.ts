
import { GoogleGenAI } from "@google/genai";
import { ProjectData, RenderStyle, PerspectiveAngle } from "./types";

export async function generateYARARender(
  project: ProjectData,
  instruction: string,
  style: RenderStyle = 'decorated',
  perspective: PerspectiveAngle = 'corner',
  base64Image?: string
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const realismDirectives = `
    INDUSTRIAL MASTER DIRECTIVES:
    1. AMBIENTE COMPLETO: Renderize o móvel em um cenário de alto padrão.
    2. ILUMINAÇÃO: Use perfis realistas e luz solar suave.
    3. TEXTURAS: O MDF ${project.externalMaterial} deve ser ultra-nítido.
    4. QUALIDADE: 4K UHD, profundidade cinematográfica.
    5. FIDELIDADE: Respeite ${project.doors} portas e ${project.drawers} gavetas conforme o DNA.
  `;

  const prompt = `YARA MATERIALIZATION: ${instruction}. ${realismDirectives}`;

  try {
    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
      parts.push({ inlineData: { data: base64Image, mimeType: 'image/png' } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (err: any) {
    if (err.message?.includes("permission") || err.message?.includes("key")) throw err;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Falha na materialização.");
}

export async function analyzeSketchForDNA(base64Image: string): Promise<Partial<ProjectData>> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise este rascunho de marcenaria. Extraia JSON: width (m), height (m), doors (un), drawers (un).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType: 'image/png' } }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return {}; }
}
