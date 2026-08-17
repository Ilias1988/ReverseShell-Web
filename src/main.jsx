import React from 'react'
import { createRoot } from 'react-dom/client'
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

// The production build contains a Puppeteer-generated HTML snapshot for
// crawlers. That snapshot is captured after effects have run, so it is not a
// valid React SSR tree and must not be hydrated. Replace it with the live app;
// the original HTML remains available in the raw response for no-JS crawlers.
rootElement.replaceChildren()
createRoot(rootElement).render(app)
