
export const UploadService = {
  /**
   * Converte arquivo para base64 para processamento da Yara.
   */
  async toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Simula upload para um bucket (placeholder).
   */
  async uploadImage(base64: string): Promise<string> {
    // Em produção aqui integraria com S3 ou Firebase Storage
    return base64; 
  }
};
