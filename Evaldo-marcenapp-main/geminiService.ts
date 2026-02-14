
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectData, RenderStyle, PerspectiveAngle, Part } from "./types";

/**
 * YARA CORE ENGINE v5.1: Blindagem de Memória e Fotorrealismo.
 */
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
    1. AMBIENTE COMPLETO: Renderize o móvel em um cenário de alto padrão (cozinha gourmet ou closet luxo).
    2. ILUMINAÇÃO: Use IES profiles e luz solar suave fotorrealista.
    3. TEXTURAS: O MDF ${project.externalMaterial} deve ser ultra-nítido, com veios tangíveis.
    4. QUALIDADE: 4K UHD, profundidade de campo cinematográfica.
    5. FIDELIDADE: Respeite ${project.doors} portas e ${project.drawers} gavetas conforme o DNA do projeto.
  `;

  const prompt = `YARA MATERIALIZATION: ${instruction}. ${realismDirectives}`;

  try {
    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
      parts.push({
        inlineData: { data: base64Image, mimeType: 'image/png' }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { 
        imageConfig: { 
          aspectRatio: "16:9",
          imageSize: "1K" 
        } 
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Se chegou aqui e não tem imagem, mas tem texto, tenta usar o texto
    if (response.text) {
      console.warn("IA retornou apenas texto, tentando fallback...");
    }

  } catch (err: any) {
    console.error("Erro no motor Pro:", err);
    
    // Erro de permissão: Repassa para a UI abrir o seletor de chave
    if (err.message?.includes("permission") || err.message?.includes("key")) {
       throw err; 
    }

    // Fallback silencioso para motor Flash Image (Standard)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  }
  throw new Error("Falha na materialização da YARA. Verifique a imagem ou conexão.");
}

/**
 * Analisa rascunhos para extrair medidas técnicas.
 */
export async function analyzeSketchForDNA(base64Image: string): Promise<Partial<ProjectData>> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise este rascunho de marcenaria. Extraia um JSON estrito: width (largura metros), height (altura metros), doors (número portas), drawers (número gavetas).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType: 'image/png' } }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return {}; }
}

export async function analyzeCuttingEfficiency(parts: Part[], sheet: { w: number, h: number }): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise este plano de corte industrial para chapa ${sheet.w}x${sheet.h}mm. Dê uma dica técnica de aproveitamento em português.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Otimize o alinhamento dos veios.";
  } catch (e) { return "Otimize o alinhamento dos veios."; }
}

export async function generateLegalClause(riskDescription: string): Promise<{ text: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Gere uma cláusula contratual blindada para o risco: ${riskDescription}.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return { text: response.text || "Cláusula padrão de garantia técnica." };
  } catch (e) { return { text: "Cláusula padrão de garantia técnica." }; }
}

export async function findNearbySuppliers(lat: number, lng: number): Promise<{ text: string, links: any[] | undefined }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Lojas de marcenaria e MDF perto de mim.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleMaps: {} }], toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } } },
    });
    return { text: response.text || "", links: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
  } catch (e) { throw e; }
}

export async function generateTechnicalDrawing(project: ProjectData): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Gere SVG de desenho técnico para móvel ${project.width}x${project.height}m.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || '<svg></svg>';
  } catch (e) { return '<svg></svg>'; }
}

export async function getFiscalAdvice(project: ProjectData) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Impostos e NCM para móvel planejado MDF.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { ncm: "9403.60.00", taxRate: 6, advice: "Consultar contador." }; }
}

export async function analyzeRoomForLayout(base64Image: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Sugira o melhor layout para marcenaria nesta foto de ambiente. Retorne JSON: suggestedLayout (texto).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType: 'image/png' } }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return {}; }
}

export async function elevateFloorPlan(base64Image: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Extraia dimensões técnicas desta planta baixa.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType: 'image/png' } }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return {}; }
}
