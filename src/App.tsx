import { GoogleOAuthProvider } from '@react-oauth/google'
import { AppRouter } from '@/core/router/AppRouter'

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppRouter />
    </GoogleOAuthProvider>
  )
}

export default App
