import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useNearbyBins } from '../../hooks/useNearbyBins'
import { useCommunityReports, toMapTarget } from '../../hooks/useCommunityReports'
import { useNavigation } from '../../hooks/useNavigation'
import { BindyMap } from '../map/BindyMap'
import { MapHeader } from '../map/MapHeader'
import { MapControls } from '../map/MapControls'
import { MapStyleSheet, type MapStyle } from '../map/MapStyleSheet'
import { MapCategoryFilter, type MapLayerFilter } from '../map/MapCategoryFilter'
import { MapAlertsSheet } from '../map/MapAlertsSheet'
import { BinDetailSheet } from '../map/BinDetailSheet'
import { CommunityReportSheet } from '../map/CommunityReportSheet'
import { NearbyBinsPanel } from '../map/NearbyBinsPanel'
import { NavigationPanel } from '../map/NavigationPanel'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isAdminUsername } from '../../config/admins'
import { haversineMeters } from '../../utils/geo'
import type { RecyclingBin } from '../../types'
import type { CommunityReport } from '../../hooks/useCommunityReports'

export function MapScreen() {
  const {
    refreshSharedReports,
    notifications,
    unreadCount,
    refreshNotifications,
    hiddenItemIds,
    applyHiddenItem,
    refreshHiddenItems,
  } = useApp()
  const { user } = useAuth()
  const adminUser = user && isAdminUsername(user.username) ? user.username : undefined
  const { position, loading, refresh } = useGeolocation()
  const nearbyBins = useNearbyBins(position, 1, hiddenItemIds)
  const community = useCommunityReports(position)
  const nav = useNavigation(position)
  const [selectedBin, setSelectedBin] = useState<RecyclingBin | null>(null)
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null)
  const [layerFilter, setLayerFilter] = useState<MapLayerFilter>({ bin: true, trash: true })
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    return (localStorage.getItem('bindy-map-style') as MapStyle) || 'voyager'
  })
  const [styleSheetOpen, setStyleSheetOpen] = useState(false)

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

  const handleItemDeleted = (id: string) => {
    applyHiddenItem(id)
    refreshHiddenItems()
    refreshSharedReports()
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
        hiddenItemIds={hiddenItemIds}
        mapStyle={mapStyle}
      />
      <MapHeader />
      <MapControls
        onLocate={refresh}
        loading={loading}
        onOpenStyles={() => setStyleSheetOpen(true)}
      />
      <MapCategoryFilter
        filter={layerFilter}
        onChange={setLayerFilter}
        unreadCount={unreadCount}
        onOpenAlerts={() => setAlertsOpen(true)}
      />

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
        adminUser={adminUser}
        onClose={() => setSelectedBin(null)}
        onNavigate={handleNavigateBin}
        onDeleted={() => {
          if (selectedBin) handleItemDeleted(selectedBin.id)
          setSelectedBin(null)
        }}
        navigating={nav.loading}
      />

      {user && (
        <MapAlertsSheet
          open={alertsOpen}
          notifications={notifications}
          username={user.username}
          onClose={() => setAlertsOpen(false)}
          onRefresh={refreshNotifications}
        />
      )}

      <CommunityReportSheet
        report={selectedReport}
        adminUser={adminUser}
        onClose={() => setSelectedReport(null)}
        onNavigate={handleNavigateReport}
        onDeleted={() => {
          if (selectedReport) handleItemDeleted(selectedReport.id)
          setSelectedReport(null)
        }}
        navigating={nav.loading}
      />

      <MapStyleSheet
        open={styleSheetOpen}
        onClose={() => setStyleSheetOpen(false)}
        currentStyle={mapStyle}
        onSelectStyle={(s) => {
          setMapStyle(s)
          localStorage.setItem('bindy-map-style', s)
        }}
      />
    </div>
  )
}
