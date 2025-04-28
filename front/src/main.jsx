import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import 'boxicons/css/boxicons.min.css'
import UserContextProvider from './contexts/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserContextProvider>
        <App />
      </UserContextProvider>

    </BrowserRouter>
  </StrictMode>
)

