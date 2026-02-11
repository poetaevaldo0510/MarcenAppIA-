
import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audioData } = body;

    if (!API_KEY) throw new Error("Hardware Voice sem chave.");

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // 1. Entendimento do Áudio
    const transcriptionResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/webm;codecs=opus', data: audioData } },
          { text: "Extraia apenas os dados estruturais (medidas e módulos) deste comando. Seja conciso." }
        ]
      }
    });

    const transcript = transcriptionResponse.text || "comando não identificado";

    // 2. Geração de Voz Executiva (Kore + Personalidade Industrial)
    // Usamos SSML implícito através do prompt de estilo para a Gemini
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: `Responda com autoridade executiva, sem entusiasmo artificial: 'DNA Estrutural capturado para ${transcript}. Validando geometria para travamento industrial. Deseja prosseguir com o LOCK?'` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return NextResponse.json({
      success: true,
      transcript,
      audio: base64Audio
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
