
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Ponto de entrada para renderizar a aplicação MarcenariaOS
const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Elemento root não encontrado no index.html");
}
