
import React, { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { processImage, validateMediaFile } from '../utils/helpers';
import { Spinner, CameraIcon, TrashIcon, PaperClipIcon } from './Shared';

interface MediaUploaderProps {
  onMediaChange: (media: { data: string, mimeType: string }[] | null) => void;
  onOpenCamera: () => void;
  showAlert: (message: string, title?: string) => void;
  initialMedia?: { data: string; mimeType: string }[] | null;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaChange, onOpenCamera, showAlert, initialMedia }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ preview: string; data: string; mimeType: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMedia) {
        const mapped = initialMedia.map(m => ({
          preview: `data:${m.mimeType};base64,${m.data}`,
          data: m.data,
          mimeType: m.mimeType
        }));
        setUploadedFiles(mapped);
    } else {
      setUploadedFiles([]);
    }
  }, [initialMedia]);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files: File[] = Array.from(event.target.files);
      for (const file of files) {
        const validation = validateMediaFile(file);
        if (!validation.isValid) return showAlert(validation.error || "Arquivo inválido.");
      }

      // Mestre: Limite aumentado para 6 fotos para permitir análise 360 do ambiente
      if (uploadedFiles.length + files.length > 6) return showAlert("Máximo de 6 fotos para análise profunda do ambiente.");

      setIsUploading(true);
      try {
        const mediaPromises = files.map(file => processImage(file));
        const results = await Promise.all(mediaPromises);
        const newFiles = results.map((r) => ({ 
            preview: `data:${r.mimeType};base64,${r.data}`, 
            data: r.data, 
            mimeType: r.mimeType
        }));
        const updated = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updated);
        onMediaChange(updated.map(f => ({ data: f.data, mimeType: f.mimeType })));
      } catch (error) {
        console.error(error);
        showAlert("Falha ao processar rascunhos. Use JPG ou PNG.");
      } finally {
        setIsUploading(false);
        if (event.target) event.target.value = "";
      }
    }
  }, [onMediaChange, showAlert, uploadedFiles]);

  const removeMedia = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    onMediaChange(updated.length > 0 ? updated.map(f => ({ data: f.data, mimeType: f.mimeType })) : null);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fadeIn mb-1">
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#d4ac6e] group shadow-md bg-black">
              <img src={file.preview} className="w-full h-full object-cover" alt="Rascunho" />
              <button 
                onClick={() => removeMedia(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-lg shadow-lg active:scale-90"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading || uploadedFiles.length >= 6}
          className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-1.5 active:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          {isUploading ? <Spinner size="sm" /> : <PaperClipIcon className="w-6 h-6 text-[#d4ac6e]" />}
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Enviar Fotos</span>
        </button>
        
        <button 
          onClick={onOpenCamera}
          disabled={uploadedFiles.length >= 6}
          className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-1.5 active:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          <CameraIcon className="w-6 h-6 text-[#d4ac6e]" />
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Scanner Real</span>
        </button>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        multiple 
        className="hidden" 
      />
    </div>
  );
};
