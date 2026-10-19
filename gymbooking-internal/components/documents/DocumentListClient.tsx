'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  DocumentWithRelations,
  DocumentCategory,
  DocumentVisibility,
  UserRole,
} from '@/types/database'
import {
  deleteDocument,
  getSignedUrl,
} from '@/services/documents/document.service'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  Plus,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Building2,
  Calendar,
  Lock,
  User,
  Loader2,
  FolderOpen,
} from 'lucide-react'

const CATEGORY_MAP: Record<DocumentCategory, { label: string; badgeClass: string }> = {
  agreements: {
    label: 'Acuerdo / Contrato',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  commercial_proposals: {
    label: 'Propuesta comercial',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  gym_info: {
    label: 'Info gimnasio',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  schedules: {
    label: 'Horarios y tarifas',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  onboarding_material: {
    label: 'Onboarding',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  invoices: {
    label: 'Facturas',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  other: {
    label: 'Otro',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
  },
}

const VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  all: 'Público',
  commercial: 'Comercial',
  operations: 'Operaciones',
  admin_only: 'Admin',
}

interface DocumentListClientProps {
  initialDocuments: DocumentWithRelations[]
  userRole: UserRole
  userOrgId: string
  currentUserId: string
  gyms: { id: string; name: string }[]
}

export function DocumentListClient({
  initialDocuments,
  userRole,
  userOrgId,
  currentUserId,
  gyms,
}: DocumentListClientProps) {
  const [documents, setDocuments] = useState<DocumentWithRelations[]>(initialDocuments)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [gymFilter, setGymFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isAdmin = userRole === 'admin'

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchesName = doc.name.toLowerCase().includes(query)
        const matchesFile = doc.file_name.toLowerCase().includes(query)
        const matchesGym = doc.gym?.name.toLowerCase().includes(query)
        if (!matchesName && !matchesFile && !matchesGym) return false
      }

      // Category filter
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) {
        return false
      }

      // Gym filter
      if (gymFilter !== 'all') {
        if (gymFilter === 'none') {
          if (doc.gym_id) return false
        } else if (doc.gym_id !== gymFilter) {
          return false
        }
      }

      // Visibility filter
      if (visibilityFilter !== 'all' && doc.visibility !== visibilityFilter) {
        return false
      }

      return true
    })
  }, [documents, search, categoryFilter, gymFilter, visibilityFilter])

  const handleDownload = async (doc: DocumentWithRelations) => {
    try {
      setDownloadingId(doc.id)
      const signedUrl = await getSignedUrl(doc.storage_path)

      // Open signed url in new window or download
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = doc.file_name || doc.name
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : 'Error al generar enlace de descarga'
      )
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (doc: DocumentWithRelations) => {
    if (!isAdmin) return
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el documento "${doc.name}"?`
    )
    if (!confirmed) return

    try {
      setDeletingId(doc.id)
      await deleteDocument(doc.id, doc.storage_path)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : 'Error al eliminar el documento'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const getFileIcon = (fileName: string, contentType: string | null) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (contentType?.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-rose-500" />
    }
    if (
      contentType?.includes('image') ||
      ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)
    ) {
      return <ImageIcon className="w-5 h-5 text-purple-500" />
    }
    if (
      contentType?.includes('sheet') ||
      contentType?.includes('excel') ||
      ['xls', 'xlsx', 'csv'].includes(ext)
    ) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
    }
    return <File className="w-5 h-5 text-blue-500" />
  }

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Documentos y Archivos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión centralizada de contratos, tarifas, propuestas comerciales y archivos adjuntos.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Subir documento
        </Button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, archivo o gimnasio..."
              className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="text-sm bg-gray-50/50">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="agreements">Acuerdos / Contratos</SelectItem>
              <SelectItem value="commercial_proposals">Propuestas comerciales</SelectItem>
              <SelectItem value="gym_info">Info gimnasio</SelectItem>
              <SelectItem value="schedules">Horarios y tarifas</SelectItem>
              <SelectItem value="onboarding_material">Onboarding</SelectItem>
              <SelectItem value="invoices">Facturas</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>

          {/* Gym Filter */}
          <Select value={gymFilter} onValueChange={setGymFilter}>
            <SelectTrigger className="text-sm bg-gray-50/50">
              <SelectValue placeholder="Todos los gimnasios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los gimnasios</SelectItem>
              <SelectItem value="none">Sin gimnasio vinculado</SelectItem>
              {gyms.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Visibility Filter */}
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="text-sm bg-gray-50/50">
              <SelectValue placeholder="Cualquier visibilidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda visibilidad</SelectItem>
              <SelectItem value="all">Público</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="operations">Operaciones</SelectItem>
              <SelectItem value="admin_only">Solo Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View toggles and count */}
        <div className="flex items-center justify-between pt-1 text-xs text-gray-500 border-t border-gray-100">
          <span>
            Mostrando <strong className="text-gray-900">{filteredDocuments.length}</strong> de {documents.length} documentos
          </span>

          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Vista en cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Vista en lista"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents Render */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            No se encontraron documentos
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {search || categoryFilter !== 'all' || gymFilter !== 'all'
              ? 'Prueba a cambiar los filtros de búsqueda para ver más resultados.'
              : 'Empieza subiendo el primer acuerdo, propuesta o documento de la organización.'}
          </p>
          <Button
            onClick={() => setIsUploadOpen(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Subir documento ahora
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const catInfo = doc.category
              ? CATEGORY_MAP[doc.category] || CATEGORY_MAP.other
              : CATEGORY_MAP.other

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-blue-50/50 transition-colors shrink-0">
                      {getFileIcon(doc.file_name, doc.content_type)}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${catInfo.badgeClass}`}
                      >
                        {catInfo.label}
                      </span>
                      {doc.visibility !== 'all' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          {VISIBILITY_LABELS[doc.visibility]}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3
                    className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors"
                    title={doc.name}
                  >
                    {doc.name}
                  </h3>

                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {doc.gym && (
                    <div className="mt-3">
                      <Link
                        href={`/gyms/${doc.gym_id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50/60 hover:bg-blue-50 px-2 py-1 rounded-md"
                      >
                        <Building2 className="w-3 h-3" />
                        <span className="truncate max-w-[180px]">{doc.gym.name}</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-gray-500">
                      <User className="w-3 h-3" />
                      {doc.owner?.full_name || 'Equipo'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {formatDate(doc.created_at)} • {formatBytes(doc.size_bytes)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Descargar archivo"
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>

                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar documento"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Gimnasio</th>
                  <th className="px-4 py-3">Subido por</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tamaño</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => {
                  const catInfo = doc.category
                    ? CATEGORY_MAP[doc.category] || CATEGORY_MAP.other
                    : CATEGORY_MAP.other

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-50 shrink-0">
                            {getFileIcon(doc.file_name, doc.content_type)}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block max-w-xs truncate">
                              {doc.name}
                            </span>
                            <span className="text-xs text-gray-400 block truncate max-w-xs">
                              {doc.file_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-md border ${catInfo.badgeClass}`}
                        >
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {doc.gym ? (
                          <Link
                            href={`/gyms/${doc.gym_id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                          >
                            <Building2 className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">
                              {doc.gym.name}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {doc.owner?.full_name || 'Equipo'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatBytes(doc.size_bytes)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Descargar"
                          >
                            {downloadingId === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(doc)}
                              disabled={deletingId === doc.id}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Eliminar"
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={(newDoc) => {
          setDocuments((prev) => [newDoc as DocumentWithRelations, ...prev])
        }}
        userOrgId={userOrgId}
        currentUserId={currentUserId}
        gyms={gyms}
      />
    </div>
  )
}
