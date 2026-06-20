import { LocateFixed } from 'lucide-react'

type MapControlsProps = {
  onLocate: () => void
  loading?: boolean
}

export function MapControls({ onLocate, loading }: MapControlsProps) {
  return (
    <div className="absolute right-4 top-[calc(max(0.75rem,env(safe-area-inset-top))+4.5rem)] z-[600]">
      <button
        type="button"
        onClick={onLocate}
        disabled={loading}
        aria-label="Center on my location"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft transition hover:bg-gray-50 active:scale-95 disabled:opacity-60"
      >
        <LocateFixed className={`h-5 w-5 text-bindy-mint ${loading ? 'animate-pulse' : ''}`} />
      </button>
    </div>
  )
}
