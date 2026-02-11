import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

const API_KEY = process.env.API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dna, version, seed_base, style, userId, projectId } = body;

    if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Configuração de hardware incompleta (Env Vars)." }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. VALIDAÇÃO E CONSUMO DE CRÉDITOS NO BACKEND
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || (user?.credits || 0) < 5) {
      return NextResponse.json({ error: "Saldo de créditos insuficiente para renderização industrial." }, { status: 402 });
    }

    // 2. GERAÇÃO DETERMINÍSTICA (GEMINI 3 PRO)
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const finalSeed = (seed_base || 1000) + (version || 1);
    const modulesSummary = dna.modules?.map((m: any) => 
      `${m.type.toUpperCase()}: ${m.dimensions.w}x${m.dimensions.h}x${m.dimensions.d}mm. ${m.material}.`
    ).join("\n");

    const prompt = `
      INDUSTRIAL ARCHVIZ PROTOCOL v6.0 [STRICT DNA LOCK].
      SEED_ID: ${finalSeed}
      Renderize exatamente:
      Ambiente: ${dna.environment.width}x${dna.environment.height}mm.
      Módulos:
      ${modulesSummary}
      Estilo: ${style === 'faithful' ? 'Estúdio técnico, fundo neutro.' : 'Interior de luxo minimalista.'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
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

    if (!base64Image) throw new Error("Falha no hardware de imagem.");

    // 3. STORAGE NO SUPABASE
    const fileName = `${projectId}/v${version}_${style}_${Date.now()}.png`;
    
    // Fix for: Cannot find name 'Buffer'. Using atob to convert base64 to Uint8Array.
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('renders')
      .upload(fileName, bytes, { contentType: 'image/png' });

    if (storageError) throw new Error("Falha ao salvar no storage industrial.");

    const { data: { publicUrl } } = supabase.storage.from('renders').getPublicUrl(fileName);

    // 4. ATUALIZAR DB E DEDUZIR CRÉDITOS
    await supabase.from('users').update({ credits: user.credits - 5 }).eq('id', userId);
    await supabase.from('credits_log').insert({ user_id: userId, amount: -5, description: `Render v${version} - ${style}` });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      seed: finalSeed
    });

  } catch (error: any) {
    console.error("API RENDER ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}