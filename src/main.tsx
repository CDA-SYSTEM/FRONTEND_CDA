import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { defineCustomElements } from '@ionic/pwa-elements/loader'
import App from './App.tsx'
import './index.css'

if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('id_token=')) {
  const params = new URLSearchParams(window.location.hash.substring(1))
  const idToken = params.get('id_token')
  if (idToken) {
    localStorage.setItem('temp_google_id_token', idToken)
  }
  window.location.href = window.location.origin + '/login'
}

defineCustomElements(window)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
