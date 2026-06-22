import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers } from 'lucide-react'

export type MapLayerFilter = {
  bin: boolean
  trash: boolean
}

type MapCategoryFilterProps = {
  filter: MapLayerFilter
  onChange: (next: MapLayerFilter) => void
}

export function MapCategoryFilter({ filter, onChange }: MapCategoryFilterProps) {
  const [open, setOpen] = useState(false)

  const toggle = (key: keyof MapLayerFilter) => {
    onChange({ ...filter, [key]: !filter[key] })
  }

  const activeCount = (filter.bin ? 1 : 0) + (filter.trash ? 1 : 0)

  return (
    <div className="absolute right-4 top-[calc(max(0.75rem,env(safe-area-inset-top))+8.5rem)] z-[600] flex flex-col items-end gap-2">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.95 }}
        aria-expanded={open}
        aria-label="Bin / Trash filter"
        className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft backdrop-blur-md transition ${
          open ? 'bg-bindy-mint text-white' : 'bg-white/95 text-bindy-text hover:bg-gray-50'
        }`}
      >
        <Layers className="h-5 w-5" strokeWidth={2} />
        {activeCount > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bindy-accent px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <FilterChip
              active={filter.bin}
              onClick={() => toggle('bin')}
              emoji="♻️"
              label="Bin"
              activeClass="border-bindy-mint bg-bindy-mint/10 text-bindy-mint"
            />
            <FilterChip
              active={filter.trash}
              onClick={() => toggle('trash')}
              emoji="🗑️"
              label="Trash"
              activeClass="border-bindy-accent bg-bindy-accent/10 text-bindy-accent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  emoji,
  label,
  activeClass,
}: {
  active: boolean
  onClick: () => void
  emoji: string
  label: string
  activeClass: string
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`flex min-w-[5.5rem] items-center gap-2 rounded-2xl border-2 bg-white/95 px-3 py-2.5 shadow-soft backdrop-blur-md transition ${
        active ? activeClass : 'border-transparent text-gray-400 opacity-70'
      }`}
      aria-pressed={active}
    >
      <span className="text-lg leading-none">{emoji}</span>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      <span
        className={`ml-auto flex h-4 w-4 items-center justify-center rounded-md border text-[10px] font-bold ${
          active ? 'border-current bg-current/20' : 'border-gray-300 bg-gray-50'
        }`}
      >
        {active ? '✓' : ''}
      </span>
    </motion.button>
  )
}
