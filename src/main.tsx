import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import App from './App.tsx'

import UsersData from './backend/Usersdata.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  {/* <App /> */}
  
    <UsersData/>
  </StrictMode>,
)
