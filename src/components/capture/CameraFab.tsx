import { Camera } from 'lucide-react'

type CameraNavButtonProps = {
  onClick: () => void
  disabled?: boolean
}

export function CameraNavButton({ onClick, disabled }: CameraNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Rasmga olish"
      className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-bindy-mint text-white shadow-fab transition-all duration-300 hover:scale-105 hover:bg-[#0ea572] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
    >
      <Camera className="h-7 w-7" strokeWidth={2.25} />
    </button>
  )
}
