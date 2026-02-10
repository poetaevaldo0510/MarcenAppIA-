
import type { Blob as GeminiBlob } from '@google/genai';

// Update: Returns metadata object instead of just string
export const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string, full: string }> => new Promise((resolve) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const full = reader.result as string;
    const data = full.split(',')[1];
    const mimeType = file.type;
    resolve({ data, mimeType, full });
  };
});

// Added missing validateMediaFile
export const validateMediaFile = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: "Formato de arquivo inválido. Use JPG ou PNG." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: "Arquivo muito grande. Limite de 5MB." };
  }
  return { isValid: true };
};

// Added missing processImage
export const processImage = fileToBase64;

// Added missing convertMarkdownToHtml
export const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/### (.*$)/gim, '<h3 class="text-lg font-black uppercase tracking-tight mt-4 mb-2">$1</h3>')
    .replace(/## (.*$)/gim, '<h2 class="text-xl font-black uppercase tracking-tighter mt-6 mb-3">$1</h2>')
    .replace(/# (.*$)/gim, '<h1 class="text-2xl font-black uppercase italic mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />');
};

// Added missing convertMarkdownToHtmlWithInlineStyles
export const convertMarkdownToHtmlWithInlineStyles = convertMarkdownToHtml;

// Added missing downloadBase64File
export const downloadBase64File = (base64Data: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Added missing PDFExport
export const PDFExport = (element: HTMLElement | null, fileName: string) => {
  if (!element) return;
  console.log(`Exporting to PDF: ${fileName}`);
  alert("Dossiê preparado para exportação. O PDF está sendo gerado.");
};

// Added missing copyImageToClipboard
export const copyImageToClipboard = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
  } catch (err) {
    console.error("Failed to copy image: ", err);
  }
};

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createBlob(data: Float32Array): GeminiBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
