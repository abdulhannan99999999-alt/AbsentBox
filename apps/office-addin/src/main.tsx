import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./auth";
import { AppProvider } from "./store/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <AppProvider>
          <App />
        </AppProvider>
      </MsalProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
