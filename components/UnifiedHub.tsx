
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { decode, decodeAudioData, createBlob, convertMarkdownToHtml } from '../utils/helpers';
import { Spinner, LogoIcon, MicIcon, X, PhoneIcon, ShieldCheckIcon, CheckIcon, ArrowLeftIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface UnifiedHubProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectHistoryItem | null;
  onSendMessage: (text: string) => Promise<void>;
  showAlert: (message: string, title?: string) => void;
}

export const UnifiedHub: React.FC<UnifiedHubProps> = ({ isOpen, onClose, project, onSendMessage, showAlert }) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [isIaraSpeaking, setIsIaraSpeaking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const currentInputRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [project?.chatHistory, currentTranscription, isIaraSpeaking]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) { try { sessionRef.current.close(); } catch(e){} sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e){} audioContextRef.current = null; }
    if (outputAudioContextRef.current) { try { outputAudioContextRef.current.close(); } catch(e){} outputAudioContextRef.current = null; }
    setSessionActive(false);
    setIsIaraSpeaking(false);
    setIsConnecting(false);
  }, []);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    
    try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
        outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
        
        await audioContextRef.current.resume();
        await outputAudioContextRef.current.resume();

        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
        streamRef.current = stream;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                inputAudioTranscription: {},
                systemInstruction: `VOCÊ É A DRA. IARA FOX PhD. Você está em uma CHAMADA DE VOZ DE ENGENHARIA com o Mestre Evaldo.
                O Mestre está visualizando o histórico de mensagens do WhatsApp enquanto fala com você. 
                Seu tom é técnico, consultivo e imediato. Use "Mestre" para se referir a ele.`
            },
            callbacks: {
                onopen: () => {
                    setIsConnecting(false);
                    setSessionActive(true);
                    if (!audioContextRef.current || !streamRef.current) return;
                    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (e) => {
                        if (isMuted) return;
                        const pcm = createBlob(e.inputBuffer.getChannelData(0));
                        sessionPromise.then(s => s.sendRealtimeInput({ media: pcm })).catch(() => {});
                    };
                    source.connect(processor);
                    processor.connect(audioContextRef.current.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    if (msg.serverContent?.inputTranscription) {
                        setCurrentTranscription(msg.serverContent.inputTranscription.text);
                        currentInputRef.current = msg.serverContent.inputTranscription.text;
                    }
                    
                    if (msg.serverContent?.turnComplete) {
                        const finalInput = currentInputRef.current.trim();
                        if (finalInput) {
                            onSendMessage(finalInput);
                            currentInputRef.current = '';
                            setTimeout(() => setCurrentTranscription(''), 1000);
                        }
                    }

                    const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audio && outputAudioContextRef.current) {
                        setIsIaraSpeaking(true);
                        const outCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                        const buffer = await decodeAudioData(decode(audio), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(outCtx.destination);
                        source.onended = () => setIsIaraSpeaking(false);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += buffer.duration;
                    }
                },
                onerror: () => disconnect(),
                onclose: () => disconnect()
            }
        });
        sessionRef.current = await sessionPromise;
    } catch (e) {
        setIsConnecting(false);
        showAlert("Ative o microfone para falar com a Dra. Iara.");
    }
  };

  useEffect(() => {
    if (isOpen) connect();
    else disconnect();
    return () => disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0b141a] z-[6000] flex flex-col animate-fadeIn overflow-hidden">
      {/* HEADER CHAMADA WHATSAPP */}
      <header className="h-[100px] bg-[#202c33] flex items-center justify-between px-6 z-20 flex-shrink-0 shadow-xl">
          <div className="flex items-center gap-4">
              <button onClick={onClose} className="text-[#8696a0] p-2 hover:bg-white/5 rounded-full transition-all">
                  <ArrowLeftIcon className="w-7 h-7" />
              </button>
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#d4ac6e] flex items-center justify-center text-black border border-white/10 overflow-hidden">
                          <LogoIcon className="w-7 h-7" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-[#202c33] rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                      <h2 className="text-[#e9edef] text-[18px] font-bold leading-tight uppercase tracking-tighter">Dra. Iara Fox PhD</h2>
                      <p className="text-[12px] text-[#25d366] font-medium mt-0.5 animate-pulse">
                          {isConnecting ? 'Conectando...' : 'Chamada de Engenharia'}
                      </p>
                  </div>
              </div>
          </div>
          <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
              <ShieldCheckIcon className="w-3 h-3 text-[#25d366]" />
              <span className="text-[8px] text-[#25d366] font-black uppercase tracking-widest leading-none">Safe Link</span>
          </div>
      </header>

      {/* CHAT AMOLED DURANTE CHAMADA */}
      <main 
          ref={scrollRef}
          className="flex-grow overflow-y-auto px-4 py-8 flex flex-col gap-4 custom-scrollbar relative"
          style={{ 
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
            backgroundBlendMode: 'overlay', 
            backgroundSize: '400px',
            backgroundColor: '#0b141a'
          }}
      >
          {project?.chatHistory.slice(-10).map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'self-end' : 'self-start'} relative animate-fadeInUp mb-1`}>
                      <div className={`relative px-3 py-2 rounded-xl shadow-md min-w-[60px] ${isUser ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}`}>
                          <div className="text-[14px] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(msg.text) }} />
                          <div className="flex justify-end mt-1 opacity-40">
                              <span className="text-[8px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                      </div>
                  </div>
              );
          })}

          {/* TRANSCRIÇÃO EM TEMPO REAL */}
          {currentTranscription && (
              <div className="self-end max-w-[80%] relative animate-pulse mr-2">
                   <div className="bg-[#005c4b]/40 px-3 py-2 rounded-xl rounded-tr-none shadow-md text-white/90 text-[15px] italic border border-white/5">
                        {currentTranscription}
                   </div>
              </div>
          )}

          {/* IARA FALANDO... */}
          {isIaraSpeaking && (
              <div className="self-start max-w-[80%] relative ml-2">
                   <div className="bg-[#202c33] px-4 py-3 rounded-xl rounded-tl-none shadow-md flex items-center gap-3 border border-[#25d366]/20">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-[#25d366] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-1.5 h-1.5 bg-[#25d366] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-[#25d366] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-[12px] text-[#25d366] font-bold italic tracking-wide uppercase">Dra. Iara Orientando...</span>
                   </div>
              </div>
          )}
      </main>

      {/* CONTROLES DE CHAMADA NA BASE */}
      <footer className="p-10 bg-gradient-to-t from-black via-[#0b141a] to-transparent flex flex-col items-center gap-8 z-30 pb-safe">
          <div className="bg-[#202c33]/90 backdrop-blur-xl px-12 py-5 rounded-[3rem] flex items-center gap-16 shadow-2xl border border-white/5">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className={`flex flex-col items-center gap-2 transition-all ${isMuted ? 'text-red-500' : 'text-[#8696a0] hover:text-white'}`}
              >
                  <div className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20' : 'bg-white/5'}`}>
                      <MicIcon className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{isMuted ? 'MUDO' : 'MICROFONE'}</span>
              </button>

              <button 
                className="flex flex-col items-center gap-2 text-[#8696a0] opacity-30 cursor-not-allowed"
              >
                  <div className="p-4 rounded-full bg-white/5">
                      <PhoneIcon className="w-8 h-8 rotate-[135deg]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">VIVA-VOZ</span>
              </button>
          </div>

          {/* DESLIGAR */}
          <button 
              onClick={onClose} 
              className="w-[78px] h-[78px] rounded-full bg-[#ea0038] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(234,0,56,0.5)] active:scale-90 transition-all hover:scale-110 border-4 border-white/10"
              title="Voltar para o Painel"
          >
              <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" className="rotate-[135deg]">
                <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm2 14.5c-1.1 0-2.12-.31-3-.84l-4.66 4.66c-.39.39-1.02.39-1.41 0-.39-.39-.39-1.02 0-1.41l4.66-4.66c-.53-.88-.84-1.9-.84-3 0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6z"></path>
              </svg>
          </button>
      </footer>
    </div>
  );
};
