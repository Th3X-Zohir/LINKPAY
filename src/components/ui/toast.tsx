'use client'
import { useState, useEffect, useCallback } from 'react'

interface ToastProps { id: string; title: string; description?: string; variant?: 'default' | 'success' | 'error'; duration?: number }

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), toast.duration || 5000)
  }, [])
  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), [])
  return { toasts, addToast, removeToast }
}

export function Toast({ toast, onClose }: { toast: ToastProps; onClose: () => void }) {
  useEffect(() => { const timer = setTimeout(onClose, toast.duration || 5000); return () => clearTimeout(timer) }, [toast, onClose])
  const bgColor = { default: 'bg-gray-900', success: 'bg-green-600', error: 'bg-red-600' }[toast.variant || 'default']
  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3`}>
      <div className="flex-1"><p className="font-medium">{toast.title}</p>{toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}</div>
      <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
    </div>
  )
}
