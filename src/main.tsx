import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import App from './App.tsx'
import OtpPage from './components/OTP/otpPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  {/* <App /> */}
    <OtpPage />
  </StrictMode>,
)
