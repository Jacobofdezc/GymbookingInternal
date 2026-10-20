'use client'

import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { importGymsBatch, type GymCSVRow, type GymImportResult } from '@/services/gyms/gym.service'
import type { GymPriority } from '@/types/database'

interface GymImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const TEMPLATE_HEADERS = [
  'name',
  'legal_name',
  'city',
  'address',
  'postal_code',
  'phone',
  'email',
  'website',
  'priority',
  'contact_name',
  'contact_role',
  'contact_phone',
  'contact_email',
]

const SAMPLE_CSV = `name,legal_name,city,address,postal_code,phone,email,website,priority,contact_name,contact_role,contact_phone,contact_email
Club Deportivo Retiro,Club Retiro SL,Madrid,Calle Alcalá 120,28009,912345678,info@clubretiro.com,https://clubretiro.com,high,Carlos Martínez,Director Deportivo,600111222,carlos@clubretiro.com
CrossFit Castellana,CrossFit Castellana SL,Madrid,Paseo de la Castellana 85,28046,913456789,contacto@cfcastellana.es,,urgent,Laura Gómez,Gerente,600333444,laura@cfcastellana.es
Pilates Studio Chamberí,Pilates Chamberí CB,Madrid,Calle Santa Engracia 45,28010,914567890,chamberi@pilates.es,,medium,Marta Ruiz,Propietaria,600555666,marta@pilates.es`

export function GymImportModal({ open, onOpenChange, onSuccess }: GymImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<GymCSVRow[]>([])
  const [parsingErrors, setParsingErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<GymImportResult | null>(null)

  const resetState = () => {
    setFile(null)
    setParsedRows([])
    setParsingErrors([])
    setIsImporting(false)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'plantilla_importacion_gimnasios.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setImportResult(null)
    setParsingErrors([])

    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9_]/g, '_'),
      complete: (results) => {
        const rows: GymCSVRow[] = []
        const errors: string[] = []

        results.data.forEach((row, idx) => {
          const rowNum = idx + 2 // considering header line 1

          // Try alias resolutions for headers
          const name = row['name'] || row['nombre'] || row['gimnasio'] || row['centro']
          if (!name || !name.trim()) {
            errors.push(`Fila ${rowNum}: El campo 'nombre' (name) es obligatorio.`)
            return
          }

          const rawPriority = (row['priority'] || row['prioridad'] || 'medium').toLowerCase()
          let priority: GymPriority = 'medium'
          if (['low', 'baja'].includes(rawPriority)) priority = 'low'
          if (['high', 'alta'].includes(rawPriority)) priority = 'high'
          if (['urgent', 'urgente'].includes(rawPriority)) priority = 'urgent'

          rows.push({
            name: name.trim(),
            legal_name: (row['legal_name'] || row['razon_social'] || '').trim() || undefined,
            city: (row['city'] || row['ciudad'] || '').trim() || undefined,
            address: (row['address'] || row['direccion'] || '').trim() || undefined,
            postal_code: (row['postal_code'] || row['codigo_postal'] || row['cp'] || '').trim() || undefined,
            phone: (row['phone'] || row['telefono'] || '').trim() || undefined,
            email: (row['email'] || row['correo'] || '').trim() || undefined,
            website: (row['website'] || row['web'] || '').trim() || undefined,
            priority,
            contact_name: (row['contact_name'] || row['contacto'] || row['contacto_nombre'] || '').trim() || undefined,
            contact_role: (row['contact_role'] || row['contacto_cargo'] || row['cargo'] || '').trim() || undefined,
            contact_phone: (row['contact_phone'] || row['contacto_telefono'] || '').trim() || undefined,
            contact_email: (row['contact_email'] || row['contacto_email'] || '').trim() || undefined,
            is_decision_maker: true,
          })
        })

        setParsedRows(rows)
        setParsingErrors(errors)
      },
      error: (err) => {
        setParsingErrors([`Error al leer el archivo CSV: ${err.message}`])
      },
    })
  }

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return

    setIsImporting(true)
    try {
      const result = await importGymsBatch(parsedRows)
      setImportResult(result)
      if (result.successCount > 0) {
        onSuccess()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la importación'
      setParsingErrors((prev) => [...prev, msg])
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Importación Masiva de Gimnasios</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Carga múltiples centros deportivos en bloque mediante un archivo CSV estándar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Download Template */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border bg-gray-50/70">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs font-semibold text-gray-800">Plantilla CSV oficial</p>
                <p className="text-[11px] text-gray-500">
                  Usa nuestro formato con columnas predefinidas para asegurar compatibilidad.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs gap-1.5 h-8 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar plantilla
            </Button>
          </div>

          {/* Step 2: Upload Area */}
          {!importResult && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-upload"
              />
              <label
                htmlFor="csv-file-upload"
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  file
                    ? 'border-blue-400 bg-blue-50/30'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50/50'
                }`}
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">
                  {file ? file.name : 'Haz clic o arrastra tu archivo CSV aquí'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB — Listo para procesar`
                    : 'Archivos .csv delimitados por comas'}
                </p>
              </label>
            </div>
          )}

          {/* Validation Warnings / Errors */}
          {parsingErrors.length > 0 && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-red-900">
                <AlertCircle className="h-4 w-4" />
                <span>Problemas detectados:</span>
              </div>
              <ul className="text-xs list-disc pl-5 space-y-0.5">
                {parsingErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {parsingErrors.length > 5 && (
                  <li>... y {parsingErrors.length - 5} problemas adicionales.</li>
                )}
              </ul>
            </div>
          )}

          {/* Data Preview */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Vista previa de datos ({parsedRows.length} registros válidos)</span>
                <Badge variant="secondary" className="text-[10px]">
                  Listos para importar
                </Badge>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-700 sticky top-0">
                    <tr>
                      <th className="p-2 font-medium">Nombre</th>
                      <th className="p-2 font-medium">Ciudad</th>
                      <th className="p-2 font-medium">Teléfono</th>
                      <th className="p-2 font-medium">Contacto</th>
                      <th className="p-2 font-medium">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="p-2 font-semibold text-gray-900">{row.name}</td>
                        <td className="p-2 text-gray-600">{row.city || '—'}</td>
                        <td className="p-2 text-gray-600">{row.phone || '—'}</td>
                        <td className="p-2 text-gray-600">{row.contact_name || '—'}</td>
                        <td className="p-2">
                          <span className="capitalize px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100">
                            {row.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p className="text-[11px] text-gray-400 text-center">
                  Mostrando 5 de {parsedRows.length} filas. Se importarán todos los registros.
                </p>
              )}
            </div>
          )}

          {/* Result View */}
          {importResult && (
            <div className="p-4 rounded-xl border bg-gray-50/70 space-y-3">
              <div className="flex items-center gap-2">
                {importResult.successCount > 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Importación finalizada
                  </h4>
                  <p className="text-xs text-gray-500">
                    {importResult.successCount} creados con éxito, {importResult.errorCount} con errores.
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
                  <p className="font-semibold">Detalle de errores:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importResult.errors.map((e, idx) => (
                      <li key={idx}>
                        Fila {e.row} ({e.name}): {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {importResult ? (
            <Button
              type="button"
              onClick={() => {
                resetState()
                onOpenChange(false)
              }}
              className="w-full sm:w-auto"
            >
              Completado
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleExecuteImport}
                disabled={parsedRows.length === 0 || isImporting}
                className="gap-1.5"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar {parsedRows.length > 0 ? `${parsedRows.length} Gimnasios` : ''}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
