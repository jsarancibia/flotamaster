'use client'

import { X } from 'lucide-react'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirming,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>

        <div className="flex gap-3 pt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={!!confirming}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl disabled:opacity-50"
          >
            {cancelLabel || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!!confirming}
            className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {confirming ? 'Eliminando...' : (confirmLabel || 'Eliminar')}
          </button>
        </div>
      </div>
    </div>
  )
}
