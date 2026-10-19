'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  KnowledgeCategory,
  KnowledgeStatus,
  UserRole,
} from '@/types/database'
import {
  ExtendedKnowledgePage,
  updateKnowledgePage,
  deleteKnowledgePage,
} from '@/services/knowledge/knowledge.service'
import { KnowledgeEditor } from '@/components/knowledge/KnowledgeEditor'
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
  ArrowLeft,
  Edit3,
  Check,
  X,
  History,
  Trash2,
  Calendar,
  User,
  Globe,
  FileEdit,
  Tag as TagIcon,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react'

export const KNOWLEDGE_CATEGORY_MAP: Record<
  KnowledgeCategory,
  { label: string; badge: string }
> = {
  product: {
    label: 'Producto',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  sales: {
    label: 'Ventas y Comercial',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  operations: {
    label: 'Operaciones',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  technology: {
    label: 'Tecnología',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  marketing: {
    label: 'Marketing',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  administration: {
    label: 'Administración',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  decisions: {
    label: 'Decisiones',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  procedures: {
    label: 'Procedimientos',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
}

interface KnowledgePageProps {
  initialPage: ExtendedKnowledgePage
  userRole: UserRole
  currentUserId: string
  canWrite: boolean
}

export function KnowledgePage({
  initialPage,
  userRole,
  currentUserId,
  canWrite,
}: KnowledgePageProps) {
  const router = useRouter()
  const [page, setPage] = useState<ExtendedKnowledgePage>(initialPage)
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Edit states
  const [title, setTitle] = useState(initialPage.title)
  const [category, setCategory] = useState<KnowledgeCategory>(
    (initialPage.category as KnowledgeCategory) || 'procedures'
  )
  const [content, setContent] = useState(initialPage.content || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialPage.tags || [])

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = userRole === 'admin'

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSave = async (publishImmediate = false) => {
    if (!title.trim()) {
      setError('El título no puede estar vacío')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const nextStatus: KnowledgeStatus = publishImmediate
        ? 'published'
        : page.status

      const updated = await updateKnowledgePage(
        page.id,
        {
          title: title.trim(),
          category,
          content,
          tags,
          status: nextStatus,
        },
        currentUserId
      )

      setPage((prev) => ({
        ...prev,
        ...updated,
        history: prev.history,
      }))
      setIsEditing(false)
      router.refresh()
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error al guardar los cambios'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    if (!canWrite) return
    const nextStatus: KnowledgeStatus =
      page.status === 'published' ? 'draft' : 'published'

    setPublishing(true)
    setError(null)

    try {
      const updated = await updateKnowledgePage(
        page.id,
        { status: nextStatus },
        currentUserId
      )
      setPage((prev) => ({
        ...prev,
        status: updated.status,
      }))
      router.refresh()
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cambiar estado de publicación'
      )
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!isAdmin) return
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar permanentemente esta página?'
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteKnowledgePage(page.id)
      router.push('/knowledge')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la página')
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const catInfo = page.category
    ? KNOWLEDGE_CATEGORY_MAP[page.category] || KNOWLEDGE_CATEGORY_MAP.procedures
    : KNOWLEDGE_CATEGORY_MAP.procedures

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Navigation & Actions Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la base de conocimiento
        </Link>

        <div className="flex items-center gap-2">
          {page.history && page.history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              Historial ({page.history.length})
            </Button>
          )}

          {canWrite && !isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePublish}
                disabled={publishing}
                className="text-xs gap-1.5"
              >
                {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : page.status === 'published' ? (
                  <>
                    <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                    Pasar a borrador
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    Publicar
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </Button>
            </>
          )}

          {isAdmin && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
              title="Eliminar página"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* History Drawer/Panel */}
      {showHistory && page.history && page.history.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-gray-500" />
              Revisiones y cambios anteriores
            </h4>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cerrar
            </button>
          </div>
          <div className="divide-y divide-gray-200/70 max-h-48 overflow-y-auto">
            {page.history.map((h, i) => (
              <div
                key={h.id || i}
                className="py-2.5 flex items-center justify-between text-xs text-gray-600"
              >
                <div>
                  <span className="font-semibold text-gray-800">
                    {h.title || 'Revisión sin título'}
                  </span>
                  <p className="text-[11px] text-gray-400">
                    {formatDate(h.changed_at)}
                  </p>
                </div>
                <span className="text-[11px] text-gray-500">
                  {h.changed_by_user?.full_name || 'Usuario'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        {isEditing ? (
          /* EDITING STATE */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Editando artículo
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setTitle(page.title)
                    setCategory(
                      (page.category as KnowledgeCategory) || 'procedures'
                    )
                    setContent(page.content || '')
                    setTags(page.tags || [])
                  }}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>

            {/* Title & Category inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Título de la página *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Procedimiento de Onboarding para nuevos gimnasios"
                  className="text-lg font-semibold h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Categoría
                  </label>
                  <Select
                    value={category}
                    onValueChange={(val) => setCategory(val as KnowledgeCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(KNOWLEDGE_CATEGORY_MAP).map(
                        ([key, val]) => (
                          <SelectItem key={key} value={key}>
                            {val.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Etiquetas / Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      placeholder="Escribe etiqueta y pulsa Enter"
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      className="text-xs shrink-0"
                    >
                      Añadir
                    </Button>
                  </div>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 font-medium"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-gray-400 hover:text-gray-600 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Rich Editor */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Contenido del artículo
              </label>
              <KnowledgeEditor content={content} onChange={setContent} />
            </div>
          </div>
        ) : (
          /* VIEWING STATE */
          <div className="space-y-6">
            {/* Header info */}
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${catInfo.badge}`}
                >
                  {catInfo.label}
                </span>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                    page.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {page.status === 'published' ? 'Publicada' : 'Borrador'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {page.title}
              </h1>

              {/* Author & Date metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {page.author?.full_name || 'Equipo'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Actualizado {formatDate(page.updated_at)}
                </span>
              </div>

              {/* Tags */}
              {page.tags && page.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <TagIcon className="w-3 h-3 text-gray-400" />
                  {page.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Rendered HTML content */}
            <div className="prose prose-slate max-w-none text-gray-800 leading-relaxed min-h-[200px]">
              {page.content ? (
                <div
                  className="tiptap-content"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              ) : (
                <p className="text-gray-400 italic">
                  Esta página aún no tiene contenido redactado.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
