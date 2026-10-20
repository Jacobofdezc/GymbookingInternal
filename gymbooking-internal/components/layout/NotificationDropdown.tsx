'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Building2,
  CheckSquare,
  MessageSquare,
  Clock,
  Check,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeDate } from '@/lib/utils'
import type { Notification } from '@/types/database'

export function NotificationDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      const items = data || []
      setNotifications(items)
      setUnreadCount(items.filter((n) => !n.is_read).length)
    } catch (err) {
      console.error('Error in fetchNotifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking notifications read:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    try {
      if (!notif.is_read) {
        const supabase = createClient()
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notif.id)

        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      setIsOpen(false)

      // Route mapping
      if (notif.entity_type === 'gym' && notif.entity_id) {
        router.push(`/gyms/${notif.entity_id}`)
      } else if (notif.entity_type === 'task') {
        router.push('/tasks')
      } else if (notif.entity_type === 'issue') {
        router.push('/issues')
      } else if (notif.entity_type === 'interaction') {
        router.push('/interactions')
      }
    } catch (err) {
      console.error('Error handling notification click:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent_issue':
      case 'issue_created':
        return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
      case 'task_assigned':
      case 'task_due':
        return <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />
      case 'gym_confirmed':
      case 'gym_active':
        return <Building2 className="h-4 w-4 text-emerald-500 shrink-0" />
      case 'interaction_reminder':
        return <MessageSquare className="h-4 w-4 text-amber-500 shrink-0" />
      default:
        return <Bell className="h-4 w-4 text-blue-500 shrink-0" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors"
          aria-label="Ver notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 ring-2 ring-white" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 sm:w-96 p-0 rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden" align="end" forceMount>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900">Notificaciones</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 font-bold px-2 py-0">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Check className="h-3 w-3" />
              Marcar leídas
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-slate-400 px-4">
              <Bell className="h-7 w-7 mx-auto mb-2 opacity-30 stroke-1 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600">Sin notificaciones pendientes</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Te avisaremos sobre nuevas tareas, leads e incidencias en tiempo real.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-3 p-3.5 text-xs cursor-pointer transition-colors ${
                  !notif.is_read
                    ? 'bg-blue-50/40 hover:bg-blue-50/80'
                    : 'hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-xl bg-slate-100 border border-slate-200/50">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`font-bold truncate ${!notif.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 ring-2 ring-blue-100" />
                    )}
                  </div>
                  {notif.message && (
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                    <Clock className="h-2.5 w-2.5" />
                    {formatRelativeDate(notif.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/60">
          <button
            onClick={() => {
              setIsOpen(false)
              router.push('/tasks')
            }}
            className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold cursor-pointer transition-colors"
          >
            Ver mis tareas asignadas →
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
