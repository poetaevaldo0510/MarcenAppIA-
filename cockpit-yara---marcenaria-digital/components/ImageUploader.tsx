
import React, { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { fileToBase64, validateMediaFile } from '../utils/helpers';
import { Spinner, CameraIcon, TrashIcon } from './Shared';

interface ImageUploaderProps {
  onImagesChange: (media: { data: string, mimeType: string }[] | null) => void;
  onOpenCamera?: () => void;
  showAlert: (message: string, title?: string) => void;
  initialImages?: { data: string; mimeType: string }[] | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, onOpenCamera, showAlert, initialImages }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ preview: string; data: string; mimeType: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImages) {
        const mapped = initialImages.map(m => ({
          preview: `data:${m.mimeType};base64,${m.data}`,
          data: m.data,
          mimeType: m.mimeType
        }));
        setUploadedFiles(mapped);
    } else {
      setUploadedFiles([]);
    }
  }, [initialImages]);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files: File[] = Array.from(event.target.files);
      for (const file of files) {
        const validation = validateMediaFile(file);
        if (!validation.isValid) {
          showAlert(validation.error || "Arquivo inválido.");
          return;
        }
      }

      if (uploadedFiles.length + files.length > 3) {
        showAlert("O limite é de 3 fotos por projeto.");
        return;
      }

      setIsUploading(true);
      try {
        const mediaPromises = files.map(file => fileToBase64(file));
        const results = await Promise.all(mediaPromises);
        const newFiles = results.map((r) => ({ 
            preview: r.full, 
            data: r.data, 
            mimeType: r.mimeType
        }));
        const updated = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updated);
        onImagesChange(updated.map(f => ({ data: f.data, mimeType: f.mimeType })));
      } catch (error) {
        showAlert("Erro técnico ao ler rascunho.");
      } finally {
        setIsUploading(false);
        if (event.target) event.target.value = "";
      }
    }
  }, [onImagesChange, showAlert, uploadedFiles]);

  const removeMedia = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    onImagesChange(updated.length > 0 ? updated.map(f => ({ data: f.data, mimeType: f.mimeType })) : null);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-3 animate-fadeIn">
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 group shadow-lg bg-gray-900">
              <img src={file.preview} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Preview" />
              <button 
                onClick={() => removeMedia(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading || uploadedFiles.length >= 3}
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all border border-white/5 disabled:opacity-20 active:scale-95"
        >
          {isUploading ? <Spinner size="sm" /> : <span className="text-lg">📁</span>}
          <span className="text-[9px] font-black uppercase tracking-widest">Enviar Foto</span>
        </button>
        
        {onOpenCamera && (
          <button 
            onClick={onOpenCamera}
            disabled={uploadedFiles.length >= 3}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all border border-white/5 disabled:opacity-20 active:scale-95"
          >
            <CameraIcon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Tirar Foto</span>
          </button>
        )}
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
