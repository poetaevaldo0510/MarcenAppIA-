import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // <- ESTA LINHA É O PROBLEMA

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
