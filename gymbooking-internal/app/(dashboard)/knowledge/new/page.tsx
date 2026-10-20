'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  KnowledgeCategory,
  KnowledgeStatus,
} from '@/types/database'
import { createKnowledgePage } from '@/services/knowledge/knowledge.service'
import { KnowledgeEditor } from '@/components/knowledge/KnowledgeEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Check,
  Globe,
  FileEdit,
  Loader2,
  AlertCircle,
  Tag as TagIcon,
} from 'lucide-react'
import { KNOWLEDGE_CATEGORY_MAP } from '@/components/knowledge/KnowledgePage'
import { createClient } from '@/lib/supabase/client'

export default function NewKnowledgePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<KnowledgeCategory>('procedures')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSave = async (status: KnowledgeStatus) => {
    if (!title.trim()) {
      setError('Por favor, indica un título para la página')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let orgId = 'a0000000-0000-4000-8000-000000000001'
      const authorId = user?.id || '86513161-6e70-41d3-affc-08d1ed12fc7d'

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.organization_id) {
          orgId = profile.organization_id
        }
      }

      const newPage = await createKnowledgePage({
        organization_id: orgId,
        title: title.trim(),
        category,
        content: content.trim() || null,
        tags,
        status,
        author_id: authorId,
        created_by: authorId,
      })

      router.push(`/knowledge/${newPage.id}`)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error al guardar la página'
      )
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la base de conocimiento
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={saving || !title.trim()}
            className="text-xs gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileEdit className="w-3.5 h-3.5" />
            )}
            Guardar borrador
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSave('published')}
            disabled={saving || !title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            Publicar artículo
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
            Título del artículo *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Protocolo de verificación de horarios y tarifas"
            className="text-xl sm:text-2xl font-bold h-12 border-gray-200 focus:border-blue-500"
            autoFocus
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
                {Object.entries(KNOWLEDGE_CATEGORY_MAP).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Etiquetas
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
                placeholder="Escribe y presiona Enter..."
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
                <TagIcon className="w-3 h-3 text-gray-400" />#{t}
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

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-2">
            Contenido
          </label>
          <KnowledgeEditor
            content={content}
            onChange={setContent}
            placeholder="Empieza a redactar la documentación, pasos, guías o decisiones aquí..."
          />
        </div>
      </div>
    </div>
  )
}
