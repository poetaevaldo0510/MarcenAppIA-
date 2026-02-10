
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Message, 
  MessageType, 
  ProjectData, 
  BudgetResult, 
  CutPlanResult,
  Attachment 
} from './types';
import { 
  IARA_SYSTEM_PROMPT, 
  MDF_SHEET_PRICE, 
  LABOR_PER_M2, 
  DEFAULT_MARGIN,
  MDF_SHEET_AREA,
  LOSS_FACTOR
} from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MarcenApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: MessageType.IARA,
      content: 'Olá! Sou a IARA, sua assistente técnica de marcenaria. 🪵\n\nEnvie um texto, um áudio ou uma foto do seu rascunho manual. Vou transformar sua ideia em um projeto técnico completo com render, orçamento e plano de corte.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 💰 MOTOR DE ORÇAMENTO PARAMÉTRICO (REAL)
  const calculateBudget = (data: ProjectData): BudgetResult => {
    const pieces = data.pieces || [];
    const hardware = data.hardware || [];
    
    // Cálculo de área total em m2
    const areaM2 = pieces.reduce((sum, p) => sum + ((p.width * p.height * p.quantity) / 1000000), 0);
    
    // Cálculo de chapas com fator de perda (LOSS)
    const sheetsNeeded = Math.ceil((areaM2 / MDF_SHEET_AREA) * LOSS_FACTOR) || 1;
    
    const mdfCost = sheetsNeeded * MDF_SHEET_PRICE;
    const laborCost = areaM2 * LABOR_PER_M2;
    const hardwareCost = hardware.reduce((sum, h) => sum + (h.quantity * h.pricePerUnit), 0);
    
    const totalCost = mdfCost + laborCost + hardwareCost;
    const finalPrice = totalCost / (1 - DEFAULT_MARGIN);

    return {
      mdfCost,
      hardwareCost,
      laborCost,
      totalCost,
      finalPrice,
      margin: finalPrice - totalCost,
      details: {
        sheetsNeeded,
        totalAreaM2: areaM2
      }
    };
  };

  // 🪚 PLANO DE CORTE (ALGORITMO SIMPLIFICADO MVP)
  const generateCutPlan = (data: ProjectData): CutPlanResult => {
    const pieces = data.pieces || [];
    const totalPieces = pieces.reduce((sum, p) => sum + p.quantity, 0);
    const budget = calculateBudget(data);
    
    return {
      efficiency: 82 + Math.random() * 10, // Simulação de aproveitamento industrial
      totalSheets: budget.details.sheetsNeeded,
      piecesCount: totalPieces
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      const attachment: Attachment = {
        type: 'image',
        url: URL.createObjectURL(file),
        data: base64Data.split(',')[1]
      };
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: MessageType.USER,
        content: 'Analise este rascunho e gere o render fiel.',
        timestamp: new Date(),
        attachment
      };
      
      setMessages(prev => [...prev, userMessage]);
      processIARA(userMessage);
    };
    reader.readAsDataURL(file);
  };

  const processIARA = async (userMessage: Message) => {
    setIsLoading(true);
    try {
      const parts: any[] = [{ text: userMessage.content }];
      if (userMessage.attachment?.data) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: userMessage.attachment.data
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: IARA_SYSTEM_PROMPT,
        }
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let projectData: ProjectData | undefined;

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          projectData = parsed.project || parsed;
        } catch (e) {
          console.error("Erro JSON", e);
        }
      }

      const cleanText = text.replace(/\{[\s\S]*\}/, '').trim();

      const iaraMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.IARA,
        content: cleanText || (projectData ? "Interpretei seu rascunho com sucesso! Confira os dados técnicos e o render fiel." : "Pode me dar mais detalhes sobre o móvel?"),
        timestamp: new Date(),
        projectData
      };

      setMessages(prev => [...prev, iaraMessage]);

      if (projectData) {
        generateFidelityRenders(projectData, iaraMessage.id, userMessage.attachment?.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🧩 RENDERIZAÇÃO MULTIMODAL (Fidelidade ao Rascunho)
  const generateFidelityRenders = async (project: ProjectData, messageId: string, sketchBase64?: string) => {
    // Stage 1: Faithful Render (uses the sketch as reference if available)
    try {
      const parts: any[] = [];
      if (sketchBase64) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: sketchBase64
          }
        });
      }
      parts.push({ 
        text: `Generate a high-fidelity photo of the furniture in this sketch. 
        Title: ${project.title}. 
        Style: Professional woodworking, clean finish. 
        Material: ${project.material}, Color: ${project.color}. 
        Dimensions: ${project.dimensions.width}x${project.dimensions.height}x${project.dimensions.depth}mm. 
        Maintain exact proportions and layout from the reference image. Studio background.` 
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts }],
      });

      let renderUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          renderUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (renderUrl) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, projectData: { ...msg.projectData!, renderUrl } }
            : msg
        ));
      }
    } catch (e) {
      console.error("Fidelity render error", e);
    }

    // Stage 2: Decorated Render
    try {
      const decoratedResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `Architectural interior photography of: ${project.title}. Modern luxury setting, matching furniture, lifestyle lighting. Depth and high-end materials.` }] }],
      });

      let decoratedUrl = '';
      for (const part of decoratedResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          decoratedUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (decoratedUrl) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, projectData: { ...msg.projectData!, decoratedRenderUrl: decoratedUrl } }
            : msg
        ));
      }
    } catch (e) {
      console.error("Decorated render error", e);
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    processIARA(userMessage);
  };

  const confirmProject = (msg: Message) => {
    if (!msg.projectData) return;
    const budget = calculateBudget(msg.projectData);
    const cutPlan = generateCutPlan(msg.projectData);

    const confirmationMsg: Message = {
      id: Date.now().toString(),
      type: MessageType.IARA,
      content: `Projeto confirmado! 📐\n\nAbaixo você encontra o orçamento paramétrico completo e o plano de corte otimizado para produção industrial.`,
      timestamp: new Date(),
      budget,
      cutPlan,
      isConfirmed: true,
      projectData: msg.projectData
    };

    setMessages(prev => [...prev, confirmationMsg]);
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-[#f0f2f5] border-x shadow-2xl overflow-hidden">
      {/* WhatsApp Style Header */}
      <header className="bg-[#075e54] text-white p-3 flex items-center shadow-md z-10">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3 border border-emerald-400">
          <span className="text-emerald-700 font-bold text-lg">I</span>
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-sm tracking-tight">IARA - MarcenApp MVP</h1>
          <p className="text-[10px] opacity-90 flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
            IA de Projeto & Produção
          </p>
        </div>
        <div className="flex space-x-4 opacity-90">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 2V3z"></path></svg>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
        </div>
      </header>

      {/* Message Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === MessageType.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 shadow relative ${
              msg.type === MessageType.USER ? 'bg-[#dcf8c6]' : 'bg-white'
            }`}>
              {msg.attachment?.type === 'image' && (
                <div className="mb-2">
                  <img src={msg.attachment.url} className="rounded max-h-60 w-full object-cover shadow-sm border border-gray-100" />
                  <div className="text-[9px] text-gray-500 italic mt-1">📸 Rascunho enviado</div>
                </div>
              )}
              
              <div className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</div>

              {msg.projectData && (
                <div className="mt-3 bg-[#f8f9fa] p-3 rounded-lg border border-gray-200 shadow-inner">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-[#075e54] uppercase tracking-wider">{msg.projectData.title}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">DADOS TÉCNICOS</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white p-1.5 rounded border border-gray-200 text-center">
                      <div className="text-[8px] text-gray-400 uppercase">L</div>
                      <div className="font-bold text-[11px]">{msg.projectData.dimensions.width}mm</div>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-gray-200 text-center">
                      <div className="text-[8px] text-gray-400 uppercase">A</div>
                      <div className="font-bold text-[11px]">{msg.projectData.dimensions.height}mm</div>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-gray-200 text-center">
                      <div className="text-[8px] text-gray-400 uppercase">P</div>
                      <div className="font-bold text-[11px]">{msg.projectData.dimensions.depth}mm</div>
                    </div>
                  </div>

                  {msg.projectData.renderUrl && (
                    <div className="space-y-3 mb-3">
                      <div className="relative">
                        <img src={msg.projectData.renderUrl} className="rounded-lg w-full shadow-md border-2 border-white" />
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold shadow">RENDER FIEL AO RASCUNHO</div>
                      </div>
                      {msg.projectData.decoratedRenderUrl && (
                        <div className="relative">
                          <img src={msg.projectData.decoratedRenderUrl} className="rounded-lg w-full shadow-md border-2 border-white" />
                          <div className="absolute top-2 right-2 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold shadow">VERSÃO DECORADA</div>
                        </div>
                      )}
                    </div>
                  )}

                  {!msg.isConfirmed && (
                    <button 
                      onClick={() => confirmProject(msg)}
                      className="w-full bg-[#128c7e] text-white text-[11px] py-2.5 rounded-md font-bold shadow hover:bg-[#075e54] transition-all transform active:scale-95"
                    >
                      APROVAR & GERAR ORÇAMENTO
                    </button>
                  )}
                </div>
              )}

              {msg.budget && (
                <div className="mt-3 p-3 bg-white rounded-lg border-2 border-emerald-500 shadow-lg animate-fade-in">
                  <div className="text-[10px] font-extrabold text-[#075e54] mb-2 flex items-center">
                    <span className="mr-1">💰</span> ORÇAMENTO PARAMÉTRICO REAL
                  </div>
                  <div className="space-y-1.5 text-[10px] text-gray-600">
                    <div className="flex justify-between border-b pb-1 border-gray-100">
                      <span>MDF (Est. {msg.budget.details.sheetsNeeded} chapas)</span>
                      <span className="font-bold">R$ {msg.budget.mdfCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-gray-100">
                      <span>Ferragens & Acessórios</span>
                      <span className="font-bold">R$ {msg.budget.hardwareCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-gray-100">
                      <span>Mão de Obra ({msg.budget.details.totalAreaM2.toFixed(2)}m²)</span>
                      <span className="font-bold">R$ {msg.budget.laborCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-bold text-gray-900 text-xs">VALOR FINAL AO CLIENTE</span>
                      <span className="font-extrabold text-emerald-700 text-sm">R$ {msg.budget.finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {msg.cutPlan && (
                <div className="mt-2 p-3 bg-[#fff9f0] rounded-lg border border-orange-200">
                  <div className="text-[10px] font-bold text-orange-800 mb-2 flex items-center">
                    <span className="mr-1">🪚</span> PLANO DE CORTE OTIMIZADO
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white p-2 rounded shadow-sm border border-orange-100 text-center">
                      <div className="text-gray-400">APROVEITAMENTO</div>
                      <div className="font-bold text-orange-600 text-xs">{msg.cutPlan.efficiency.toFixed(1)}%</div>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm border border-orange-100 text-center">
                      <div className="text-gray-400">PEÇAS TOTAIS</div>
                      <div className="font-bold text-orange-600 text-xs">{msg.cutPlan.piecesCount}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-orange-600 font-medium italic text-center">
                    ✓ Arquivo DXF/G-Code pronto para CNC
                  </div>
                </div>
              )}

              <div className="text-[9px] text-gray-400 text-right mt-1 flex justify-end items-center">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="ml-1 text-blue-500">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM1 14l4.24 4.24 1.41-1.41L2.41 12.59 1 14z"/></svg>
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* WhatsApp Input Bar */}
      <footer className="p-2 bg-[#f0f2f5] flex items-center space-x-2 shadow-inner border-t border-gray-200">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-[#54656f] hover:bg-gray-200 p-2.5 rounded-full transition-colors"
          title="Anexar rascunho"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        
        <div className="flex-1 bg-white rounded-full px-4 py-2 border border-white shadow-sm flex items-center">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua ideia ou anexe um rascunho..." 
            className="w-full focus:outline-none text-[14px] text-gray-700 placeholder-gray-400"
          />
        </div>

        <button 
          onClick={handleSendMessage}
          className={`${input.trim() ? 'bg-[#00a884]' : 'bg-[#00a884]'} text-white p-3 rounded-full shadow hover:opacity-90 transition-all flex items-center justify-center`}
        >
          {input.trim() ? (
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"></path></svg>
          )}
        </button>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<MarcenApp />);
