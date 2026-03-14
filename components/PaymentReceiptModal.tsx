'use client'

import { useEffect, useCallback } from 'react'
import { X, Download } from 'lucide-react'
import { formatCurrencyCLP, formatDateDDMMYYYY } from '@/lib/format'

function buildFilename(patente: string, fecha: string | Date) {
  const d = new Date(fecha)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const plate = patente.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SIN-PATENTE'
  return `${plate}-${dd}-${mm}-${yyyy}.jpg`
}

async function forceDownload(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

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
        className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 rounded-t-3xl border-b border-gray-200 dark:border-gray-700">
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5">
            <img
              src={comprobanteUrl}
              alt="Comprobante de pago"
              className="max-w-full object-contain mx-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
            />
            <button
              type="button"
              onClick={() => forceDownload(comprobanteUrl, buildFilename(patente, fecha))}
              className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar comprobante
            </button>
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
        </div>

        <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-gray-800 rounded-b-3xl border-t border-gray-200 dark:border-gray-700">
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
