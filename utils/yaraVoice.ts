
export function startYaraVoice(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (err: string) => void
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError("Reconhecimento de voz não suportado neste navegador.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');
    
    const isFinal = event.results[0].isFinal;
    onResult(transcript, isFinal);
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event.error);
  };

  recognition.start();
  return recognition;
}
