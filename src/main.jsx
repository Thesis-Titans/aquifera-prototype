import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import App from './app/App.jsx';

// Register MapLibre GL background ES module web worker from public directory
if (typeof window !== 'undefined' && setWorkerUrl) {
  const base = import.meta.env.BASE_URL || '/';
  const workerPath = `${base.endsWith('/') ? base : base + '/'}maplibre-gl-worker.mjs`;
  const fullUrl = new URL(workerPath, window.location.origin).href;
  setWorkerUrl(fullUrl);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

