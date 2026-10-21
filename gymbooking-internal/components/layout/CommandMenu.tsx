'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Building2,
  CheckSquare,
  AlertTriangle,
  KanbanSquare,
  Calendar,
  MessageSquare,
  FileText,
  Settings2,
  BookOpen,
  Users,
  Settings,
  Shield,
  Sparkles,
  Plus,
  ArrowRight,
  Loader2,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchItem {
  id: string
  title: string
  subtitle?: string
  category: 'Navegación' | 'Gimnasios' | 'Tareas' | 'Incidencias' | 'Acciones'
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
}

const STATIC_ACTIONS: SearchItem[] = [
  {
    id: 'nav-dashboard',
    title: 'Dashboard Principal',
    subtitle: 'Métricas, KPIs y resumen operativo',
    category: 'Navegación',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'nav-gyms',
    title: 'Directorio de Gimnasios',
    subtitle: 'Lista completa de centros deportivos asociados',
    category: 'Navegación',
    icon: Building2,
    href: '/gyms',
  },
  {
    id: 'nav-pipeline',
    title: 'Pipeline Comercial (Kanban)',
    subtitle: 'Gestión visual del embudo de ventas',
    category: 'Navegación',
    icon: KanbanSquare,
    href: '/pipeline',
  },
  {
    id: 'action-new-gym',
    title: 'Crear Nuevo Gimnasio',
    subtitle: 'Dar de alta un nuevo lead o centro deportivo',
    category: 'Acciones',
    icon: Plus,
    href: '/gyms/new',
    badge: 'Nuevo',
  },
  {
    id: 'action-seed-demo',
    title: 'Cargar Datos de Demostración (Demo Data)',
    subtitle: 'Poblar el CRM con 6 gimnasios, contactos, tareas e incidencias',
    category: 'Acciones',
    icon: Sparkles,
    href: '/dashboard',
    badge: 'Demo',
  },
  {
    id: 'nav-tasks',
    title: 'Gestión de Tareas',
    subtitle: 'Listado de tareas operativas y comerciales',
    category: 'Navegación',
    icon: CheckSquare,
    href: '/tasks',
  },
  {
    id: 'nav-calendar',
    title: 'Calendario',
    subtitle: 'Seguimientos, reuniones y vencimientos',
    category: 'Navegación',
    icon: Calendar,
    href: '/calendar',
  },
  {
    id: 'nav-interactions',
    title: 'Interacciones',
    subtitle: 'Historial de llamadas, emails y visitas',
    category: 'Navegación',
    icon: MessageSquare,
    href: '/interactions',
  },
  {
    id: 'nav-operations',
    title: 'Operaciones e Incorporación',
    subtitle: 'Checklist de onboarding y catálogo de clases',
    category: 'Navegación',
    icon: Settings2,
    href: '/operations',
  },
  {
    id: 'nav-issues',
    title: 'Gestión de Incidencias',
    subtitle: 'Tickets de soporte, incidencias y resolución',
    category: 'Navegación',
    icon: AlertTriangle,
    href: '/issues',
  },
  {
    id: 'nav-knowledge',
    title: 'Base de Conocimiento',
    subtitle: 'Documentación técnica, guías y procesos',
    category: 'Navegación',
    icon: BookOpen,
    href: '/knowledge',
  },
  {
    id: 'nav-documents',
    title: 'Gestión Documental',
    subtitle: 'Contratos, propuestas y archivos privados',
    category: 'Navegación',
    icon: FileText,
    href: '/documents',
  },
  {
    id: 'nav-team',
    title: 'Gestión de Equipo',
    subtitle: 'Miembros de la organización e invitaciones',
    category: 'Navegación',
    icon: Users,
    href: '/team',
  },
  {
    id: 'nav-settings',
    title: 'Configuración',
    subtitle: 'Estados comerciales, disciplinas y ajustes globales',
    category: 'Navegación',
    icon: Settings,
    href: '/settings',
  },
  {
    id: 'nav-audit-logs',
    title: 'Registro de Auditoría y Trazabilidad',
    subtitle: 'Historial de cambios, eventos de usuarios y auditoría',
    category: 'Navegación',
    icon: Shield,
    href: '/settings',
  },
]

export function CommandMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dbResults, setDbResults] = useState<SearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for ⌘K or Ctrl+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    const handleCustomOpen = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-menu', handleCustomOpen)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-menu', handleCustomOpen)
    }
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Perform live database search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setDbResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const supabase = createClient()
        const searchTerm = query.trim()

        const [gymsRes, tasksRes, issuesRes] = await Promise.all([
          supabase
            .from('gyms')
            .select('id, name, city, commercial_status:commercial_statuses(name)')
            .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
            .limit(5),
          supabase
            .from('tasks')
            .select('id, title, priority, status')
            .ilike('title', `%${searchTerm}%`)
            .limit(4),
          supabase
            .from('issues')
            .select('id, title, priority, status')
            .ilike('title', `%${searchTerm}%`)
            .limit(4),
        ])

        const items: SearchItem[] = []

        // Gyms
        if (gymsRes.data) {
          gymsRes.data.forEach((g: any) => {
            items.push({
              id: `gym-${g.id}`,
              title: g.name,
              subtitle: g.city ? `Ciudad: ${g.city}` : 'Gimnasio',
              category: 'Gimnasios',
              icon: Building2,
              href: `/gyms/${g.id}`,
              badge: g.commercial_status?.name,
            })
          })
        }

        // Tasks
        if (tasksRes.data) {
          tasksRes.data.forEach((t: any) => {
            items.push({
              id: `task-${t.id}`,
              title: t.title,
              subtitle: `Tarea • Estado: ${t.status}`,
              category: 'Tareas',
              icon: CheckSquare,
              href: `/tasks`,
              badge: t.priority,
            })
          })
        }

        // Issues
        if (issuesRes.data) {
          issuesRes.data.forEach((iss: any) => {
            items.push({
              id: `issue-${iss.id}`,
              title: iss.title,
              subtitle: `[#${iss.id.slice(0, 8).toUpperCase()}] Incidencia • Estado: ${iss.status}`,
              category: 'Incidencias',
              icon: AlertTriangle,
              href: `/issues`,
              badge: iss.priority,
            })
          })
        }

        setDbResults(items)
      } catch (err) {
        console.error('Error in command search:', err)
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Filter static actions by query
  const filteredStatic = STATIC_ACTIONS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
  )

  // Combined results
  const allResults = [...dbResults, ...filteredStatic]

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false)
    router.push(item.href)
  }

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = allResults[selectedIndex]
      if (selected) handleSelect(selected)
    }
  }

  if (!isOpen) return null

  // Group by category
  const groupedCategories: Record<string, SearchItem[]> = {}
  allResults.forEach((item) => {
    if (!groupedCategories[item.category]) {
      groupedCategories[item.category] = []
    }
    groupedCategories[item.category].push(item)
  })

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar gimnasios, tareas, incidencias o comandos..."
            className="w-full py-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {isSearching && <Loader2 className="h-4 w-4 text-blue-600 animate-spin mr-2 shrink-0" />}
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="ml-2 hidden sm:inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30 stroke-1" />
              <p className="text-sm font-medium">No se encontraron resultados para &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Prueba buscando por nombre de gimnasio, ciudad o módulo.
              </p>
            </div>
          ) : (
            Object.entries(groupedCategories).map(([category, items]) => (
              <div key={category} className="py-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const currentIdx = flatIndex++
                    const isSelected = currentIdx === selectedIndex
                    const Icon = item.icon

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(currentIdx)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{item.subtitle}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {item.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.badge}
                            </span>
                          )}
                          <ArrowRight
                            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                              isSelected ? 'translate-x-0.5 text-blue-600 dark:text-blue-400' : 'opacity-0'
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] text-slate-600 dark:text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] text-slate-600 dark:text-slate-300">↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] text-slate-600 dark:text-slate-300">↵</kbd>
              Seleccionar
            </span>
          </div>
          <span>GymBooking Internal CRM</span>
        </div>
      </div>
    </div>
  )
}
