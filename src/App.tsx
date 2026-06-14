import { GoogleOAuthProvider } from '@react-oauth/google'
import { AppRouter } from '@/core/router/AppRouter'
import { ToastContainer } from '@/shared/components/Toast/ToastContainer'

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppRouter />
      <ToastContainer />
    </GoogleOAuthProvider>
  )
}

export default App
