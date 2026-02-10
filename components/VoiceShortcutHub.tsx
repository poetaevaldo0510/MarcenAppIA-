
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { decode, decodeAudioData, createBlob } from '../utils/helpers';
import { Spinner, LogoIcon, MicIcon, SparklesIcon, CameraIcon, CurrencyDollarIcon, ToolsIcon, CheckIcon } from './Shared';

interface VoiceShortcutHubProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandDetected: (intent: string, payload?: any) => void;
  showAlert: (msg: string, title?: string) => void;
}

export const VoiceShortcutHub: React.FC<VoiceShortcutHubProps> = ({ isOpen, onClose, onCommandDetected, showAlert }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const stopSession = () => {
    if (sessionRef.current) { try { sessionRef.current.close(); } catch(e){} sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e){} audioContextRef.current = null; }
    setIsListening(false);
    setTranscript('');
  };

  const startSession = async () => {
    setIsListening(true);
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      await audioContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `VOCÊ É O HUB DE COMANDO VOCAL DA IARA.
          Sua função é identificar comandos do Mestre Evaldo e responder brevemente.
          COMANDOS RECONHECIDOS:
          1. "Crie um(a) [ambiente]" -> Responda: "Iniciando projeto de [ambiente]..." e finalize o turno.
          2. "Abra a câmera" ou "Scanner" -> Responda: "Lente técnica ativada."
          3. "Financeiro" ou "Quanto ganhei" -> Responda: "Abrindo gestão da Estela."
          4. "Histórico" -> Responda: "Buscando dossiês salvos."
          Seja extremamente concisa. Sua resposta de áudio deve ter menos de 3 segundos.`
        },
        callbacks: {
          onopen: () => {
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const pcm = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcm })).catch(() => {});
            };
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscript(msg.serverContent.inputTranscription.text);
            }
            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer; 
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
            if (msg.serverContent?.turnComplete) {
              const final = transcript.toLowerCase();
              processIntent(final);
            }
          },
          onclose: () => setIsListening(false),
          onerror: () => setIsListening(false)
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      showAlert("Hardware de voz indisponível.");
      onClose();
    }
  };

  const processIntent = (text: string) => {
    setIsProcessing(true);
    setTimeout(() => {
        if (text.includes('cozinha')) onCommandDetected('START_PROJECT', 'cozinha');
        else if (text.includes('closet') || text.includes('quarto')) onCommandDetected('START_PROJECT', 'quarto');
        else if (text.includes('sala')) onCommandDetected('START_PROJECT', 'sala');
        else if (text.includes('câmera') || text.includes('scanner')) onCommandDetected('OPEN_SCANNER');
        else if (text.includes('financeiro') || text.includes('estela')) onCommandDetected('OPEN_FINANCE');
        else if (text.includes('histórico')) onCommandDetected('OPEN_HISTORY');
        else if (text.includes('fechar') || text.includes('obrigado')) onClose();
        
        setIsProcessing(false);
        if (!text.includes('fechar')) setTranscript('');
    }, 1000);
  };

  useEffect(() => {
    if (isOpen) startSession();
    return () => stopSession();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[2000] flex flex-col items-center justify-center p-6 backdrop-blur-3xl animate-fadeIn">
      <div className="w-full max-w-lg bg-[#111] border border-[#d4ac6e]/30 rounded-[4rem] p-10 shadow-[0_0_100px_rgba(212,172,110,0.15)] flex flex-col items-center gap-10 relative overflow-hidden animate-scaleIn">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4ac6e] to-transparent opacity-50"></div>

        <header className="text-center space-y-2">
            <div className="bg-[#d4ac6e] p-4 rounded-[2rem] inline-block shadow-2xl mb-4 text-black">
                <MicIcon className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Portal de Voz Iara</h2>
            <p className="text-[9px] text-[#d4ac6e] font-black uppercase tracking-[0.5em] opacity-60">Sincronia Neural Ativa</p>
        </header>

        <main className="w-full flex flex-col items-center gap-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <div className={`absolute inset-0 bg-[#d4ac6e]/10 blur-[60px] rounded-full scale-[1.5] transition-all duration-1000 ${isListening ? 'animate-pulse' : 'opacity-0'}`}></div>
                <div className="flex gap-1.5 items-end h-16">
                    {[0,1,2,3,4,5,6].map(i => (
                        <div key={i} className="w-1.5 bg-[#d4ac6e] rounded-full animate-bounce" style={{height: `${30 + Math.random()*70}%`, animationDelay: `${i*0.1}s`, animationDuration: '0.6s'}}></div>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 w-full p-8 rounded-[2.5rem] min-h-[120px] flex flex-col justify-center text-center shadow-inner">
                {isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                        <Spinner size="sm" />
                        <span className="text-[9px] font-black text-[#d4ac6e] uppercase tracking-widest">Processando Intenção...</span>
                    </div>
                ) : (
                    <p className="text-xl font-bold text-white italic leading-tight">
                        {transcript || 'Aguardando comando do Mestre...'}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                    <SparklesIcon className="w-4 h-4 text-[#d4ac6e]" />
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">"Crie uma cozinha"</span>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                    <CameraIcon className="w-4 h-4 text-[#d4ac6e]" />
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">"Abra o Scanner"</span>
                </div>
            </div>
        </main>

        <footer className="w-full">
            <button 
                onClick={onClose}
                className="w-full py-5 rounded-[2rem] bg-white/5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
            >
                Encerrar Atalho
            </button>
        </footer>
      </div>
    </div>
  );
};
