
import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Disc, Activity } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { createPcmBlob } from '../utils';
import { useProjectStore } from '../store/useProjectStore';

export const LiveAssistant: React.FC = () => {
  const { isAssistantActive, setAssistantActive } = useProjectStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isAssistantActive && !sessionRef.current) startSession();
    else if (!isAssistantActive && sessionRef.current) stopSession();
  }, [isAssistantActive]);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64Pcm = createPcmBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64Pcm, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => (prev + ' ' + msg.serverContent!.outputTranscription!.text).slice(-150));
            }
          },
          onclose: () => setAssistantActive(false),
          onerror: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Você é YARA, uma IA industrial. Seja direta e técnica com o Mestre Evaldo."
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsConnecting(false);
      setAssistantActive(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    setTranscription('');
    setIsConnecting(false);
  };

  if (!isAssistantActive) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300 w-full max-w-lg px-6">
      <div className="bg-[#111b21]/95 backdrop-blur-3xl border-4 border-indigo-600 shadow-2xl rounded-[3rem] p-8 flex items-center gap-8">
         <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-white relative ${isConnecting ? 'bg-amber-600' : 'bg-indigo-600'}`}>
            {isConnecting ? <Loader2 className="animate-spin" size={40}/> : <Disc className="animate-spin-slow" size={40}/>}
         </div>
         <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">YARA LIVE</span>
            <p className="text-lg text-white font-black italic truncate">{transcription || "Aguardando comando..."}</p>
         </div>
         <button onClick={() => setAssistantActive(false)} className="p-4 bg-white/5 hover:bg-red-600 text-stone-400 hover:text-white rounded-2xl"><X size={32}/></button>
      </div>
    </div>
  );
};
