
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// A API KEY é obtida exclusivamente do ambiente seguro do servidor
const GEMINI_API_KEY = process.env.API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dna, version, seed_base, style } = body;

    if (!dna || !GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "DNA do projeto ou Chave API ausente." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // 🔒 Lógica de Seed Industrial: Consistência entre versões
    const finalSeed = (seed_base || 1000) + (version || 1);

    const modulesSummary = dna.modules?.map((m: any) => 
      `${m.type.toUpperCase()}: W=${m.dimensions.w}mm, H=${m.dimensions.h}mm, D=${m.dimensions.d}mm. Material=${m.material}.`
    ).join("\n");

    const prompt = `
      INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK].
      SEED_ID: ${finalSeed}
      
      Você é YARA INDUSTRIAL. Renderize EXATAMENTE conforme o DNA abaixo.
      Não altere proporções. Não invente elementos. Não mude o layout.
      Mantenha frestas técnicas de 3mm entre portas e gavetas.
      
      ESTRUTURA:
      - Ambiente: ${dna.environment.width}x${dna.environment.height}x${dna.environment.depth}mm.
      - Componentes:
      ${modulesSummary}
      
      CONDIÇÃO DE RENDER:
      Ultra realista, ArchViz profissional, PBR Textures.
      Estilo: ${style === 'faithful' ? 'Estúdio técnico, fundo neutro, luz difusa.' : 'Interior de luxo minimalista, iluminação natural de janela.'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        },
        seed: finalSeed,
        temperature: 0,
      }
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      return NextResponse.json({ error: "Falha ao gerar imagem." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      version: version || 1,
      seed: finalSeed,
      image: `data:image/png;base64,${base64Image}`
    });

  } catch (error: any) {
    console.error("Erro no Motor Yara:", error);
    return NextResponse.json({ error: "Erro interno no hardware de renderização." }, { status: 500 });
  }
}
