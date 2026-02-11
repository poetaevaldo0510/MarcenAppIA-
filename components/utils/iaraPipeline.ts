// utils/iaraPipeline.ts
import { apiKey, MODEL_LOGIC, MODEL_RENDER, IARA_PROMPT, COPILOT_PROMPT } from "../config";

type DNAProjeto = any;
type Financeiro = any;

async function safeJsonParse(text: string): Promise<any | null> {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Função que chama a IARA para extrair DNA
export async function callIara(input: string, image?: string): Promise<DNAProjeto | null> {
  try {
    const payload: any = {
      contents: [{ parts: [{ text: `Input: ${input}` }, ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }] : [])] }],
      systemInstruction: { parts: [{ text: IARA_PROMPT }] },
      generationConfig: { responseMimeType: "application/json" }
    };
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_LOGIC}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    const aiData = safeJsonParse(data?.candidates?.[0]?.content?.parts?.[0]?.text);
    if (!aiData || !aiData.projeto) throw new Error("DNA inválido");
    return aiData;
  } catch (e) {
    console.error("IARA Error:", e);
    return null;
  }
}

// Função que chama o Copiloto para auditoria
export async function callCopilot(dna: DNAProjeto, financeiro: Financeiro): Promise<string> {
  try {
    const payload = {
      contents: [{ parts: [{ text: `AUDITE ESTE DNA: ${JSON.stringify(dna)}. FINANCEIRO: ${JSON.stringify(financeiro)}` }] }],
      systemInstruction: { parts: [{ text: COPILOT_PROMPT }] }
    };
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_LOGIC}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Auditoria concluída.";
  } catch (e) {
    console.error("Copiloto Error:", e);
    return "Falha na auditoria do Copiloto.";
  }
}

// Função que chama o render da IARA
export async function callRender(dna: DNAProjeto, image?: string, quick = false): Promise<string | null> {
  try {
    const promptText = quick ? 
      `Rascunho rápido do interior com base no JSON: ${JSON.stringify(dna)}` :
      `Render 4K fotorrealista do projeto com JSON: ${JSON.stringify(dna)} PBR`;
      
    const payload: any = {
      contents: [{ parts: [{ text: promptText }, ...(image ? [{ inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] } }] : [])] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    };
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_RENDER}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    const imgPart = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : null;
  } catch (e) {
    console.error("Render Error:", e);
    return null;
  }
}
