
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill essencial para a biblioteca @google/genai funcionar no navegador
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000, // Aumenta o limite para evitar o alerta que você viu no print
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
          icons: ['lucide-react'],
          ai: ['@google/genai']
        }
      }
    }
  }
});
