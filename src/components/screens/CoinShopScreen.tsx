import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Ticket } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { SHOP_PRODUCTS } from '../../data/shop'

export function CoinShopScreen() {
  const { state, redeemProduct } = useApp()
  const [couponModal, setCouponModal] = useState<{ brand: string; code: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRedeem = (productId: string, brand: string) => {
    setError(null)
    const result = redeemProduct(productId)
    if (result.ok) {
      setCouponModal({ brand, code: result.code })
    } else {
      setError(result.reason)
    }
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
        <p className="mt-2 text-xs text-gray-500">
          Trash +5 ball · Bin +6 ball · Do‘konlarda chegirma oling
        </p>
      </div>

      {error && (
        <p className="mx-5 mb-2 rounded-2xl bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {SHOP_PRODUCTS.map((product, i) => {
          const owned = state.profile.redeemedCoupons.some((c) => c.productId === product.id)
          const canAfford = state.profile.points >= product.pointsCost

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
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {product.brand}
                    </p>
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
                      disabled={owned || !canAfford}
                      onClick={() => handleRedeem(product.id, product.brand)}
                      className="rounded-2xl bg-bindy-charcoal px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {owned ? 'Olingan' : 'Olish'}
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
