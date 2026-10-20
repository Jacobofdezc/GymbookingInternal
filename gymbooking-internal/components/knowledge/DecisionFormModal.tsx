'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { createDecision, type DecisionWithDetails } from '@/services/decisions/decision.service'
import type { DecisionStatus } from '@/types/database'
import { Loader2, Scale } from 'lucide-react'

interface DecisionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialDecision?: DecisionWithDetails | null
}

export function DecisionFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialDecision,
}: DecisionFormModalProps) {
  const [title, setTitle] = useState('')
  const [decisionDate, setDecisionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [status, setStatus] = useState<DecisionStatus>('active')
  const [responsibleId, setResponsibleId] = useState('')
  const [gymId, setGymId] = useState('')
  const [context, setContext] = useState('')
  const [decisionMade, setDecisionMade] = useState('')
  const [consequences, setConsequences] = useState('')

  const [gyms, setGyms] = useState<Array<{ id: string; name: string }>>([])
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOptions() {
      const supabase = createClient()
      const [gymsRes, profilesRes] = await Promise.all([
        supabase.from('gyms').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name').order('full_name'),
      ])
      if (gymsRes.data) setGyms(gymsRes.data)
      if (profilesRes.data) setProfiles(profilesRes.data)
    }

    if (isOpen) {
      loadOptions()
      if (initialDecision) {
        setTitle(initialDecision.title)
        setDecisionDate(initialDecision.decision_date || new Date().toISOString().split('T')[0])
        setStatus(initialDecision.status)
        setResponsibleId(initialDecision.responsible_id || '')
        setGymId(initialDecision.gym_id || '')
        setContext(initialDecision.context || '')
        setDecisionMade(initialDecision.decision_made)
        setConsequences(initialDecision.consequences || '')
      } else {
        setTitle('')
        setDecisionDate(new Date().toISOString().split('T')[0])
        setStatus('active')
        setResponsibleId('')
        setGymId('')
        setContext('')
        setDecisionMade('')
        setConsequences('')
      }
      setError(null)
    }
  }, [isOpen, initialDecision])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !decisionMade.trim()) {
      setError('El título y la decisión adoptada son obligatorios.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await createDecision({
        title: title.trim(),
        decision_date: decisionDate,
        status,
        responsible_id: responsibleId || null,
        gym_id: gymId || null,
        context: context.trim() || null,
        decision_made: decisionMade.trim(),
        consequences: consequences.trim() || null,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la decisión'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {initialDecision ? 'Editar Registro de Decisión' : 'Nueva Decisión (ADR)'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Registra acuerdos formales de arquitectura, modelo de negocio o condiciones comerciales.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-800 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="decision_title">Título de la Decisión *</Label>
            <Input
              id="decision_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Adopción de modelo de liquidación semanal para centros prémium"
              required
              className="mt-1 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="decision_date">Fecha de Aprobación</Label>
              <Input
                id="decision_date"
                type="date"
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="decision_status">Estado de la Decisión</Label>
              <select
                id="decision_status"
                value={status}
                onChange={(e) => setStatus(e.target.value as DecisionStatus)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Activa / Vigente</option>
                <option value="replaced">Reemplazada por posterior</option>
                <option value="discarded">Descartada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="decision_resp">Responsable</Label>
              <select
                id="decision_resp"
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar responsable...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="decision_gym">Gimnasio Vinculado (Opcional)</Label>
              <select
                id="decision_gym"
                value={gymId}
                onChange={(e) => setGymId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Transversal / Toda la plataforma</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="decision_context">Contexto y Justificación</Label>
            <Textarea
              id="decision_context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="¿Qué problema o necesidad motivó evaluar esta decisión? Antecedentes y opciones consideradas."
              rows={3}
              className="mt-1 text-xs resize-none"
            />
          </div>

          <div>
            <Label htmlFor="decision_made">Decisión Adoptada *</Label>
            <Textarea
              id="decision_made"
              value={decisionMade}
              onChange={(e) => setDecisionMade(e.target.value)}
              placeholder="Descripción explícita de lo que se ha acordado hacer o implementar."
              rows={3}
              required
              className="mt-1 text-xs resize-none"
            />
          </div>

          <div>
            <Label htmlFor="decision_consequences">Consecuencias y Compromisos</Label>
            <Textarea
              id="decision_consequences"
              value={consequences}
              onChange={(e) => setConsequences(e.target.value)}
              placeholder="Impacto positivo, limitaciones aceptadas, riesgos o tareas derivadas."
              rows={2}
              className="mt-1 text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Decisión'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
