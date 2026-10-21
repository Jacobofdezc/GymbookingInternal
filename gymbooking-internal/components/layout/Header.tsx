'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Building,
  HelpCircle,
} from 'lucide-react'
import { NotificationDropdown } from './NotificationDropdown'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/permissions'
import type { Profile } from '@/types/database'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Principal',
  '/gyms': 'Directorio de Gimnasios',
  '/pipeline': 'Embudo de Ventas & Pipeline',
  '/tasks': 'Gestión de Tareas',
  '/calendar': 'Calendario Operativo',
  '/interactions': 'Historial de Interacciones',
  '/documents': 'Gestión Documental',
  '/operations': 'Operaciones e Integraciones',
  '/issues': 'Gestión de Incidencias',
  '/knowledge': 'Base de Conocimiento',
  '/team': 'Gestión de Equipo',
  '/settings': 'Configuración de la Plataforma',
}

interface HeaderProps {
  userProfile?: Profile | null
  onOpenMobileMenu?: () => void
}

export function Header({ userProfile, onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  // Find matching title based on current path
  const currentTitle =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([key]) => key !== '/dashboard' && pathname.startsWith(key))?.[1] ||
    'GymBooking Internal'

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await fetch('/api/auth/demo-session', { method: 'DELETE' }).catch(() => {})
      const supabase = createClient()
      await supabase.auth.signOut().catch(() => {})
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Error signing out:', err)
      setIsSigningOut(false)
    }
  }

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 md:px-6 backdrop-blur-md transition-colors shadow-2xs">
      {/* Left side: Mobile Toggle, Brand Logo & Page Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          aria-label="Abrir navegación lateral"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Brand Logo in Header */}
        <Link
          href="/dashboard"
          className="flex items-center hover:opacity-90 transition-opacity mr-1 sm:mr-2 shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Gymbooking Logo"
            width={125}
            height={26}
            className="h-6 sm:h-6.5 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="Gymbooking Logo"
            width={125}
            height={26}
            className="h-6 sm:h-6.5 w-auto hidden dark:block"
            priority
          />
        </Link>

        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex flex-col">
          <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {currentTitle}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 font-normal">
            <span>GymBooking</span>
            <span>/</span>
            <span className="capitalize text-slate-700 dark:text-slate-300 font-semibold">
              {pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Search, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button (Desktop) */}
        <div className="hidden lg:flex items-center">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all w-56 justify-between cursor-pointer shadow-2xs font-medium"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
              <span>Buscar gimnasio, lead...</span>
            </div>
            <kbd className="rounded-md bg-white dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 px-2.5 py-1.5 h-auto text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus-visible:ring-1 focus-visible:ring-blue-600 transition-colors cursor-pointer"
            >
              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <AvatarImage
                  src={userProfile?.avatar_url || ''}
                  alt={userProfile?.full_name || 'Avatar'}
                />
                <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                  {getInitials(userProfile?.full_name, userProfile?.email)}
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Usuario'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize mt-0.5 font-medium">
                  {roleLabel}
                </span>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl" align="end" forceMount>
            <DropdownMenuLabel className="font-normal px-2.5 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {userProfile?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-none truncate">
                  {userProfile?.email}
                </p>
                <div className="pt-1.5">
                  <Badge variant="secondary" className="text-[10px] capitalize font-semibold px-2 py-0.5">
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

            <DropdownMenuGroup className="space-y-0.5">
              <DropdownMenuItem asChild className="rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800">
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4 text-slate-400" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800">
                <Link href="/team" className="flex items-center">
                  <Building className="mr-2 h-4 w-4 text-slate-400" />
                  <span>Organización y Equipo</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800">
                <Link href="/knowledge" className="flex items-center">
                  <HelpCircle className="mr-2 h-4 w-4 text-slate-400" />
                  <span>Ayuda & Documentación</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-xl px-2.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/50 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4 text-rose-500" />
              <span>{isSigningOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
