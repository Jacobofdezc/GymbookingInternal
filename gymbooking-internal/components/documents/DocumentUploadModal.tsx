'use client'

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadDocument } from '@/services/documents/document.service'
import type {
  DocumentCategory,
  DocumentVisibility,
  Document,
} from '@/types/database'
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react'

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'agreements', label: 'Acuerdo / Contrato' },
  { value: 'commercial_proposals', label: 'Propuesta comercial' },
  { value: 'gym_info', label: 'Información del gimnasio' },
  { value: 'schedules', label: 'Horarios y tarifas' },
  { value: 'onboarding_material', label: 'Material de onboarding' },
  { value: 'invoices', label: 'Facturas / Liquidaciones' },
  { value: 'other', label: 'Otro documento' },
]

export const DOCUMENT_VISIBILITIES: { value: DocumentVisibility; label: string }[] = [
  { value: 'all', label: 'Visible para todo el equipo' },
  { value: 'commercial', label: 'Comercial y Administradores' },
  { value: 'operations', label: 'Operaciones y Administradores' },
  { value: 'admin_only', label: 'Solo Administradores' },
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newDoc: Document) => void
  userOrgId: string
  currentUserId: string
  gyms?: { id: string; name: string }[]
  defaultGymId?: string
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  onSuccess,
  userOrgId,
  currentUserId,
  gyms = [],
  defaultGymId,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('other')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<DocumentVisibility>('all')
  const [gymId, setGymId] = useState<string>(defaultGymId || 'none')
  const [dragActive, setDragActive] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setFile(null)
    setName('')
    setCategory('other')
    setDescription('')
    setVisibility('all')
    setGymId(defaultGymId || 'none')
    setError(null)
    setUploading(false)
    setProgress(0)
    setSuccess(false)
  }

  const handleFileSelect = (selectedFile: File) => {
    setError(null)
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('El archivo supera el tamaño máximo permitido de 50 MB')
      return
    }

    setFile(selectedFile)
    // Auto-fill name if not filled or default
    if (!name.trim()) {
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
      setName(fileNameWithoutExt)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Por favor, selecciona un archivo')
      return
    }
    if (!name.trim()) {
      setError('El nombre del documento es obligatorio')
      return
    }
    if (!userOrgId) {
      setError('Error de sesión: no se encontró la organización')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(25)

    try {
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev))
      }, 300)

      const doc = await uploadDocument(file, {
        organization_id: userOrgId,
        name: name.trim(),
        category,
        description: description.trim() || null,
        visibility,
        gym_id: gymId !== 'none' ? gymId : null,
        owner_id: currentUserId,
        storage_path: '', // will be set in service
        file_name: file.name,
      })

      clearInterval(timer)
      setProgress(100)
      setSuccess(true)

      setTimeout(() => {
        onSuccess(doc)
        onOpenChange(false)
        resetForm()
      }, 600)
    } catch (err: unknown) {
      setProgress(0)
      setUploading(false)
      const message =
        err instanceof Error ? err.message : 'Error desconocido al subir el documento'
      setError(message)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!uploading) {
          onOpenChange(next)
          if (!next) resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            Subir nuevo documento
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-slate-400">
            Archivos adjuntos para gestión interna, acuerdos o información de gimnasios (máx. 50 MB).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : file
                ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/30'
                : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0])
                }
              }}
            />

            {file ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="p-1 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Arrastra tu archivo aquí o haz clic para explorar
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  PDF, DOCX, XLSX, PNG, JPG hasta 50 MB
                </p>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="doc-name" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Nombre del documento *
              </Label>
              <Input
                id="doc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Contrato Marco - Basic Fit Chamberí"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="doc-category" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Categoría
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as DocumentCategory)}
                >
                  <SelectTrigger id="doc-category" className="mt-1">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="doc-visibility" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Visibilidad
                </Label>
                <Select
                  value={visibility}
                  onValueChange={(val) => setVisibility(val as DocumentVisibility)}
                >
                  <SelectTrigger id="doc-visibility" className="mt-1">
                    <SelectValue placeholder="Visibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_VISIBILITIES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="doc-gym" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Vincular a gimnasio (opcional)
              </Label>
              <Select value={gymId} onValueChange={setGymId}>
                <SelectTrigger id="doc-gym" className="mt-1">
                  <SelectValue placeholder="Ninguno / General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin gimnasio vinculado</SelectItem>
                  {gyms.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="doc-desc" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Descripción / Notas adicionales
              </Label>
              <Textarea
                id="doc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles sobre el contenido del documento o acuerdos particulares..."
                className="mt-1 resize-none h-20 text-sm"
              />
            </div>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-slate-400">
                <span>Subiendo archivo...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>¡Documento subido con éxito!</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!file || !name.trim() || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Subir documento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
