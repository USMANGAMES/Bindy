import { BRANDING } from '../../config/branding'

type BindyLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  textClassName?: string
}

const SIZES = {
  sm: { img: 'h-8 w-8', text: 'text-lg' },
  md: { img: 'h-10 w-10', text: 'text-xl' },
  lg: { img: 'h-20 w-20', text: 'text-4xl' },
  xl: { img: 'h-28 w-28', text: 'text-5xl' },
}

export function BindyLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = 'text-bindy-text',
}: BindyLogoProps) {
  const s = SIZES[size]

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={BRANDING.logoSrc}
        alt={BRANDING.appName}
        className={`${s.img} shrink-0 rounded-2xl object-cover shadow-sm`}
      />
      {showText && (
        <span className={`${s.text} font-bold tracking-tight ${textClassName}`}>
          {BRANDING.appName}
          <span className="text-bindy-mint">.</span>
        </span>
      )}
    </div>
  )
}

export function BindyLogoMark({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <img
      src={BRANDING.logoSrc}
      alt={BRANDING.appName}
      className={`${className} rounded-[2rem] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.15)]`}
    />
  )
}
