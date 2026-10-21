'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Download,
  Upload,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { StatusBadge } from './StatusBadge'
import { GymImportModal } from './GymImportModal'
import { getGyms, deleteGym, type GymListItem, type GymFilters } from '@/services/gyms/gym.service'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { CommercialStatus, OnboardingStatus, Profile, GymPriority } from '@/types/database'

const QUICK_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'new_contacts', label: 'Nuevos contactos' },
  { id: 'pending_response', label: 'Pendientes respuesta' },
  { id: 'interested', label: 'Interesados' },
  { id: 'confirmed', label: 'Confirmados' },
  { id: 'onboarding_pending', label: 'En incorporación' },
  { id: 'active', label: 'Activos' },
  { id: 'overdue_followup', label: 'Seguimiento vencido' },
]

export function GymListClient() {
  const router = useRouter()
  const [gyms, setGyms] = useState<GymListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string>('viewer')

  // Filter options
  const [commercialStatuses, setCommercialStatuses] = useState<CommercialStatus[]>([])
  const [onboardingStatuses, setOnboardingStatuses] = useState<OnboardingStatus[]>([])
  const [owners, setOwners] = useState<Profile[]>([])
  const [cities, setCities] = useState<string[]>([])

  // Active filters
  const [search, setSearch] = useState('')
  const [quickTab, setQuickTab] = useState('all')
  const [commercialStatusId, setCommercialStatusId] = useState('all')
  const [onboardingStatusId, setOnboardingStatusId] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<GymPriority | 'all'>('all')
  const [ownerFilter, setOwnerFilter] = useState('all')

  // Sorting & Pagination
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortAsc, setSortAsc] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const pageSize = 15

  // Delete dialog state
  const [gymToDelete, setGymToDelete] = useState<GymListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Load current user profile & filter dropdown options
  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile) setCurrentUserRole(profile.role)
      }

      const [commRes, onbRes, profRes, gymsCityRes] = await Promise.all([
        supabase.from('commercial_statuses').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('onboarding_statuses').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('profiles').select('*').eq('is_active', true).order('full_name'),
        supabase.from('gyms').select('city').not('city', 'is', null),
      ])

      if (commRes.data) setCommercialStatuses(commRes.data)
      if (onbRes.data) setOnboardingStatuses(onbRes.data)
      if (profRes.data) setOwners(profRes.data)

      if (gymsCityRes.data) {
        const uniqueCities = Array.from(
          new Set(gymsCityRes.data.map((g) => g.city?.trim()).filter(Boolean))
        ).sort() as string[]
        setCities(uniqueCities)
      }
    }

    loadInitialData()
  }, [])

  // Load gyms list
  const fetchGyms = async () => {
    setLoading(true)
    try {
      const filters: GymFilters = {
        search: search.trim() || undefined,
        quickFilter: quickTab,
        commercial_status_id: commercialStatusId,
        onboarding_status_id: onboardingStatusId,
        city: cityFilter,
        priority: priorityFilter,
        owner_id: ownerFilter,
        sortBy: sortField,
        sortAsc: sortAsc,
      }
      const data = await getGyms(filters)
      setGyms(data)
    } catch (err) {
      console.error('Error fetching gyms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGyms()
  }, [
    search,
    quickTab,
    commercialStatusId,
    onboardingStatusId,
    cityFilter,
    priorityFilter,
    ownerFilter,
    sortField,
    sortAsc,
  ])

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
    setPage(1)
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setQuickTab('all')
    setCommercialStatusId('all')
    setOnboardingStatusId('all')
    setCityFilter('all')
    setPriorityFilter('all')
    setOwnerFilter('all')
    setPage(1)
  }

  const hasActiveFilters =
    search !== '' ||
    commercialStatusId !== 'all' ||
    onboardingStatusId !== 'all' ||
    cityFilter !== 'all' ||
    priorityFilter !== 'all' ||
    ownerFilter !== 'all'

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(gyms.length / pageSize))
  const paginatedGyms = useMemo(() => {
    const start = (page - 1) * pageSize
    return gyms.slice(start, start + pageSize)
  }, [gyms, page, pageSize])

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!gymToDelete) return
    setDeleting(true)
    try {
      await deleteGym(gymToDelete.id)
      setGymToDelete(null)
      fetchGyms()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el gimnasio')
    } finally {
      setDeleting(false)
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    if (gyms.length === 0) return

    const headers = [
      'Nombre',
      'Razón Social',
      'Ciudad',
      'Dirección',
      'Teléfono',
      'Email',
      'Estado Comercial',
      'Estado Onboarding',
      'Prioridad',
      'Responsable',
      'Último Contacto',
      'Próximo Seguimiento',
      'Próxima Acción',
    ]

    const rows = gyms.map((g) => [
      `"${g.name || ''}"`,
      `"${g.legal_name || ''}"`,
      `"${g.city || ''}"`,
      `"${g.address || ''}"`,
      `"${g.phone || ''}"`,
      `"${g.email || ''}"`,
      `"${g.commercial_status?.name || ''}"`,
      `"${g.onboarding_status?.name || ''}"`,
      `"${g.priority || ''}"`,
      `"${g.owner?.full_name || ''}"`,
      `"${g.last_contact_date || ''}"`,
      `"${g.next_followup_date || ''}"`,
      `"${(g.next_action || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gimnasios_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-2xs shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Gimnasios</h1>
              <Badge variant="secondary" className="font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200/60 rounded-full px-2.5 py-0.5">
                {gyms.length} {gyms.length === 1 ? 'centro' : 'centros'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Directorio y gestión del ciclo de vida comercial y operativo de los centros asociados.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer rounded-xl border-slate-200/90 shadow-2xs hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Importar CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={gyms.length === 0}
            className="flex items-center gap-1.5 cursor-pointer rounded-xl border-slate-200/90 shadow-2xs hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </Button>

          <Button asChild size="sm" className="flex items-center gap-1.5 rounded-xl shadow-xs font-semibold">
            <Link href="/gyms/new">
              <Plus className="h-4 w-4" />
              <span>Nuevo Gimnasio</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto shadow-2xs">
        {QUICK_TABS.map((tab) => {
          const isActive = quickTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setQuickTab(tab.id)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-2xs border border-slate-200/70 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nombre, ciudad..."
              className="pl-9 rounded-xl border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 text-xs h-9 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Commercial status select */}
          <div>
            <select
              value={commercialStatusId}
              onChange={(e) => {
                setCommercialStatusId(e.target.value)
                setPage(1)
              }}
              className="flex h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-colors focus-visible:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Estado comercial...</option>
              {commercialStatuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Onboarding status select */}
          <div>
            <select
              value={onboardingStatusId}
              onChange={(e) => {
                setOnboardingStatusId(e.target.value)
                setPage(1)
              }}
              className="flex h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-colors focus-visible:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Onboarding...</option>
              {onboardingStatuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* City select */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value)
                setPage(1)
              }}
              className="flex h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-colors focus-visible:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Owner select */}
          <div>
            <select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value)
                setPage(1)
              }}
              className="flex h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-colors focus-visible:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Responsable...</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
            <span>Filtros avanzados activos</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer font-semibold"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Gyms Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1.5">
                  <span>Nombre & Ciudad</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </TableHead>
              <TableHead className="font-bold text-slate-600 dark:text-slate-400">Estado Comercial</TableHead>
              <TableHead className="font-bold text-slate-600 dark:text-slate-400">Onboarding</TableHead>
              <TableHead
                className="cursor-pointer font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center space-x-1.5">
                  <span>Prioridad</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </TableHead>
              <TableHead className="font-bold text-slate-600 dark:text-slate-400">Responsable</TableHead>
              <TableHead
                className="cursor-pointer font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('last_contact_date')}
              >
                <div className="flex items-center space-x-1.5">
                  <span>Último Contacto</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('next_followup_date')}
              >
                <div className="flex items-center space-x-1.5">
                  <span>Próximo Seguimiento</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </TableHead>
              <TableHead className="text-right font-bold text-slate-600 dark:text-slate-400">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="py-4">
                    <div className="flex items-center space-x-4 animate-pulse">
                      <div className="h-4 w-48 bg-slate-100 rounded-md" />
                      <div className="h-4 w-24 bg-slate-100 rounded-md" />
                      <div className="h-4 w-24 bg-slate-100 rounded-md" />
                      <div className="h-4 w-16 bg-slate-100 rounded-md" />
                      <div className="h-4 w-32 bg-slate-100 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedGyms.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="mx-auto max-w-sm space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/80 text-slate-500 shadow-2xs">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900">No se encontraron gimnasios</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {hasActiveFilters
                          ? 'No hay centros que coincidan con los filtros aplicados.'
                          : 'Aún no se ha registrado ningún centro en la plataforma.'}
                      </p>
                    </div>
                    {hasActiveFilters ? (
                      <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl font-semibold">
                        Restablecer filtros
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="rounded-xl font-semibold">
                        <Link href="/gyms/new">Crear primer gimnasio</Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedGyms.map((gym) => {
                const isOverdue =
                  gym.next_followup_date && gym.next_followup_date < today

                return (
                  <TableRow
                    key={gym.id}
                    onClick={() => router.push(`/gyms/${gym.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60 group"
                  >
                    {/* Name + City */}
                    <TableCell>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {gym.name}
                        </span>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {gym.city && <span>{gym.city}</span>}
                          {gym.phone && <span>• {gym.phone}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Commercial Status */}
                    <TableCell>
                      <StatusBadge
                        status={gym.commercial_status}
                        type="commercial"
                        size="sm"
                      />
                    </TableCell>

                    {/* Onboarding Status */}
                    <TableCell>
                      <StatusBadge
                        status={gym.onboarding_status}
                        type="onboarding"
                        size="sm"
                      />
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <StatusBadge
                        status={gym.priority}
                        type="priority"
                        size="sm"
                      />
                    </TableCell>

                    {/* Owner */}
                    <TableCell>
                      {gym.owner ? (
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-center font-bold text-2xs">
                            {gym.owner.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[120px] font-medium text-slate-700 dark:text-slate-300">{gym.owner.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </TableCell>

                    {/* Last contact */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {gym.last_contact_date ? formatDate(gym.last_contact_date) : '—'}
                    </TableCell>

                    {/* Next followup */}
                    <TableCell>
                      {gym.next_followup_date ? (
                        <div
                          className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                            isOverdue
                              ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/60 shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70 text-slate-400" />
                          <span>{formatDate(gym.next_followup_date)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer"
                          asChild
                          title="Ver detalle"
                        >
                          <Link href={`/gyms/${gym.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          asChild
                          title="Editar"
                        >
                          <Link href={`/gyms/${gym.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>

                        {currentUserRole === 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                            onClick={() => setGymToDelete(gym)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination bar */}
        {!loading && gyms.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div>
              Mostrando{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(page - 1) * pageSize + 1}
              </span>{' '}
              a{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(page * pageSize, gyms.length)}
              </span>{' '}
              de <span className="font-bold text-slate-800 dark:text-slate-200">{gyms.length}</span> gimnasios
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs font-semibold"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Anterior</span>
              </Button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                Pág. {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs font-semibold"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <span className="sr-only sm:not-sr-only sm:mr-1">Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!gymToDelete} onOpenChange={(open) => !open && setGymToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Gimnasio</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente a{' '}
              <strong className="text-foreground">{gymToDelete?.name}</strong>? Se eliminarán
              también sus contactos, interacciones y clases vinculadas. Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGymToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <GymImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={fetchGyms}
      />
    </div>
  )
}
