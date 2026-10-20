'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  KnowledgePageWithRelations,
  KnowledgeCategory,
} from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Plus,
  BookOpen,
  Calendar,
  User,
  Tag as TagIcon,
  Folder,
  Layers,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'
import { KNOWLEDGE_CATEGORY_MAP } from '@/components/knowledge/KnowledgePage'
import { DecisionsList } from './DecisionsList'

interface KnowledgeListClientProps {
  initialPages: KnowledgePageWithRelations[]
  canWrite: boolean
}

export function KnowledgeListClient({
  initialPages,
  canWrite,
}: KnowledgeListClientProps) {
  const router = useRouter()
  const [pages] = useState<KnowledgePageWithRelations[]>(initialPages)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [search, setSearch] = useState('')

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pages.length }
    pages.forEach((p) => {
      const cat = p.category || 'procedures'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [pages])

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = page.category || 'procedures'
        if (cat !== selectedCategory) return false
      }

      // Status filter
      if (statusFilter !== 'all' && page.status !== statusFilter) {
        return false
      }

      // Search
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchesTitle = page.title.toLowerCase().includes(query)
        const matchesTags = page.tags?.some((t) => t.toLowerCase().includes(query))
        const matchesContent = page.content?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesTags && !matchesContent) return false
      }

      return true
    })
  }, [pages, selectedCategory, statusFilter, search])

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Base de Conocimiento
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manuales operativos, guías comerciales, especificaciones de producto y decisiones clave.
          </p>
        </div>

        {canWrite && (
          <Link href="/knowledge/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
              <Plus className="w-4 h-4" />
              Nueva página
            </Button>
          </Link>
        )}
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
              Categorías
            </h3>

            <nav className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Todas las categorías
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {categoryCounts.all || 0}
                </span>
              </button>

              {Object.entries(KNOWLEDGE_CATEGORY_MAP).map(([key, val]) => {
                const count = categoryCounts[key] || 0
                const isSelected = selectedCategory === key

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{val.label}</span>
                    </span>
                    {count > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-4">
          {selectedCategory === 'decisions' ? (
            <DecisionsList canWrite={canWrite} />
          ) : (
            <>
              {/* Search & Status Filters */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar artículos o etiquetas..."
                className="pl-9 bg-gray-50/50 border-gray-200 text-sm"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto self-stretch sm:self-auto justify-center">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'published'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Publicadas
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'draft'
                    ? 'bg-white text-amber-700 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Borradores
              </button>
            </div>
          </div>

          {/* List of Pages */}
          {filteredPages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                No se encontraron artículos
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {search || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'Intenta ajustar los filtros o el término de búsqueda.'
                  : 'Crea el primer documento o guía de referencia para tu equipo.'}
              </p>
              {canWrite && (
                <Link href="/knowledge/new" className="inline-block mt-4">
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Crear primera página
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPages.map((p) => {
                const catInfo = p.category
                  ? KNOWLEDGE_CATEGORY_MAP[p.category] ||
                    KNOWLEDGE_CATEGORY_MAP.procedures
                  : KNOWLEDGE_CATEGORY_MAP.procedures

                return (
                  <Link
                    key={p.id}
                    href={`/knowledge/${p.id}`}
                    className="block group"
                  >
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catInfo.badge}`}
                          >
                            {catInfo.label}
                          </span>

                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                              p.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {p.status === 'published' ? 'Publicada' : 'Borrador'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {p.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1 text-gray-600 font-medium">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {p.author?.full_name || 'Equipo'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Actualizado {formatDate(p.updated_at)}
                          </span>

                          {p.tags && p.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 ml-1">
                              <TagIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-500 truncate max-w-xs">
                                {p.tags.map((t) => `#${t}`).join(' ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
