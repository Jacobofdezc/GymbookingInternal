'use client'

import * as React from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NotificationState {
  type: 'success' | 'error'
  message: string
}

interface NotificationAlertProps {
  notification: NotificationState | null
  onClose?: () => void
}

export function NotificationAlert({ notification, onClose }: NotificationAlertProps) {
  React.useEffect(() => {
    if (!notification || !onClose) return
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [notification, onClose])

  if (!notification) return null

  const isSuccess = notification.type === 'success'

  return (
    <div
      role="alert"
      className={cn(
        'relative mb-4 flex items-center gap-3 rounded-lg border p-4 text-sm shadow-sm transition-all animate-in fade-in-50 slide-in-from-top-2',
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200'
          : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200'
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      )}
      <div className="flex-1 font-medium">{notification.message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      )}
    </div>
  )
}
