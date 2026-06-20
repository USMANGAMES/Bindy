import { AppProvider } from './context/AppContext'
import { BindyApp } from './components/BindyApp'

export default function App() {
  return (
    <AppProvider>
      <BindyApp />
    </AppProvider>
  )
}
