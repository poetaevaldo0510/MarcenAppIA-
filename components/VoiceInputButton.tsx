import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from './Shared';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  showAlert: (message: string, title?: string) => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, showAlert }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      onTranscript(transcript);
    };

    recognition.onspeechstart = () => setIsSpeaking(true);
    recognition.onspeechend = () => setIsSpeaking(false);
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      setIsSpeaking(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return;
      console.error("STT Error:", event.error);
      setIsRecording(false);
      setIsSpeaking(false);
      if (event.error === 'not-allowed') showAlert("Microfone bloqueado. Ative nas configurações do navegador.", "Erro de Voz");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [onTranscript, showAlert]);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) return showAlert("Reconhecimento de voz não suportado neste navegador.");

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        // Tenta liberar o microfone de outros processos antes de começar
        recognitionRef.current.start();
        if (window.navigator.vibrate) window.navigator.vibrate(40);
      } catch (error) {
        console.error("STT Start failure", error);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center ${
        isRecording
          ? 'bg-red-500 shadow-lg scale-110'
          : 'bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8]'
      }`}
      title={isRecording ? 'Parar gravação' : 'Gravar por voz'}
    >
      <MicIcon isRecording={isRecording} isSpeaking={isSpeaking} className={isRecording ? 'text-white' : 'text-[#3e3535]'} />
    </button>
  );
};