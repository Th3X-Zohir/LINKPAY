'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e2e8f0',
          color: '#1e293b',
        },
        className: 'font-sans',
      }}
      closeButton
      richColors
    />
  )
}