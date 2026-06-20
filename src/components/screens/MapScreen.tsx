import { useState } from 'react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { BindyMap } from '../map/BindyMap'
import { MapHeader } from '../map/MapHeader'
import { MapControls } from '../map/MapControls'
import { BinDetailSheet } from '../map/BinDetailSheet'
import { CameraFab } from '../capture/CameraFab'
import type { RecyclingBin } from '../../types'

type MapScreenProps = {
  onCapture: () => void
  captureHidden?: boolean
}

export function MapScreen({ onCapture, captureHidden }: MapScreenProps) {
  const { position, loading, refresh } = useGeolocation()
  const [selectedBin, setSelectedBin] = useState<RecyclingBin | null>(null)

  const handleNavigate = () => {
    if (!selectedBin) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedBin.lat},${selectedBin.lng}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="relative h-full flex-1">
      <BindyMap
        userPosition={position}
        selectedBinId={selectedBin?.id ?? null}
        onSelectBin={setSelectedBin}
      />
      <MapHeader />
      <MapControls onLocate={refresh} loading={loading} />
      {!captureHidden && <CameraFab onClick={onCapture} />}
      <BinDetailSheet
        bin={selectedBin}
        onClose={() => setSelectedBin(null)}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
