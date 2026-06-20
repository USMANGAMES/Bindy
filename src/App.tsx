import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { BindyApp } from './components/BindyApp'
import { AuthScreen } from './components/auth/AuthScreen'

function LoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bindy-bg">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-bindy-mint/30 border-t-bindy-mint" />
    </div>
  )
}

function AppRoot() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <AuthScreen />

  return (
    <AppProvider username={user.username}>
      <BindyApp />
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  )
}
