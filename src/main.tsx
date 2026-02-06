import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Add error boundary for debugging
const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to render app:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1>Loading Error</h1>
        <p>Please refresh the page or try again later.</p>
      </div>
    `;
  }
} else {
  console.error("Root element not found");
}
