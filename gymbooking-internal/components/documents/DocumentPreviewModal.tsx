'use client'

import React, { useState, useEffect } from 'react'
import { DocumentWithRelations } from '@/types/database'
import { getSignedUrl } from '@/services/documents/document.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Loader2,
  Building2,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react'

interface DocumentPreviewModalProps {
  document: DocumentWithRelations | null
  isOpen: boolean
  onClose: () => void
}

export function DocumentPreviewModal({
  document: doc,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen || !doc) {
      setSignedUrl(null)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    getSignedUrl(doc.storage_path)
      .then((url) => {
        if (isMounted) {
          setSignedUrl(url)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo generar el enlace seguro de visualización'
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, doc])

  if (!isOpen || !doc) return null

  const ext = (doc.file_name || doc.name).split('.').pop()?.toLowerCase() || ''
  const isPdf =
    doc.content_type?.toLowerCase().includes('pdf') || ext === 'pdf'
  const isImage =
    doc.content_type?.toLowerCase().includes('image') ||
    ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)

  const handleCopyLink = () => {
    if (!signedUrl) return
    navigator.clipboard.writeText(signedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!signedUrl) return
    const a = window.document.createElement('a')
    a.href = signedUrl
    a.download = doc.file_name || doc.name
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
  }

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/75">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white rounded-lg border border-gray-200/80 shrink-0">
              {isPdf ? (
                <FileText className="w-5 h-5 text-rose-500" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5 text-purple-500" />
              ) : (
                <File className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate max-w-md sm:max-w-xl">
                {doc.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>{doc.file_name}</span>
                <span>•</span>
                <span>{formatBytes(doc.size_bytes)}</span>
                {doc.gym && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-700 font-medium">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      {doc.gym.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {signedUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="hidden sm:inline-flex gap-1.5 text-xs h-8"
                  title="Copiar enlace firmado (válido por 1 hora)"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Copiado' : 'Copiar enlace'}
                </Button>

                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir
                  </Button>
                </a>

                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </Button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-1"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview Canvas */}
        <div className="flex-1 bg-gray-100/70 overflow-hidden relative flex items-center justify-center">
          {loading && (
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">
                Generando enlace de acceso seguro...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-md bg-white p-6 rounded-2xl shadow-sm border border-red-200 text-center space-y-3 mx-4">
              <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
              <h4 className="font-bold text-gray-900 text-sm">
                Error al abrir el documento
              </h4>
              <p className="text-xs text-gray-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  getSignedUrl(doc.storage_path)
                    .then((url) => setSignedUrl(url))
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'Error')
                    )
                    .finally(() => setLoading(false))
                }}
                className="text-xs"
              >
                Reintentar
              </Button>
            </div>
          )}

          {signedUrl && !loading && isPdf && (
            <iframe
              src={`${signedUrl}#view=FitH`}
              title={doc.name}
              className="w-full h-full border-none bg-white"
            />
          )}

          {signedUrl && !loading && isImage && (
            <div className="w-full h-full p-4 overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={doc.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-gray-200 bg-white"
              />
            </div>
          )}

          {signedUrl && !loading && !isPdf && !isImage && (
            <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center space-y-4 mx-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">{doc.name}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Este formato no soporta vista previa directa en el navegador. Puedes descargarlo para abrirlo con la aplicación correspondiente.
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-left text-xs space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo:</span>
                  <span className="font-medium">{doc.content_type || ext.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tamaño:</span>
                  <span className="font-medium">{formatBytes(doc.size_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fecha de subida:</span>
                  <span className="font-medium">
                    {new Date(doc.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm shadow-sm"
              >
                <Download className="w-4 h-4" />
                Descargar archivo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
