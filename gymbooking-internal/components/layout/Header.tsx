'use client'

import React from 'react'
import Link from 'next/link'
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
      const supabase = createClient()
      await supabase.auth.signOut()
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 md:px-6 backdrop-blur-sm">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden text-gray-600 hover:text-gray-900"
          aria-label="Abrir navegación lateral"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex flex-col">
          <h1 className="text-base md:text-lg font-bold text-gray-900 tracking-tight leading-tight">
            {currentTitle}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-normal">
            <span>GymBooking</span>
            <span>/</span>
            <span className="capitalize text-gray-600">
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
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-300 hover:bg-gray-100 transition-colors w-56 justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <span>Buscar gimnasio, lead...</span>
            </div>
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 px-2 py-1.5 h-auto text-left hover:bg-gray-100 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-600"
            >
              <Avatar className="h-8 w-8 border border-gray-200">
                <AvatarImage
                  src={userProfile?.avatar_url || ''}
                  alt={userProfile?.full_name || 'Avatar'}
                />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                  {getInitials(userProfile?.full_name, userProfile?.email)}
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-900 leading-none">
                  {userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Usuario'}
                </span>
                <span className="text-[11px] text-gray-500 capitalize mt-0.5">
                  {roleLabel}
                </span>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-0.5 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-gray-900 leading-none">
                  {userProfile?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 leading-none truncate">
                  {userProfile?.email}
                </p>
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px] capitalize font-medium">
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/team" className="flex items-center cursor-pointer">
                  <Building className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Organización y Equipo</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/knowledge" className="flex items-center cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Ayuda & Documentación</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isSigningOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
