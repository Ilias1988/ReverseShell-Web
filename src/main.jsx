import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

const rootElement = document.getElementById('root')

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
)

// If the root has children, it means the HTML was pre-rendered.
// Use hydrateRoot() so React attaches to the existing DOM (no flicker).
// Otherwise (local dev), use createRoot() for a normal client-side render.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app)
} else {
  ReactDOM.createRoot(rootElement).render(app)
}
