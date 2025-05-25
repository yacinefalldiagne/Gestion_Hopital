import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import 'boxicons/css/boxicons.min.css';
import UserContextProvider from './contexts/AuthContext.jsx';
import { ThemeProvider } from './components/ThemeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserContextProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </UserContextProvider>
    </BrowserRouter>
  </StrictMode>
);