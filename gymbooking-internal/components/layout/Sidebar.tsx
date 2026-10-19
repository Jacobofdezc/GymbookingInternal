'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  KanbanSquare,
  CheckSquare,
  Calendar,
  MessageSquare,
  FileText,
  Settings2,
  AlertTriangle,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Activity,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/permissions'
import type { Profile } from '@/types/database'

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Gimnasios', href: '/gyms', icon: Building2 },
  { label: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { label: 'Tareas', href: '/tasks', icon: CheckSquare },
  { label: 'Calendario', href: '/calendar', icon: Calendar },
  { label: 'Interacciones', href: '/interactions', icon: MessageSquare },
  { label: 'Documentos', href: '/documents', icon: FileText },
  { label: 'Operaciones', href: '/operations', icon: Settings2 },
  { label: 'Incidencias', href: '/issues', icon: AlertTriangle },
  { label: 'Base de conocimiento', href: '/knowledge', icon: BookOpen },
  { label: 'Equipo', href: '/team', icon: Users },
  { label: 'Configuración', href: '/settings', icon: Settings },
]

interface SidebarProps {
  userProfile?: Profile | null
  onCloseMobile?: () => void
}

export function Sidebar({ userProfile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Error signing out:', err)
      setIsLoggingOut(false)
    }
  }

  // Get user initials for avatar fallback
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'GB'
  }

  const roleLabel = userProfile?.role
    ? ROLE_LABELS[userProfile.role as UserRole] || userProfile.role
    : 'Miembro'

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-gray-200 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-gray-900 leading-none">
                GymBooking
              </span>
              <Badge
                variant="info"
                className="text-[10px] px-1.5 py-0 font-medium bg-blue-50 text-blue-700 border-blue-200"
              >
                Internal
              </Badge>
            </div>
            <span className="text-[11px] text-gray-400 font-normal mt-0.5">
              Panel de Gestión
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-gray-400 hover:text-gray-700"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Navegación
        </div>

        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <span>{item.label}</span>
              </div>

              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-gray-100 p-3 bg-gray-50/50">
        <div className="flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-white hover:shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarImage
                src={userProfile?.avatar_url || ''}
                alt={userProfile?.full_name || 'Avatar'}
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                {getInitials(userProfile?.full_name, userProfile?.email)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900 leading-tight">
                {userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Usuario'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="truncate text-[11px] text-gray-500 capitalize">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            title="Cerrar sesión"
            className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
