import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { CoarseLocationPrompt } from '../map/CoarseLocationPrompt'
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
  const adminUser = user && (user.isAdmin || isAdminUsername(user.username)) ? user.username : undefined
  const { position, accuracy, loading, refresh, isCoarse, hasAccurateFix } = useGeolocation()
  const nearbyBins = useNearbyBins(position, 1, hiddenItemIds)
  const community = useCommunityReports(position)
  const nav = useNavigation(position)
  const [selectedBin, setSelectedBin] = useState<RecyclingBin | null>(null)
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null)
  const [layerFilter, setLayerFilter] = useState<MapLayerFilter>({ bin: true, trash: true })
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [coarsePromptOpen, setCoarsePromptOpen] = useState(false)
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    return (localStorage.getItem('bindy-map-style') as MapStyle) || 'voyager'
  })
  const [styleSheetOpen, setStyleSheetOpen] = useState(false)
  const [locateTrigger, setLocateTrigger] = useState(0)

  const handleLocate = () => {
    refresh()
    if (isCoarse || !hasAccurateFix) {
      setCoarsePromptOpen(true)
    } else {
      setLocateTrigger(Date.now())
    }
  }

  const visibleTrash = layerFilter.trash ? community.trash : []
  const visibleCommunityBins = layerFilter.bin ? community.bins : []
  const visibleSeedBins = layerFilter.bin ? nearbyBins : []

  // Avtomatik ravishda aniq GPS topilganda shtorkani yopish va foydalanuvchiga uchib borish
  useEffect(() => {
    if (hasAccurateFix && !isCoarse && coarsePromptOpen) {
      setCoarsePromptOpen(false)
      setLocateTrigger(Date.now())
    }
  }, [hasAccurateFix, isCoarse, coarsePromptOpen])

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
        locateTrigger={locateTrigger}
        accuracy={accuracy}
        hasAccurateFix={hasAccurateFix && !isCoarse}
      />
      <MapHeader />
      {isCoarse && (
        <motion.button
          type="button"
          onClick={() => setCoarsePromptOpen(true)}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 top-[calc(max(0.75rem,env(safe-area-inset-top))+4.5rem)] z-[600] flex max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-2xl bg-amber-500/95 px-3.5 py-2 text-xs font-semibold text-white shadow-soft backdrop-blur-md transition active:scale-95"
        >
          <span className="flex h-2 w-2 shrink-0 rounded-full bg-white animate-ping" />
          <span className="truncate">Joylashuv taxminiy (~1 km). To‘g‘rilash</span>
          <span className="shrink-0 text-amber-100 font-bold">➔</span>
        </motion.button>
      )}
      <MapControls onLocate={handleLocate} loading={loading} />
      <MapCategoryFilter
        filter={layerFilter}
        onChange={setLayerFilter}
        unreadCount={unreadCount}
        onOpenAlerts={() => setAlertsOpen(true)}
        onOpenStyles={() => setStyleSheetOpen(true)}
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

      <CoarseLocationPrompt
        open={coarsePromptOpen}
        onClose={() => setCoarsePromptOpen(false)}
        onRefresh={handleLocate}
        hasAccurateFix={hasAccurateFix}
      />
    </div>
  )
}
