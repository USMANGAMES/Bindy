import { Layers, LocateFixed } from 'lucide-react'

type MapControlsProps = {
  onLocate: () => void
  loading?: boolean
  onOpenStyles?: () => void
}

export function MapControls({ onLocate, loading, onOpenStyles }: MapControlsProps) {
  return (
    <div className="absolute right-4 top-[calc(max(0.75rem,env(safe-area-inset-top))+4.5rem)] z-[600] flex flex-col gap-2.5">
      <button
        type="button"
        onClick={onLocate}
        disabled={loading}
        aria-label="Center on my location"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft transition hover:bg-gray-50 active:scale-95 disabled:opacity-60"
      >
        <LocateFixed className={`h-5 w-5 text-bindy-mint ${loading ? 'animate-pulse' : ''}`} />
      </button>

      {onOpenStyles && (
        <button
          type="button"
          onClick={onOpenStyles}
          aria-label="Xarita uslubini tanlash"
          title="Xarita uslubi"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft transition hover:bg-gray-50 active:scale-95 text-gray-700"
        >
          <Layers className="h-5 w-5 text-gray-700" />
        </button>
      )}
    </div>
  )
}
