import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { loadSettings } from '@/lib/settings'
import { AuthProvider } from '@/lib/auth-context'
import '@/index.css'

// Pull store settings from Supabase before the first paint so the header
// ticker and hero tagline render with live values. Resolves to the local
// cache when Supabase is not configured.
loadSettings().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
})
