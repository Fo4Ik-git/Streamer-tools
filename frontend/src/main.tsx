import { attachConsole } from '@tauri-apps/plugin-log';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './i18n';

// Forward console.log to Tauri logs
attachConsole();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
