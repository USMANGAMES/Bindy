import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useNearbyBins } from '../../hooks/useNearbyBins'
import { useCommunityReports, toMapTarget } from '../../hooks/useCommunityReports'
import { useNavigation } from '../../hooks/useNavigation'
import { BindyMap } from '../map/BindyMap'
import { MapHeader } from '../map/MapHeader'
import { MapControls } from '../map/MapControls'
import { MapCategoryFilter, type MapLayerFilter } from '../map/MapCategoryFilter'
import { BinDetailSheet } from '../map/BinDetailSheet'
import { CommunityReportSheet } from '../map/CommunityReportSheet'
import { NearbyBinsPanel } from '../map/NearbyBinsPanel'
import { NavigationPanel } from '../map/NavigationPanel'
import { haversineMeters } from '../../utils/geo'
import type { RecyclingBin } from '../../types'
import type { CommunityReport } from '../../hooks/useCommunityReports'

export function MapScreen() {
  const { position, loading, refresh } = useGeolocation()
  const nearbyBins = useNearbyBins(position, 1)
  const community = useCommunityReports(position)
  const nav = useNavigation(position)
  const [selectedBin, setSelectedBin] = useState<RecyclingBin | null>(null)
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null)
  const [layerFilter, setLayerFilter] = useState<MapLayerFilter>({ bin: true, trash: true })

  const visibleTrash = layerFilter.trash ? community.trash : []
  const visibleCommunityBins = layerFilter.bin ? community.bins : []
  const visibleSeedBins = layerFilter.bin ? nearbyBins : []

  useEffect(() => {
    if (selectedReport?.category === 'trash' && !layerFilter.trash) {
      setSelectedReport(null)
    }
    if (selectedReport?.category === 'bin' && !layerFilter.bin) {
      setSelectedReport(null)
    }
    if (selectedBin && !layerFilter.bin) {
      setSelectedBin(null)
    }
  }, [layerFilter, selectedReport, selectedBin])

  const handleSelectSeedBin = (bin: RecyclingBin) => {
    if (!layerFilter.bin) return
    setSelectedReport(null)
    const fromList = nearbyBins.find((b) => b.id === bin.id)
    setSelectedBin(
      fromList ?? {
        ...bin,
        distanceM: haversineMeters(position, [bin.lat, bin.lng]),
      },
    )
  }

  const handleSelectReport = (report: CommunityReport) => {
    if (report.category === 'trash' && !layerFilter.trash) return
    if (report.category === 'bin' && !layerFilter.bin) return
    setSelectedBin(null)
    setSelectedReport(report)
  }

  const handleNavigateBin = async () => {
    if (!selectedBin) return
    const target = {
      id: selectedBin.id,
      lat: selectedBin.lat,
      lng: selectedBin.lng,
      name: selectedBin.name,
    }
    setSelectedBin(null)
    await nav.startNavigation(target)
  }

  const handleNavigateReport = async () => {
    if (!selectedReport) return
    const target = toMapTarget(selectedReport)
    setSelectedReport(null)
    await nav.startNavigation(target)
  }

  return (
    <div className="relative h-full flex-1">
      <BindyMap
        userPosition={position}
        communityTrash={visibleTrash}
        communityBins={visibleCommunityBins}
        showSeedBins={layerFilter.bin}
        selectedBinId={selectedBin?.id ?? null}
        selectedReportId={selectedReport?.id ?? null}
        navigationTargetId={nav.destination?.id ?? null}
        route={nav.route}
        isNavigating={nav.isNavigating}
        onSelectSeedBin={handleSelectSeedBin}
        onSelectReport={handleSelectReport}
      />
      <MapHeader />
      <MapControls onLocate={refresh} loading={loading} />
      <MapCategoryFilter filter={layerFilter} onChange={setLayerFilter} />

      <AnimatePresence>
        {nav.isNavigating && nav.destination && (
          <NavigationPanel
            key="nav"
            destination={nav.destination}
            route={nav.route}
            remainingM={nav.remainingM}
            loading={nav.loading}
            onStop={nav.stopNavigation}
          />
        )}
      </AnimatePresence>

      {!nav.isNavigating && (
        <NearbyBinsPanel
          bins={visibleSeedBins}
          communityTrash={visibleTrash}
          communityBins={visibleCommunityBins}
          layerFilter={layerFilter}
          selectedBinId={selectedBin?.id ?? null}
          selectedReportId={selectedReport?.id ?? null}
          onSelectBin={handleSelectSeedBin}
          onSelectReport={handleSelectReport}
        />
      )}

      <BinDetailSheet
        bin={selectedBin}
        onClose={() => setSelectedBin(null)}
        onNavigate={handleNavigateBin}
        navigating={nav.loading}
      />

      <CommunityReportSheet
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onNavigate={handleNavigateReport}
        navigating={nav.loading}
      />
    </div>
  )
}
