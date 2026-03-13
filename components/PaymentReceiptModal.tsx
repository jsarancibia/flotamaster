'use client'

import { useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { formatCurrencyCLP, formatDateDDMMYYYY } from '@/lib/format'

export default function PaymentReceiptModal({
  open,
  onClose,
  comprobanteUrl,
  chofer,
  patente,
  fecha,
  monto,
}: {
  open: boolean
  onClose: () => void
  comprobanteUrl: string
  chofer: string
  patente: string
  fecha: string | Date
  monto: number
}) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Comprobante de pago"
        className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">COMPROBANTE DE PAGO</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-5">
          <img
            src={comprobanteUrl}
            alt="Comprobante de pago"
            className="max-h-[70vh] object-contain mx-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          />
          <a
            href={comprobanteUrl}
            download="comprobante.jpg"
            className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar comprobante
          </a>
        </div>

        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
          <div>
            <span className="font-semibold">Chofer:</span> {chofer}
          </div>
          <div>
            <span className="font-semibold">Vehículo:</span> {patente}
          </div>
          <div>
            <span className="font-semibold">Fecha:</span> {formatDateDDMMYYYY(fecha)}
          </div>
          <div>
            <span className="font-semibold">Monto:</span> {formatCurrencyCLP(monto)}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
