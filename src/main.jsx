import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font dibundel (bukan Google Fonts) supaya APK tetap memakai Nunito saat offline
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
