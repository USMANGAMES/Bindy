import { Camera } from 'lucide-react'

type CameraFabProps = {
  onClick: () => void
  disabled?: boolean
}

export function CameraFab({ onClick, disabled }: CameraFabProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[700] flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Take a photo of a bin"
        className="pointer-events-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-bindy-mint text-white shadow-fab transition-all duration-300 hover:scale-105 hover:bg-[#0ea572] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
      >
        <Camera className="h-7 w-7" strokeWidth={2.25} />
      </button>
    </div>
  )
}
