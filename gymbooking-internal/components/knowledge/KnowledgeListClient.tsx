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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Base de Conocimiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manuales operativos, guías comerciales, especificaciones de producto y decisiones clave.
          </p>
        </div>

        {canWrite && (
          <Link href="/knowledge/new">
            <Button className="rounded-xl shadow-xs font-bold gap-2">
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
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-2">
              Categorías
            </h3>

            <nav className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/60 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  Todas las categorías
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/60 dark:border-blue-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{val.label}</span>
                    </span>
                    {count > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
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
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar artículos o etiquetas..."
                    className="pl-9 bg-slate-50/50 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-700 text-xs rounded-xl focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs w-full sm:w-auto self-stretch sm:self-auto justify-center">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/70 dark:border-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'published'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs border border-emerald-200/70 dark:border-emerald-800'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Publicadas
                  </button>
                  <button
                    onClick={() => setStatusFilter('draft')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'draft'
                        ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs border border-amber-200/70 dark:border-amber-800'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Borradores
                  </button>
                </div>
              </div>

              {/* List of Pages */}
              {filteredPages.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-2xs">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-200/60 dark:border-blue-800 shadow-2xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    No se encontraron artículos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-sm mx-auto">
                    {search || selectedCategory !== 'all' || statusFilter !== 'all'
                      ? 'Intenta ajustar los filtros o el término de búsqueda.'
                      : 'Crea el primer documento o guía de referencia para tu equipo.'}
                  </p>
                  {canWrite && (
                    <Link href="/knowledge/new" className="inline-block mt-4">
                      <Button variant="outline" className="gap-2 rounded-xl font-bold">
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
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {p.status === 'published' ? 'Publicada' : 'Borrador'}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {p.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                {p.author?.full_name || 'Equipo'}
                              </span>
                              <span className="flex items-center gap-1 font-medium text-slate-400 dark:text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                                Actualizado {formatDate(p.updated_at)}
                              </span>

                              {p.tags && p.tags.length > 0 && (
                                <div className="flex items-center gap-1.5 ml-1">
                                  <TagIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                  <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">
                                    {p.tags.map((t) => `#${t}`).join(' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-end">
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors">
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
