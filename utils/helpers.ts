import type { ProjectHistoryItem } from '../types';
import type { Blob } from '@google/genai';

export const fileToBase64 = (file: File): Promise<{ full: string; data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const fullBase64 = reader.result as string;
      const data = fullBase64.split(',')[1];
      resolve({ full: fullBase64, data, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

export const convertMarkdownToHtml = (text: string): string => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-sky-400 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-sky-300 mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold text-sky-200 mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> elements in a <ul>
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>').replace(/<\/ul><br \/><ul>/g, '');
  
  return html;
};

export const convertMarkdownToHtmlWithInlineStyles = (text: string): string => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1em; font-weight: bold; color: #38bdf8; margin-top: 1em; margin-bottom: 0.5em;">$1</h3>') // sky-500
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25em; font-weight: bold; color: #7dd3fc; margin-top: 1.2em; margin-bottom: 0.6em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em;">$1</h2>') // sky-300
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5em; font-weight: bold; color: #e0f2fe; margin-top: 1.5em; margin-bottom: 0.7em;">$1</h1>') // sky-100
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 0.25em;">$1</li>')
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> elements in a <ul>
  html = html.replace(/(<li.*<\/li>)/gs, '<ul style="padding-left: 20px; list-style-position: inside;">$1</ul>').replace(/<\/ul><br \/><ul>/g, '');
  
  return html;
};

export const addTitleToImage = (base64Data: string, title: string, date: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const titleAreaHeight = 70;
            const padding = 20;

            canvas.width = img.width;
            canvas.height = img.height + titleAreaHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // White background for the entire canvas
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw title text
            ctx.fillStyle = '#1f2937'; // gray-800
            ctx.font = 'bold 22px "Poppins", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(title, padding, padding);

            // Draw date text
            ctx.font = '16px "Poppins", sans-serif';
            ctx.fillStyle = '#6b7280'; // gray-500
            ctx.fillText(date, padding, padding + 28);

            // Draw a separator line
            ctx.strokeStyle = '#e5e7eb'; // gray-200
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, titleAreaHeight - 15);
            ctx.lineTo(canvas.width - padding, titleAreaHeight - 15);
            ctx.stroke();

            // Draw the original image below the title area
            ctx.drawImage(img, 0, titleAreaHeight);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => {
            reject(new Error(`Image could not be loaded to canvas: ${err}`));
        };
        img.src = `data:image/png;base64,${base64Data}`;
    });
};


export const PDFExport = (element: HTMLElement, filename: string) => {
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#030712' // bg-gray-950, to match 'Deep Neutral' theme
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    (window as any).html2pdf().from(element).set(opt).save();
};

// --- AUDIO HELPERS FOR LIVE API ---

// Decodes a base64 string into a Uint8Array.
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw audio data into an AudioBuffer that can be played by the browser.
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

// Encodes a Uint8Array into a base64 string.
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Creates a Blob object compatible with the Live API from raw audio data.
export function createBlob(data: Float32Array): Blob {
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