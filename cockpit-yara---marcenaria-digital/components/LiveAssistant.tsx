
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { decode, decodeAudioData, createBlob } from '../utils/helpers';
// Added ShieldCheckIcon to the imports from Shared components
import { Spinner, LogoIcon, MicIcon, SparklesIcon, ToolsIcon, SawIcon, FlameIcon, CheckIcon, RulerIcon, ShieldCheckIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (message: string, title?: string) => void;
  project?: ProjectHistoryItem | null;
  onSendMessage?: (text: string, media?: {data: string, mimeType: string}[]) => Promise<void>;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ isOpen, onClose, showAlert, project, onSendMessage }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [isIaraSpeaking, setIsIaraSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [activeTool, setActiveTool] = useState<'NONE' | 'FLAME' | 'SAW' | 'MEASURE'>('NONE');
  const [isHandsFree, setIsHandsFree] = useState(true);

  const sessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputRef = useRef<string>('');

  const disconnect = useCallback(() => {
      if (sessionRef.current) { try { sessionRef.current.close(); } catch(e) {} sessionRef.current = null; }
      if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null; }
      if (audioContextRef.current) { try { if (audioContextRef.current.state !== 'closed') audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
      if (outputAudioContextRef.current) { try { if (outputAudioContextRef.current.state !== 'closed') outputAudioContextRef.current.close(); } catch(e) {} outputAudioContextRef.current = null; }
      playingSourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
      playingSourcesRef.current.clear();
      setConnectionState('disconnected');
      setIsIaraSpeaking(false);
      setCurrentTranscript('');
      setActiveTool('NONE');
  }, []);

  const connect = async () => {
    disconnect();
    setConnectionState('connecting');

    try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
        outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
        
        await audioContextRef.current.resume();
        await outputAudioContextRef.current.resume();

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                inputAudioTranscription: {},
                systemInstruction: `VOCÊ É O NEURAL LINK IARA PhD - ASSISTENTE DE BANCADA EM TEMPO REAL.
                
                MISSÃO: Escutar continuamente o Mestre Evaldo enquanto ele trabalha e reagir a comandos de voz instantaneamente.
                
                LÉXICO TÉCNICO E GATILHOS:
                - Ao ouvir "Maçarico": Entenda como acabamento térmico ou cauterização. Responda: "Maçarico em prontidão para o acabamento, Mestre."
                - Ao ouvir "Corte" ou "Aproveitamento": Foque em Nesting e otimização. Responda: "Calculando o máximo aproveitamento da chapa agora."
                - Ao ouvir "Medida" ou "Trena": Prepare-se para registro de dimensões.
                
                REGRAS:
                1. Respostas Curtas: Na bancada, o tempo é ouro. Seja breve.
                2. Confirmação: Sempre confirme que a ferramenta citada foi "empunhada" digitalmente.`
            },
            callbacks: {
                onopen: () => {
                    setConnectionState('connected');
                    const source = audioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                    const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) })).catch(() => {});
                    };
                    source.connect(processor);
                    processor.connect(audioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        const transcript = message.serverContent.inputTranscription.text;
                        setCurrentTranscript(transcript);
                        currentInputRef.current = transcript;

                        // Detecção de Intenção e Feedback de Ferramenta
                        const lower = transcript.toLowerCase();
                        if (lower.includes('maçarico')) setActiveTool('FLAME');
                        else if (lower.includes('corte') || lower.includes('aproveita')) setActiveTool('SAW');
                        else if (lower.includes('medida') || lower.includes('trena')) setActiveTool('MEASURE');
                    }
                    
                    if (message.serverContent?.turnComplete) {
                        const input = currentInputRef.current.trim();
                        if (input && onSendMessage) {
                            onSendMessage(`[COMANDO VOZ]: ${input}`);
                            currentInputRef.current = '';
                            setCurrentTranscript('');
                            // Limpa ferramenta após um tempo para não poluir
                            setTimeout(() => setActiveTool('NONE'), 5000);
                        }
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current) {
                        setIsIaraSpeaking(true);
                        const outCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outCtx.destination);
                        source.onended = () => {
                            playingSourcesRef.current.delete(source);
                            if (playingSourcesRef.current.size === 0) setIsIaraSpeaking(false);
                        };
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        playingSourcesRef.current.add(source);
                    }
                },
                onerror: () => setConnectionState('error'),
                onclose: () => setConnectionState('disconnected')
            }
        });
        sessionRef.current = await sessionPromise;
    } catch (err: any) {
        setConnectionState('error');
        showAlert("Falha ao ativar escuta contínua. Verifique o microfone.");
    }
  };

  useEffect(() => { 
    if (isOpen) connect();
    return () => disconnect(); 
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#050505]/95 z-[5000] flex flex-col justify-center items-center p-4 backdrop-blur-3xl animate-fadeIn">
      <div className="bg-[#0b141a] border border-white/10 rounded-[4rem] w-full max-w-3xl h-[80vh] shadow-[0_0_150px_rgba(212,172,110,0.2)] flex flex-col overflow-hidden animate-scaleIn">
        
        <header className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
            <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-700 ${connectionState === 'connected' ? 'bg-[#d4ac6e] shadow-[0_0_50px_rgba(212,172,110,0.5)]' : 'bg-white/5'}`}>
                    <LogoIcon className={`w-10 h-10 ${connectionState === 'connected' ? 'text-black' : 'text-gray-600'}`} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Neural Link <span className="text-[#d4ac6e]">360</span></h2>
                    <p className="text-[10px] text-[#d4ac6e] font-black uppercase tracking-[0.5em] opacity-80 mt-1.5">
                        {connectionState === 'connected' ? 'Escuta Ativa em Tempo Real' : 'Sincronizando Lóbulo Frontal...'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setIsHandsFree(!isHandsFree)}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isHandsFree ? 'bg-[#d4ac6e] text-black shadow-lg' : 'text-gray-500'}`}
                    >
                        Hands-Free
                    </button>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 text-gray-500 hover:text-white flex items-center justify-center text-4xl font-light transition-all active:scale-75">&times;</button>
            </div>
        </header>

        <main className="flex-1 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0b141a]">
            
            {/* Visualizador de Ferramenta Ativa */}
            <div className="absolute top-10 flex gap-6 animate-fadeInUp">
                <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center border-2 transition-all duration-500 ${activeTool === 'FLAME' ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-125 z-10' : 'bg-white/5 border-white/5 text-white/10 opacity-30'}`}>
                    <FlameIcon className="w-8 h-8" />
                    <span className="text-[7px] font-black uppercase mt-1">Maçarico</span>
                </div>
                <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center border-2 transition-all duration-500 ${activeTool === 'SAW' ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_40px_rgba(59,130,246,0.4)] scale-125 z-10' : 'bg-white/5 border-white/5 text-white/10 opacity-30'}`}>
                    <SawIcon className="w-8 h-8" />
                    <span className="text-[7px] font-black uppercase mt-1">Corte</span>
                </div>
                <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center border-2 transition-all duration-500 ${activeTool === 'MEASURE' ? 'bg-[#d4ac6e] border-[#d4ac6e] text-black shadow-[0_0_40px_rgba(212,172,110,0.4)] scale-125 z-10' : 'bg-white/5 border-white/5 text-white/10 opacity-30'}`}>
                    <RulerIcon className="w-8 h-8" />
                    <span className="text-[7px] font-black uppercase mt-1">Medida</span>
                </div>
            </div>

            <div className="relative mb-20 group">
                {/* Onda Neural Dinâmica */}
                <div className={`absolute inset-0 rounded-full blur-[100px] transition-all duration-700 ${isIaraSpeaking ? 'bg-blue-500/30 scale-[3]' : 'bg-[#d4ac6e]/20 scale-[2.5]'} ${connectionState === 'connected' ? 'opacity-100' : 'opacity-0'}`}></div>
                
                <div className={`w-56 h-56 bg-[#121212] rounded-full flex items-center justify-center shadow-3xl relative z-10 transition-all duration-500 border-8 ${connectionState === 'connected' ? (isIaraSpeaking ? 'border-blue-500 scale-110 shadow-[0_0_60px_rgba(59,130,246,0.3)]' : 'border-[#d4ac6e] shadow-[0_0_80px_rgba(212,172,110,0.2)]') : 'border-white/5 opacity-20'}`}>
                    {connectionState === 'connecting' ? (
                        <Spinner size="lg" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <MicIcon className={`w-24 h-24 transition-all duration-500 ${isIaraSpeaking ? 'text-white' : 'text-[#d4ac6e]'}`} isRecording={connectionState === 'connected' && !isIaraSpeaking} isSpeaking={isIaraSpeaking} />
                        </div>
                    )}
                </div>

                {/* Indicador de Visualização do Mestre */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 backdrop-blur-xl">
                    <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                        {isIaraSpeaking ? 'Dra. Iara Orientando...' : 'Mestre, pode falar.'}
                    </span>
                </div>
            </div>
            
            <div className="min-h-[160px] flex flex-col items-center justify-center max-w-xl z-10">
                {connectionState === 'error' ? (
                    <div className="space-y-4">
                        <p className="text-red-500 font-black uppercase tracking-[0.3em] text-xl italic">Conexão Falhou</p>
                        <button onClick={connect} className="bg-white/10 text-white px-8 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/20 transition-all">Tentar Re-Sincronizar</button>
                    </div>
                ) : (
                    <div className="space-y-10 w-full px-8">
                        <div className="relative">
                            <p className={`text-3xl font-black italic leading-[1.1] transition-all duration-500 ${currentTranscript ? 'text-white' : 'text-white/10'}`}>
                                {currentTranscript || "A Iara está em escuta profunda..."}
                            </p>
                            {currentTranscript && <SparklesIcon className="absolute -top-6 -right-6 w-8 h-8 text-[#d4ac6e] animate-spin slow opacity-30" />}
                        </div>

                        {activeTool !== 'NONE' && (
                            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl animate-fadeInUp flex items-center justify-center gap-4">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                    Protocolo {activeTool === 'FLAME' ? 'Maçarico' : activeTool === 'SAW' ? 'Máximo Aproveitamento' : 'Precisão Milimétrica'} Ativo
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>

        <footer className="p-8 border-t border-white/5 bg-[#1a1a1a] flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
                    <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Privacidade Mestre</span>
                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Áudio processado localmente em tempo real</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4 opacity-40">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Sinapse PhD v3.0 Digital Dynamics</span>
            </div>
        </footer>
      </div>
      <button onClick={onClose} className="mt-10 text-gray-600 hover:text-white text-[10px] font-black uppercase tracking-[1em] transition-all active:scale-95 animate-pulse">Encerrar Canal Neural</button>
    </div>
  );
};
