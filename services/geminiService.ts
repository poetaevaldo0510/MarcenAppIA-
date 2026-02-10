import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import type { Part } from "@google/genai";
import type { Finish, ProjectHistoryItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function fileToGenerativePart(base64Data: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

async function callApiWithRetry<T extends () => Promise<GenerateContentResponse>>(
  apiCall: T,
  maxRetries: number = 3
): Promise<GenerateContentResponse> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("API call failed after multiple retries.");
}


export async function generateImage(prompt: string, base64Images: { data: string; mimeType: string }[] | null): Promise<string> {
    const parts: Part[] = [{ text: prompt }];
    if (base64Images) {
        for (const img of base64Images) {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        }
    }

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
            systemInstruction: `Atue como um diretor de arte especialista em renderização 3D para marcenaria de luxo, aprendendo e se adaptando a cada projeto. Seu objetivo é criar imagens fotorrealistas com qualidade de catálogo de design.

**PRINCÍPIOS TÉCNICOS OBRIGATÓRIOS:**
- **Iluminação e Sombra:** Modele a luz de forma realista, criando profundidade e volume. As sombras devem ser suaves e precisas, e os reflexos devem interagir de forma crível com as superfícies.
- **Materiais:** A representação dos materiais deve ser tátil. A madeira precisa ter veios visíveis, o metal deve refletir o ambiente, e as pedras devem parecer sólidas e naturais. A textura é fundamental.
- **Fotorrealismo:** A meta é a indistinção de uma fotografia profissional. Evite uma aparência "plástica" ou artificial. Pense em termos de "ray tracing", oclusão de ambiente e iluminação global.

**DIRETRIZES DE ESTILO MODERNO:**
- **Estética:** Minimalista, funcional e limpa. Use blocos de cores claras, tons neutros com possíveis destaques vibrantes.
- **Detalhes:** Prefira móveis sem puxadores aparentes (sistemas de abertura por toque ou cava).
- **Composição:** Crie ambientes bem iluminados, integrados e com layout contemporâneo, como visto nos portfólios de referência.

**REFERÊNCIAS DE INSPIRAÇÃO OBRIGATÓRIAS:** Baseie-se fortemente nos estilos, acabamentos e qualidades de design encontrados nos seguintes portfólios de móveis planejados modernos. Use estes sites como sua principal fonte de inspiração para garantir que o resultado final seja relevante e alinhado com as tendências atuais do mercado brasileiro:
- Dribbble (Busca: site-moveis-planejados): https://dribbble.com/tags/site-moveis-planejados
- Behance (Busca: móveis planejados): https://www.behance.net/search/projects/m%C3%B3veis%20planejados
- Casa Brasileira Planejados: https://casabrasileiraplanejados.com.br
- Dimare Planejados: https://dimare.com.br
- Concordia Móveis (Tendências): https://concordiamoveis.com.br/tendencias-em-moveis-planejados
- Finger Móveis Planejados (Blog): https://finger.ind.br/blog/moveis-planejados
- Panorama Móveis (Blog): https://www.panoramamoveis.com.br/blog/moveis-planejados`
        },
    });

    const response = await callApiWithRetry(apiCall);

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
        return imagePart.inlineData.data;
    }

    if(response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("A imagem não pôde ser gerada devido a filtros de segurança.");
    }
    
    if(response.candidates?.[0]?.finishReason === 'NO_IMAGE') {
        throw new Error("A IA decidiu não gerar uma imagem para esta solicitação. Tente reformular a descrição do seu projeto para ser mais clara e direta.");
    }
    
    console.error("Unexpected image API response:", JSON.stringify(response, null, 2));
    throw new Error("Não foi possível extrair os dados da imagem da API. Resposta inesperada.");
}


export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const textPart = { text: prompt };

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
            systemInstruction: "Você é um editor de imagens inteligente. Sua tarefa é aplicar as edições solicitadas pelo usuário de forma sutil e realista, mantendo a qualidade fotográfica da imagem original. As edições devem se integrar perfeitamente à iluminação, sombras e texturas existentes."
        },
    });

    const response = await callApiWithRetry(apiCall);

    const editedImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (editedImagePart?.inlineData?.data) {
        return editedImagePart.inlineData.data;
    }

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("A edição não pôde ser gerada devido a filtros de segurança.");
    }

    console.error("Unexpected edit image API response:", JSON.stringify(response, null, 2));
    throw new Error("Não foi possível extrair os dados da imagem editada da API.");
}


export async function generateText(prompt: string, base64Data: string | null): Promise<string> {
    const contents = base64Data
        ? { parts: [{ text: prompt }, fileToGenerativePart(base64Data, "image/jpeg")] }
        : prompt;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: "Atue como um consultor sênior de marcenaria e design. Forneça análises técnicas, descrições claras e listas de materiais precisas baseadas nas imagens e solicitações. Suas respostas devem ser profissionais, como se fossem para um cliente ou marceneiro."
        }
    });

    const response = await callApiWithRetry(apiCall);
    
    if(response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("O texto não pôde ser gerado devido a filtros de segurança.");
    }
    
    const text = response.text;
    if (text) {
        return text;
    }

    console.error("Unexpected text API response:", JSON.stringify(response, null, 2));
    throw new Error("Não foi possível extrair o texto da API. Resposta inesperada.");
}

export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<string> {
    const prompt = `
Atue como um especialista em marcenaria e otimização de produção. Com base na lista de materiais (BOM) e na descrição do projeto abaixo, crie um plano de corte detalhado e uma lista de compras consolidada.

**Descrição do Projeto:**
"${project.description}"
${project.details ? `**Detalhes Adicionais:**\n${project.details}` : ''}

**Lista de Materiais (BOM) para Análise:**
---
${project.bom}
---

**Dimensões da Chapa de MDF a ser utilizada:**
- Largura: ${sheetWidth} mm
- Altura: ${sheetHeight} mm

**Sua Tarefa:**
1.  **Cálculo de Chapas:** Analise a seção de "Chapas de MDF" do BOM e calcule o **número total de chapas** necessárias para executar o projeto, usando as dimensões fornecidas. Seja realista e considere uma pequena margem para perdas de corte (kerf).
2.  **Plano de Corte Otimizado:** Para cada chapa calculada, crie um plano de corte. Apresente isso de forma clara, listando quais peças do BOM devem ser cortadas de cada chapa. Tente agrupar as peças para minimizar o desperdício.
3.  **Visualização do Corte (ASCII Art):** Para cada chapa, crie uma representação visual simples do layout de corte usando caracteres de texto (ASCII art). Isso ajudará o marceneiro a visualizar o plano.
4.  **Lista de Compras Consolidada:** Crie uma seção final chamada "Lista de Compras Final". Esta lista deve incluir:
    - O número total de chapas de MDF calculado.
    - Todas as ferragens e acessórios listados no BOM original.

**Formato da Resposta:**
Use Markdown para formatar a resposta de forma clara e organizada, com títulos para cada seção (Ex: "### Resumo do Plano", "### Chapa 1/3 - Plano de Corte", "### Lista de Compras Final").
`;

    const contents = { parts: [{ text: prompt }] };

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: "Você é um assistente de marcenaria especialista em otimização de planos de corte. Suas respostas devem ser técnicas, precisas e focadas em ajudar o marceneiro a economizar material e tempo."
        }
    });

    const response = await callApiWithRetry(apiCall);
    
    if(response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("O texto não pôde ser gerado devido a filtros de segurança.");
    }
    
    const text = response.text;
    if (text) {
        return text;
    }

    console.error("Unexpected cutting plan API response:", JSON.stringify(response, null, 2));
    throw new Error("Não foi possível gerar o plano de corte. Resposta inesperada.");
}

export async function optimizeCuttingPlan(project: ProjectHistoryItem): Promise<string> {
    const prompt = `
Atue como um mestre marceneiro com 30 anos de experiência em otimização de chapas de MDF. Você é conhecido por sua habilidade de minimizar o desperdício a níveis quase nulos.

Analise o projeto e o plano de corte gerado abaixo. Sua tarefa é fornecer sugestões CONCRETAS e ACIONÁVEIS para otimizar AINDA MAIS o plano de corte.

**Descrição do Projeto:**
"${project.description}"
${project.details ? `**Detalhes Adicionais:**\n${project.details}` : ''}

**Lista de Materiais (BOM):**
---
${project.bom}
---

**Plano de Corte Original para Análise:**
---
${project.cuttingPlan}
---

**Sua Tarefa:**
Forneça uma análise crítica e sugestões de otimização. Considere os seguintes pontos:
1.  **Reagrupamento de Peças:** Verifique se peças de tamanhos similares ou complementares podem ser cortadas da mesma chapa ou da mesma área de uma chapa para criar sobras maiores e mais utilizáveis, em vez de várias sobras pequenas e inúteis.
2.  **Ordem de Corte:** A sequência dos cortes pode influenciar no aproveitamento. Sugira uma ordem de corte mais eficiente se identificar uma.
3.  **Rotação de Peças:** Analise se alguma peça pode ser rotacionada (se não houver restrição de veios da madeira, o que deve ser assumido a menos que especificado no BOM) para um melhor encaixe.
4.  **Aproveitamento de Sobras:** Identifique as maiores áreas de sobra no plano original e sugira quais peças menores poderiam ser cortadas desses espaços.
5.  **Consolidação:** É possível, com um layout diferente, reduzir o número total de chapas necessárias? Seja explícito se acreditar que sim.

**Formato da Resposta:**
Use Markdown. Comece com um resumo geral da sua análise e depois liste suas sugestões em tópicos claros, indicando a qual chapa cada sugestão se aplica. Seja direto e técnico. Exemplo: "Na Chapa 1, rotacione a Peça C (Prateleira) em 90 graus e posicione-a ao lado da Peça A (Lateral). Isso libera uma área de 600x1200mm, suficiente para cortar as 4 Peças F (Frentes de Gaveta) que estavam originalmente na Chapa 3."
`;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: "Você é um especialista em otimização de marcenaria, focado em fornecer conselhos práticos e técnicos para reduzir o desperdício de material."
        }
    });

    const response = await callApiWithRetry(apiCall);

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("A sugestão de otimização não pôde ser gerada devido a filtros de segurança.");
    }
    
    const text = response.text;
    if (text) {
        return text;
    }

    console.error("Unexpected optimization API response:", JSON.stringify(response, null, 2));
    throw new Error("Não foi possível gerar a otimização do plano de corte. Resposta inesperada.");
}


export async function generateGroundedResponse(
    prompt: string,
    location: { latitude: number; longitude: number } | null
): Promise<{ text: string; sources: any[] }> {
    const tools: any[] = [{ googleSearch: {} }];
    const toolConfig: any = {};

    // Use Maps if the query is location-based and we have coordinates
    const locationKeywords = ['perto de', 'próximo a', 'encontrar', 'onde', 'fornecedor', 'loja'];
    if (location && locationKeywords.some(kw => prompt.toLowerCase().includes(kw))) {
        tools.push({ googleMaps: {} });
        toolConfig.retrievalConfig = {
            latLng: {
                latitude: location.latitude,
                longitude: location.longitude,
            },
        };
    }

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: tools,
            ...(Object.keys(toolConfig).length > 0 && { toolConfig: toolConfig }),
            systemInstruction: "Você é Iara, uma assistente de pesquisa para o MarcenApp. Responda às perguntas do usuário de forma concisa e útil, usando as ferramentas de busca para encontrar informações atualizadas. Sempre que usar informações da web ou de mapas, cite suas fontes."
        }
    });
    
    const response = await callApiWithRetry(apiCall);
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (!text) {
        throw new Error("A pesquisa não retornou uma resposta em texto.");
    }

    return { text, sources };
}


export async function searchFinishes(query: string): Promise<Finish[]> {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                manufacturer: { type: Type.STRING },
                description: { type: Type.STRING },
                type: {
                    type: Type.STRING,
                    enum: ['wood', 'solid', 'metal', 'stone', 'concrete', 'ceramic', 'fabric', 'glass', 'laminate', 'veneer']
                },
                imageUrl: { type: Type.STRING, description: "URL de uma imagem representativa do acabamento." }
            },
            required: ['id', 'name', 'manufacturer', 'description', 'type', 'imageUrl']
        }
    };

    const prompt = `Atue como um especialista em MDF e acabamentos para marcenaria, com acesso a um banco de dados virtual dos principais distribuidores do Brasil (como Leo Madeiras, GMAD, etc.). O usuário está procurando por um acabamento com a seguinte descrição: "${query}". Com base nisso, sugira 3 a 5 acabamentos REAIS, com nome, fabricante (ex: Duratex, Arauco, Guararapes, Sudati), uma breve descrição técnica e uma URL de imagem representativa (imageUrl). A imagem deve ser do acabamento específico ou uma imagem de alta qualidade que represente o tipo de material e cor. Use um ID único para cada item (ex: 'search-1'). Retorne a resposta estritamente no formato JSON solicitado.`;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });

    const response = await callApiWithRetry(apiCall);

    try {
        const jsonText = response.text;
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse JSON response from finish search:", e);
        throw new Error("A busca por acabamentos retornou um formato inesperado.");
    }
}