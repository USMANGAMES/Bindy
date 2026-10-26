import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { RecyclingBin, RouteResult } from '../../types'
import type { CommunityReport } from '../../hooks/useCommunityReports'
import { SEED_BINS } from '../../data/bins'
import { haversineKm } from '../../utils/geo'
import { RouteLayer, RouteFitBounds, NavigationFollow } from './RouteLayer'
import 'leaflet/dist/leaflet.css'

function createBinIcon(selected: boolean, navigating: boolean) {
  const bg = navigating ? '#F59E0B' : selected ? '#F59E0B' : '#10B981'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;height:36px;
        background:${bg};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 14px rgba(16,185,129,0.45);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:14px">♻</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

function createCommunityBinIcon(selected: boolean, navigating: boolean) {
  const bg = navigating ? '#F59E0B' : selected ? '#0EA572' : '#34D399'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px;height:32px;
        background:${bg};
        border:2px dashed white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 12px rgba(16,185,129,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:12px">♻</span>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

function createTrashIcon(selected: boolean, navigating: boolean) {
  const bg = navigating ? '#F59E0B' : selected ? '#DC2626' : '#F59E0B'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:34px;height:34px;
        background:${bg};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 14px rgba(245,158,11,0.5);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:13px">🗑</span>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  })
}

const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:-8px;background:rgba(16,185,129,0.25);border-radius:50%;animation:pulse-ring 2s ease-in-out infinite"></div>
      <div style="width:20px;height:20px;background:#10B981;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(16,185,129,0.3)"></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function MapController({
  center,
  flyToTarget,
  isNavigating,
}: {
  center: [number, number]
  flyToTarget: { lat: number; lng: number } | null
  isNavigating: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (isNavigating) return
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map, isNavigating])

  useEffect(() => {
    if (isNavigating || !flyToTarget) return
    map.flyTo([flyToTarget.lat, flyToTarget.lng], 16, { duration: 0.8 })
  }, [flyToTarget, map, isNavigating])

  return null
}

type BindyMapProps = {
  userPosition: [number, number]
  communityTrash: CommunityReport[]
  communityBins: CommunityReport[]
  showSeedBins?: boolean
  selectedBinId: string | null
  selectedReportId: string | null
  navigationTargetId: string | null
  route: RouteResult | null
  isNavigating: boolean
  onSelectSeedBin: (bin: RecyclingBin) => void
  onSelectReport: (report: CommunityReport) => void
  hiddenItemIds?: Set<string>
  mapStyle?: 'positron' | 'voyager'
}

export type MapStyle = 'positron' | 'voyager'

const CARTO_KEY = 'cb1_4vg7_1_bd20dcd09a3632fe1b5facb3'

const STYLE_URLS: Record<MapStyle, string> = {
  positron: `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
  voyager: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
}

export function BindyMap({
  userPosition,
  communityTrash,
  communityBins,
  showSeedBins = true,
  selectedBinId,
  selectedReportId,
  navigationTargetId,
  route,
  isNavigating,
  onSelectSeedBin,
  onSelectReport,
  hiddenItemIds,
  mapStyle = 'positron',
}: BindyMapProps) {
  const seedBins = useMemo(() => {
    return SEED_BINS.filter((bin) => !hiddenItemIds?.has(bin.id))
      .map((bin) => ({
      ...bin,
      distanceM: Math.round(haversineKm(userPosition[0], userPosition[1], bin.lat, bin.lng) * 1000),
    }))
  }, [userPosition, hiddenItemIds])

  const flyToTarget = useMemo(() => {
    if (selectedReportId) {
      const r = [...communityTrash, ...communityBins].find((x) => x.id === selectedReportId)
      if (r) return { lat: r.lat, lng: r.lng }
    }
    if (selectedBinId) {
      const b = SEED_BINS.find((x) => x.id === selectedBinId)
      if (b) return { lat: b.lat, lng: b.lng }
    }
    return null
  }, [selectedBinId, selectedReportId, communityTrash, communityBins])

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={userPosition}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          key={mapStyle}
          url={STYLE_URLS[mapStyle] || STYLE_URLS.positron}
          maxZoom={20}
        />
        <MapController center={userPosition} flyToTarget={flyToTarget} isNavigating={isNavigating} />
        <RouteLayer route={route} />
        <RouteFitBounds route={isNavigating ? route : null} />
        <NavigationFollow userPosition={userPosition} active={isNavigating} />
        <Marker position={userPosition} icon={userIcon} zIndexOffset={1000} />

        {showSeedBins &&
          seedBins.map((bin) => (
            <Marker
              key={bin.id}
              position={[bin.lat, bin.lng]}
              icon={createBinIcon(
                bin.id === selectedBinId,
                bin.id === navigationTargetId && isNavigating,
              )}
              eventHandlers={{ click: () => onSelectSeedBin(bin) }}
            />
          ))}

        {communityBins.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={createCommunityBinIcon(
              report.id === selectedReportId,
              report.id === navigationTargetId && isNavigating,
            )}
            zIndexOffset={400}
            eventHandlers={{ click: () => onSelectReport(report) }}
          />
        ))}

        {communityTrash.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={createTrashIcon(
              report.id === selectedReportId,
              report.id === navigationTargetId && isNavigating,
            )}
            zIndexOffset={450}
            eventHandlers={{ click: () => onSelectReport(report) }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
