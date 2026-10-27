import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Ticket } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { SHOP_PRODUCTS } from '../../data/shop'

export function CoinShopScreen() {
  const { state } = useApp()
  const [notice, setNotice] = useState<string | null>(null)
  const [couponModal, setCouponModal] = useState<{ brand: string; code: string } | null>(null)

  const handleRedeem = (brand: string) => {
    setNotice(`«${brand}» hamkorlik chegirmasi tez kunda faollashadi. Ballaringiz hisobingizda saqlanib qoladi! ✨`)
    setTimeout(() => setNotice(null), 4000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bindy-bg">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-2xl font-bold text-bindy-text">Coin Shop</h1>
        <div className="mt-3 flex items-center gap-2 rounded-3xl bg-gradient-to-r from-bindy-mint to-[#059669] px-5 py-4 text-white shadow-soft">
          <Coins className="h-8 w-8 opacity-90" />
          <div>
            <p className="text-sm text-white/80">Sizning ballaringiz</p>
            <p className="text-3xl font-bold">{state.profile.points}</p>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
          🌱 <strong>Hamkorlik dasturi tez kunda!</strong> Siz to‘plagan ballar orqali kafelar va do‘konlarda chegirmalar olish imkoniyati ochiladi.
        </div>
      </div>

      {notice && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-2 rounded-2xl bg-bindy-mint/10 border border-bindy-mint/20 px-4 py-2.5 text-center text-xs font-semibold text-bindy-text"
        >
          {notice}
        </motion.p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {SHOP_PRODUCTS.map((product, i) => {
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-3xl bg-white shadow-soft"
            >
              <div className="flex">
                <div
                  className="flex w-24 shrink-0 flex-col items-center justify-center text-white"
                  style={{ backgroundColor: product.color }}
                >
                  <span className="text-3xl">{product.emoji}</span>
                  <span className="mt-1 text-lg font-bold">{product.discountPercent}%</span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {product.brand}
                      </p>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                        Tez kunda
                      </span>
                    </div>
                    <p className="font-bold text-bindy-text">{product.name}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{product.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-bold text-bindy-mint">
                      <Coins className="h-4 w-4" />
                      {product.pointsCost} ball
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRedeem(product.brand)}
                      className="rounded-2xl bg-bindy-charcoal/80 hover:bg-bindy-charcoal px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
                    >
                      Batafsil
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}

        {state.profile.redeemedCoupons.length > 0 && (
          <div className="pt-2">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Mening kuponlarim
            </h2>
            {state.profile.redeemedCoupons.map((c) => {
              const product = SHOP_PRODUCTS.find((p) => p.id === c.productId)
              return (
                <div
                  key={c.code}
                  className="mb-2 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-soft"
                >
                  <Ticket className="h-5 w-5 text-bindy-accent" />
                  <div className="flex-1">
                    <p className="font-semibold text-bindy-text">{product?.brand}</p>
                    <p className="font-mono text-sm text-bindy-mint">{c.code}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {couponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center"
          >
            <p className="text-4xl">🎉</p>
            <h3 className="mt-3 text-xl font-bold text-bindy-text">{couponModal.brand}</h3>
            <p className="mt-2 text-sm text-gray-500">Kupon kodingiz:</p>
            <p className="mt-2 rounded-2xl bg-bindy-bg py-3 font-mono text-lg font-bold text-bindy-mint">
              {couponModal.code}
            </p>
            <button
              type="button"
              onClick={() => setCouponModal(null)}
              className="mt-5 w-full rounded-3xl bg-bindy-mint py-3 font-semibold text-white"
            >
              Yopish
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
