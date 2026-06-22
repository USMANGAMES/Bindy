import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AppTab } from '../types'
import { useApp } from '../context/AppContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { useCaptureFlow } from '../hooks/useCaptureFlow'
import { fetchAiStatus } from '../services/aiService'
import { SplashScreen } from './splash/SplashScreen'
import { BottomNav } from './layout/BottomNav'
import { MapScreen } from './screens/MapScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { CoinShopScreen } from './screens/CoinShopScreen'
import { CameraCaptureModal } from './capture/CameraCaptureModal'
import { PhotoPreviewModal } from './capture/PhotoPreviewModal'
import { ProcessingOverlay } from './capture/ProcessingOverlay'
import { SuccessModal } from './capture/SuccessModal'
import { ErrorModal } from './capture/ErrorModal'
import { InstallPrompt } from './InstallPrompt'

export function BindyApp() {
  const { state, completeSplash } = useApp()
  const { position } = useGeolocation()
  const [tab, setTab] = useState<AppTab>('map')
  const capture = useCaptureFlow(position)

  useEffect(() => {
    fetchAiStatus()
  }, [])

  const showSplash = !state.hasSeenSplash
  const captureFullscreen =
    capture.view === 'camera' ||
    capture.view === 'processing' ||
    capture.view === 'success' ||
    capture.view === 'error'

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" onStart={completeSplash} />}
      </AnimatePresence>

      {!showSplash && (
        <div className="relative mx-auto flex h-full min-h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-bindy-bg sm:max-w-xl md:shadow-2xl lg:max-w-md">
          <main className="relative flex flex-1 flex-col overflow-hidden">
            {tab === 'map' && <MapScreen />}
            {tab === 'shop' && <CoinShopScreen />}
            {tab === 'leaderboard' && <LeaderboardScreen />}
            {tab === 'profile' && <ProfileScreen />}
          </main>

          <BottomNav
            active={tab}
            onChange={setTab}
            onCapture={capture.openCamera}
            captureDisabled={capture.isActive}
            hidden={captureFullscreen}
          />
          <InstallPrompt />

          <AnimatePresence>
            {capture.view === 'camera' && (
              <CameraCaptureModal
                key="camera"
                onCapture={capture.setPhoto}
                onClose={capture.closeCamera}
              />
            )}
            {capture.view === 'preview' && capture.photoUrl && (
              <PhotoPreviewModal
                key="preview"
                photoUrl={capture.photoUrl}
                onRetake={capture.retake}
                onSend={capture.send}
              />
            )}
            {capture.view === 'processing' && <ProcessingOverlay key="processing" />}
            {capture.view === 'success' && capture.analysis && (
              <SuccessModal
                key="success"
                analysis={capture.analysis}
                onBackToMap={capture.backToMap}
              />
            )}
            {capture.view === 'error' && (
              <ErrorModal
                key="error"
                message={capture.errorMessage}
                onTryAgain={capture.tryAgain}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
