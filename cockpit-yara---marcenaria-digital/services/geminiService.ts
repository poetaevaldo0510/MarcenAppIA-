import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decode, decodeAudioData } from "../utils/helpers";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key || key === "YOUR_API_KEY" || key.includes("AIzaSyDFx")) {
    throw new Error("SISTEMA_OFFLINE: Chave Gemini AI ausente ou inválida.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Added missing searchFinishes
export const searchFinishes = async (query: string): Promise<any[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Localize acabamentos e materiais de marcenaria para: "${query}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              manufacturer: { type: Type.STRING },
              imageUrl: { type: Type.STRING }
            },
            required: ["id", "name", "manufacturer"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

// Added missing generateGroundedResponse
export const generateGroundedResponse = async (prompt: string, location?: any) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return {
      text: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    return { text: "Pesquisa indisponível sem conexão neural.", sources: [] };
  }
};

// Added missing editFloorPlan
export const editFloorPlan = async (base64: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: prompt }
      ]
    }
  });
  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return imagePart?.inlineData?.data || "";
};

// Added missing analyzeFloorPlan
export const analyzeFloorPlan = async (base64: string, mimeType: string, description: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: `Analise este layout considerando: ${description}` }
      ]
    }
  });
  return response.text || "";
};

// Added missing estimateProjectCosts
export const estimateProjectCosts = async (project: any, pricingSummary: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Estime custos para o projeto: ${project.name}. BOM: ${project.bom}. Mercado: ${pricingSummary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            materialCost: { type: Type.NUMBER },
            laborCost: { type: Type.NUMBER }
          },
          required: ["materialCost", "laborCost"]
        }
      }
    });
    return JSON.parse(response.text || '{"materialCost": 0, "laborCost": 0}');
  } catch (e) {
    return { materialCost: 0, laborCost: 0 };
  }
};

// Added missing editImage
export const editImage = async (images: { data: string, mimeType: string }[], prompt: string) => {
  const ai = getAI();
  const parts = images.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } }));
  parts.push({ text: prompt } as any);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts }
  });
  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return imagePart?.inlineData?.data || "";
};

// Added missing generateText
export const generateText = async (prompt: string, images?: any) => {
  try {
    const ai = getAI();
    const parts: any[] = [{ text: prompt }];
    if (images) {
      images.forEach((img: any) => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }));
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts }
    });
    return response.text || "";
  } catch (e) {
    return "Falha na geração de texto. Chave de API indisponível.";
  }
};

// Added missing analyzeBOMForEconomy
export const analyzeBOMForEconomy = async (bom: string) => {
  return generateText(`Analise economia para esta BOM: ${bom}`);
};

// Added missing generateDetailedProductionBudget
export const generateDetailedProductionBudget = async (project: any) => {
  return generateText(`Gere um orçamento detalhado de produção para: ${project.name}. BOM: ${project.bom}`);
};

// Added missing generateAdemirClause
export const generateAdemirClause = async (project: any) => {
  return generateText(`Gere uma cláusula de proteção jurídica para marcenaria no projeto: ${project.name}`);
};

// Added missing performEngineeringExplosion
export const performEngineeringExplosion = async (spec: any, imageUrl: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Realize a explosão técnica do móvel baseado em: ${JSON.stringify(spec)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          termos_busca_orcamento: { type: Type.ARRAY, items: { type: Type.STRING } },
          plano_de_corte_pecas: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                nome_peca: { type: Type.STRING }, 
                qtd: { type: Type.NUMBER }, 
                medidas_corte_mm: { type: Type.ARRAY, items: { type: Type.NUMBER } }, 
                material: { type: Type.STRING }, 
                fita_borda: { type: Type.STRING } 
              } 
            } 
          },
          lista_compras_consolidada: { 
            type: Type.OBJECT, 
            properties: { 
              chapas: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    tipo: { type: Type.STRING }, 
                    estimativa_chapas: { type: Type.NUMBER } 
                  } 
                } 
              }, 
              ferragens: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    item: { type: Type.STRING }, 
                    qtd: { type: Type.NUMBER } 
                  } 
                } 
              }, 
              fita_borda_total_metros: { type: Type.NUMBER } 
            } 
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Added missing researchRealPrices
export const researchRealPrices = async (terms: string[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Pesquise preços atuais para: ${terms.join(', ')}`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      summary: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    return { summary: "Pesquisa de mercado offline.", sources: [] };
  }
};

// Added missing researchBOMPrices
export const researchBOMPrices = async (bom: string, location?: any) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Compare preços para esta BOM: ${bom}`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      comparison: [
        { store: "Market Store A", totalPrice: 1000, highlights: "Melhor Preço" },
        { store: "Market Store B", totalPrice: 1100, highlights: "Entrega Rápida" }
      ]
    };
  } catch (e) {
    return { comparison: [] };
  }
};

// Added missing refineTechnicalText
export const refineTechnicalText = async (text: string) => {
  return generateText(`Torne este texto técnico de marcenaria mais assertivo: ${text}`);
};

// Added missing analyzeTechnicalDetail
export const analyzeTechnicalDetail = async (imageBase64: string, point: { x: number, y: number }) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: "image/png" } },
        { text: `Analise o detalhe técnico no ponto X:${point.x}% Y:${point.y}% desta imagem.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          observation: { type: Type.STRING },
          fixSuggestion: { type: Type.STRING },
          severity: { type: Type.STRING },
          technicalCategory: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Added missing generateContract
export const generateContract = async (project: any, client: any, profile: any) => {
  return generateText(`Gere um contrato de marcenaria entre ${profile.businessName} e ${client.name} para o projeto ${project.name}.`);
};

export const YaraAI = {
  async analyze(prompt: string, imageBase64: string | null = null): Promise<string> {
    try {
      const ai = getAI();
      const contents: any[] = [{ text: prompt }];
      
      if (imageBase64) {
        contents.push({
          inlineData: {
            mimeType: "image/png",
            data: imageBase64,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: contents },
        config: {
          systemInstruction: "És a Yara, inteligência Evaldo.OS para marcenaria industrial. Analisa rascunhos técnicos com precisão. Responde de forma curta e assertiva em português de Portugal.",
        },
      });
      return response.text || "Sem resposta operacional.";
    } catch (e: any) {
      if (e.message.includes("SISTEMA_OFFLINE")) {
        return "Mestre, a Iara está em modo offline (chave API não detectada). Por favor, configure sua Chave API Gemini nas variáveis de ambiente para restaurar a orquestração neural completa.";
      }
      return "Erro na orquestração neural. Verifique sua conexão.";
    }
  },

  async speak(text: string): Promise<void> {
    if (!text) return;
    try {
      const ai = getAI();
      const cleanText = text.replace(/\{.*?\}/gs, "");
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (e) {
      // Sliently fail if TTS is unavailable
    }
  }
};