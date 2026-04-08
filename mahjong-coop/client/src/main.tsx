import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // StrictMode deshabilitado en desarrollo para evitar issues con Socket.io
  <App />
)
