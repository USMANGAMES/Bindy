import { Check, Sparkles, X } from 'lucide-react'
import { SwipeableBottomSheet } from './SwipeableBottomSheet'

export type MapStyle = 'voyager' | 'positron' | 'osm'

type MapStyleSheetProps = {
  open: boolean
  onClose: () => void
  currentStyle: MapStyle
  onSelectStyle: (style: MapStyle) => void
}

const STYLES: Array<{
  id: MapStyle
  title: string
  desc: string
  recommended?: boolean
  previewBg: string
  emoji: string
}> = [
  {
    id: 'voyager',
    title: 'Voyager (Asl nusxa)',
    desc: 'Yumshoq ranglar, yashil parklar va go‘zal shahar ko‘rinishi',
    recommended: true,
    previewBg: 'bg-emerald-50 border-emerald-200',
    emoji: '🏙️',
  },
  {
    id: 'positron',
    title: 'Positron (Och rang)',
    desc: 'Minimalistik oq-kulrang uslub, yuqori kontrast',
    previewBg: 'bg-slate-50 border-slate-200',
    emoji: '⚪',
  },
  {
    id: 'osm',
    title: 'OpenStreetMap',
    desc: 'Standart batafsil jahon kartografiyasi',
    previewBg: 'bg-amber-50 border-amber-200',
    emoji: '🗺️',
  },
]

export function MapStyleSheet({
  open,
  onClose,
  currentStyle,
  onSelectStyle,
}: MapStyleSheetProps) {
  return (
    <SwipeableBottomSheet open={open} onClose={onClose}>
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="text-lg font-bold text-bindy-text">Xarita uslubi</h2>
          <p className="text-xs text-gray-500">O‘zingizga yoqqan xarita ko‘rinishini tanlang</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 space-y-2.5">
        {STYLES.map((st) => {
          const isSelected = currentStyle === st.id
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                onSelectStyle(st.id)
                onClose()
              }}
              className={`flex w-full items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition active:scale-[0.99] ${
                isSelected
                  ? 'border-bindy-mint bg-emerald-50/50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl border ${st.previewBg}`}
              >
                {st.emoji}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-bindy-text text-sm">{st.title}</span>
                  {st.recommended && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <Sparkles className="h-2.5 w-2.5" /> Tavsiya
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{st.desc}</p>
              </div>

              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? 'border-bindy-mint bg-bindy-mint text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>
          )
        })}
      </div>
    </SwipeableBottomSheet>
  )
}
