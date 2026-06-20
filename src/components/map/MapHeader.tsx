import { useApp } from '../../context/AppContext'
import { BindyLogo } from '../brand/BindyLogo'

export function MapHeader() {
  const { state } = useApp()

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-center justify-between rounded-3xl bg-white/92 px-4 py-3 shadow-soft backdrop-blur-xl">
        <BindyLogo size="sm" />
        <div className="flex items-center gap-1.5 rounded-2xl bg-bindy-bg px-3.5 py-2 text-sm font-semibold text-bindy-text shadow-[inset_0_0_0_1px_rgba(31,41,55,0.06)]">
          <span aria-hidden="true">🌍</span>
          <span>{state.globalBinCount.toLocaleString()} bins</span>
        </div>
      </div>
    </header>
  )
}
