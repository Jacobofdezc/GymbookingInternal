'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Gimnasios', href: '/gyms', icon: Building2 },
      { label: 'Pipeline Comercial', href: '/pipeline', icon: KanbanSquare },
      { label: 'Calendario', href: '/calendar', icon: Calendar },
    ],
  },
  {
    title: 'Gestión Comercial',
    items: [
      { label: 'Tareas y Recordatorios', href: '/tasks', icon: CheckSquare },
      { label: 'Interacciones', href: '/interactions', icon: MessageSquare },
      { label: 'Documentos y Archivos', href: '/documents', icon: FileText },
    ],
  },
  {
    title: 'Operaciones y Soporte',
    items: [
      { label: 'Onboarding & Clases', href: '/operations', icon: Settings2 },
      { label: 'Incidencias', href: '/issues', icon: AlertTriangle },
      { label: 'Base de Conocimiento', href: '/knowledge', icon: BookOpen },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Equipo', href: '/team', icon: Users },
      { label: 'Configuración', href: '/settings', icon: Settings },
    ],
  },
]

export const NAVIGATION_ITEMS: NavItem[] = NAVIGATION_SECTIONS.flatMap(
  (sec) => sec.items
)

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
      await fetch('/api/auth/demo-session', { method: 'DELETE' }).catch(() => {})
      const supabase = createClient()
      await supabase.auth.signOut().catch(() => {})
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
    <aside className="flex h-full w-64 flex-col bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.png"
            alt="Gymbooking Logo"
            width={130}
            height={26}
            className="h-6.5 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="Gymbooking Logo"
            width={130}
            height={26}
            className="h-6.5 w-auto hidden dark:block"
            priority
          />
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 uppercase tracking-wider">
            CRM
          </span>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
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
                      'group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold shadow-2xs border border-blue-200/50 dark:border-blue-800/50'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex items-center justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <AvatarImage
                  src={userProfile?.avatar_url || ''}
                  alt={userProfile?.full_name || 'Avatar'}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                  {getInitials(userProfile?.full_name, userProfile?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Usuario'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
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
            className="h-8 w-8 shrink-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer rounded-xl"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
