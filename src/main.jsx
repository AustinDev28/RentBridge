import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme/global.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserPreferencesProvider } from './user/UserPreferences.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserPreferencesProvider>
        <App />
      </UserPreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
)
