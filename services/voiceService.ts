
export const VoiceService = {
  getSpeechRecognition: () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;
    return recognition;
  },

  startListening: (onResult: (text: string, isFinal: boolean) => void, onError: (err: any) => void) => {
    const recognition = VoiceService.getSpeechRecognition();
    if (!recognition) {
      onError("Navegador não suporta reconhecimento de voz.");
      return null;
    }

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      const isFinal = event.results[0].isFinal;
      onResult(transcript, isFinal);
    };

    recognition.onerror = (event: any) => onError(event.error);
    recognition.start();
    return recognition;
  }
};
