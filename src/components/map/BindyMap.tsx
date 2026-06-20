import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { RecyclingBin } from '../../types'
import { SEED_BINS } from '../../data/bins'
import 'leaflet/dist/leaflet.css'

function createBinIcon(selected: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;height:36px;
        background:${selected ? '#F59E0B' : '#10B981'};
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
  selectedId,
}: {
  center: [number, number]
  selectedId: string | null
}) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])

  useEffect(() => {
    if (!selectedId) return
    const bin = SEED_BINS.find((b) => b.id === selectedId)
    if (bin) map.flyTo([bin.lat, bin.lng], 16, { duration: 0.8 })
  }, [selectedId, map])

  return null
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type BindyMapProps = {
  userPosition: [number, number]
  selectedBinId: string | null
  onSelectBin: (bin: RecyclingBin) => void
}

export function BindyMap({ userPosition, selectedBinId, onSelectBin }: BindyMapProps) {
  const binsWithDistance = useMemo(() => {
    return SEED_BINS.map((bin) => ({
      ...bin,
      distance: haversine(userPosition[0], userPosition[1], bin.lat, bin.lng),
    })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  }, [userPosition])

  const nearbyCount = binsWithDistance.filter((b) => (b.distance ?? 99) < 0.5).length

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
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        <MapController center={userPosition} selectedId={selectedBinId} />
        <Marker position={userPosition} icon={userIcon} />
        {binsWithDistance.map((bin) => (
          <Marker
            key={bin.id}
            position={[bin.lat, bin.lng]}
            icon={createBinIcon(bin.id === selectedBinId)}
            eventHandlers={{ click: () => onSelectBin(bin) }}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-28 left-4 right-4 z-[500]">
        <div className="pointer-events-auto rounded-3xl bg-white/90 p-4 shadow-soft backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-bindy-mint">Nearby</p>
          <p className="mt-0.5 text-sm font-bold text-bindy-text">
            {nearbyCount || binsWithDistance.length} recycling bins within 500m
          </p>
        </div>
      </div>
    </div>
  )
}
