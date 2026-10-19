'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { gymSchema, type GymFormValues } from '@/lib/validations/gym.schema'
import { createGym, updateGym } from '@/services/gyms/gym.service'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, Building2, TrendingUp, CheckSquare, FileText } from 'lucide-react'
import type {
  CommercialStatus,
  OnboardingStatus,
  Profile,
  Discipline,
} from '@/types/database'

interface GymFormProps {
  initialData?: any
  isEditing?: boolean
}

export function GymForm({ initialData, isEditing = false }: GymFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Options
  const [commercialStatuses, setCommercialStatuses] = useState<CommercialStatus[]>([])
  const [onboardingStatuses, setOnboardingStatuses] = useState<OnboardingStatus[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<GymFormValues>({
    resolver: zodResolver(gymSchema),
    defaultValues: {
      name: initialData?.name || '',
      legal_name: initialData?.legal_name || '',
      description: initialData?.description || '',
      website: initialData?.website || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      postal_code: initialData?.postal_code || '',
      instagram: initialData?.instagram || '',
      contact_source: initialData?.contact_source || '',
      discipline_ids: initialData?.disciplines?.map((d: any) => d.id) || [],

      commercial_status_id: initialData?.commercial_status_id || '',
      priority: initialData?.priority || 'medium',
      owner_id: initialData?.owner_id || '',
      first_contact_date: initialData?.first_contact_date || '',
      last_contact_date: initialData?.last_contact_date || '',
      next_followup_date: initialData?.next_followup_date || '',
      next_action: initialData?.next_action || '',
      interest_level: initialData?.interest_level || 'unknown',
      interest_reason: initialData?.interest_reason || '',
      commercial_notes: initialData?.commercial_notes || '',
      gym_objections: initialData?.gym_objections || '',
      next_steps: initialData?.next_steps || '',

      onboarding_status_id: initialData?.onboarding_status_id || '',
      classes_expected: initialData?.classes_expected ?? '',
      onboarding_owner_id: initialData?.onboarding_owner_id || '',
      pending_info: initialData?.pending_info || '',
      current_blockers: initialData?.current_blockers || '',

      business_model_proposed: initialData?.business_model_proposed || '',
      business_model_agreed: initialData?.business_model_agreed || '',
      commission_details: initialData?.commission_details || '',
      booking_manager: initialData?.booking_manager || 'unknown',
      schedule_manager: initialData?.schedule_manager || 'unknown',
      cancellation_policy: initialData?.cancellation_policy || '',
      special_conditions: initialData?.special_conditions || '',
      agreement_start_date: initialData?.agreement_start_date || '',
      agreement_review_date: initialData?.agreement_review_date || '',
      agreement_status: initialData?.agreement_status || 'none',
      contract_url: initialData?.contract_url || '',
    },
  })

  // Load select options
  useEffect(() => {
    async function loadOptions() {
      const supabase = createClient()
      const [commRes, onbRes, profRes, discRes] = await Promise.all([
        supabase
          .from('commercial_statuses')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('onboarding_statuses')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .order('full_name', { ascending: true }),
        supabase
          .from('disciplines')
          .select('*')
          .order('name', { ascending: true }),
      ])

      if (commRes.data) setCommercialStatuses(commRes.data)
      if (onbRes.data) setOnboardingStatuses(onbRes.data)
      if (profRes.data) setProfiles(profRes.data)
      if (discRes.data) setDisciplines(discRes.data)

      if (initialData?.disciplines) {
        setSelectedDisciplines(initialData.disciplines.map((d: any) => d.id))
      }
    }

    loadOptions()
  }, [initialData])

  const toggleDiscipline = (discId: string) => {
    const next = selectedDisciplines.includes(discId)
      ? selectedDisciplines.filter((id) => id !== discId)
      : [...selectedDisciplines, discId]
    setSelectedDisciplines(next)
    setValue('discipline_ids', next)
  }

  const onSubmit = async (values: GymFormValues) => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const payload: GymFormValues = {
        ...values,
        discipline_ids: selectedDisciplines,
      }

      if (isEditing && initialData?.id) {
        await updateGym(initialData.id, payload)
        router.push(`/gyms/${initialData.id}`)
      } else {
        const created = await createGym(payload)
        router.push(`/gyms/${created.id}`)
      }
      router.refresh()
    } catch (err: any) {
      console.error('Error saving gym:', err)
      setErrorMsg(err.message || 'Error al guardar los datos del gimnasio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? `Editar: ${initialData?.name || 'Gimnasio'}` : 'Nuevo Gimnasio'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? 'Actualiza la información comercial y operativa del centro.'
                : 'Registra un nuevo centro deportivo en el sistema.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar Cambios' : 'Crear Gimnasio'}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* SECTION 1: INFORMACIÓN GENERAL */}
      <Card>
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>1. Información General</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre comercial *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej. Metropolitan Iradier"
                className="mt-1"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="legal_name">Razón social</Label>
              <Input
                id="legal_name"
                {...register('legal_name')}
                placeholder="Ej. Deportes y Salud Iradier S.L."
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción / Presentación del centro</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Instalaciones, equipamiento, enfoque comercial..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Teléfono principal</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+34 930 000 000"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email general</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="info@gimnasio.es"
                className="mt-1"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                {...register('website')}
                placeholder="https://gimnasio.es"
                className="mt-1"
              />
              {errors.website && (
                <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Dirección postal</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Calle Mayor 45"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Código postal</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="28001"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Madrid"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                {...register('instagram')}
                placeholder="@gimnasio"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact_source">Origen del contacto</Label>
              <Input
                id="contact_source"
                {...register('contact_source')}
                placeholder="Ej. Prospección, Instagram, Referido..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Disciplines picker */}
          <div>
            <Label className="block mb-2">Disciplinas que imparte</Label>
            <div className="flex flex-wrap gap-2">
              {disciplines.map((d) => {
                const isSelected = selectedDisciplines.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDiscipline(d.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {d.name} {isSelected && '✓'}
                  </button>
                )
              })}
              {disciplines.length === 0 && (
                <p className="text-xs text-muted-foreground">No hay disciplinas configuradas.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: ESTADO COMERCIAL */}
      <Card>
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <CardTitle>2. Seguimiento Comercial</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="commercial_status_id">Estado Comercial</Label>
              <select
                id="commercial_status_id"
                {...register('commercial_status_id')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar estado...</option>
                {commercialStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridad comercial</Label>
              <select
                id="priority"
                {...register('priority')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <Label htmlFor="owner_id">Responsable comercial (Owner)</Label>
              <select
                id="owner_id"
                {...register('owner_id')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin asignar...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="interest_level">Nivel de interés</Label>
              <select
                id="interest_level"
                {...register('interest_level')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="unknown">Por determinar</option>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="very_high">Muy Alto</option>
              </select>
            </div>

            <div>
              <Label htmlFor="next_followup_date">Próximo seguimiento</Label>
              <Input
                id="next_followup_date"
                type="date"
                {...register('next_followup_date')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="next_action">Próxima acción comercial</Label>
              <Input
                id="next_action"
                {...register('next_action')}
                placeholder="Ej. Enviar propuesta por email"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="interest_reason">Motivo de interés / Valor que perciben</Label>
            <Input
              id="interest_reason"
              {...register('interest_reason')}
              placeholder="Ej. Quieren llenar horas valle, les interesa atraer nuevos alumnos..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="gym_objections">Objeciones planteadas por el gimnasio</Label>
            <Textarea
              id="gym_objections"
              {...register('gym_objections')}
              placeholder="Ej. Dudas con la exclusividad, comisión, gestión de cancelaciones..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="commercial_notes">Notas comerciales internas</Label>
            <Textarea
              id="commercial_notes"
              {...register('commercial_notes')}
              placeholder="Histórico resumido, preferencias del director, notas estratégicas..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: INCORPORACIÓN / ONBOARDING */}
      <Card>
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-indigo-600" />
            <CardTitle>3. Incorporación / Onboarding</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="onboarding_status_id">Estado de Incorporación</Label>
              <select
                id="onboarding_status_id"
                {...register('onboarding_status_id')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar estado de onboarding...</option>
                {onboardingStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="onboarding_owner_id">Responsable Onboarding</Label>
              <select
                id="onboarding_owner_id"
                {...register('onboarding_owner_id')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin asignar...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="classes_expected">Clases estimadas a publicar</Label>
              <Input
                id="classes_expected"
                type="number"
                min="0"
                {...register('classes_expected')}
                placeholder="Ej. 10"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pending_info">Información pendiente</Label>
              <Textarea
                id="pending_info"
                {...register('pending_info')}
                placeholder="Ej. Horarios en PDF, fotos del centro, datos bancarios..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="current_blockers">Bloqueos actuales</Label>
              <Textarea
                id="current_blockers"
                {...register('current_blockers')}
                placeholder="Ej. Esperando firma de contrato, cambio de software interno..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: CONDICIONES COMERCIALES */}
      <Card>
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-amber-600" />
            <CardTitle>4. Condiciones Comerciales y Acuerdo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="agreement_status">Estado del Acuerdo</Label>
              <select
                id="agreement_status"
                {...register('agreement_status')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="none">Ninguno</option>
                <option value="verbal">Acuerdo verbal</option>
                <option value="pending_formal">Pendiente de firma</option>
                <option value="formalized">Formalizado / Firmado</option>
                <option value="expired">Expirado / Vencido</option>
              </select>
            </div>

            <div>
              <Label htmlFor="agreement_start_date">Fecha inicio de acuerdo</Label>
              <Input
                id="agreement_start_date"
                type="date"
                {...register('agreement_start_date')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="agreement_review_date">Fecha de revisión</Label>
              <Input
                id="agreement_review_date"
                type="date"
                {...register('agreement_review_date')}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business_model_proposed">Modelo de negocio propuesto</Label>
              <Input
                id="business_model_proposed"
                {...register('business_model_proposed')}
                placeholder="Ej. Comisión 15% por reserva"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="business_model_agreed">Modelo de negocio pactado</Label>
              <Input
                id="business_model_agreed"
                {...register('business_model_agreed')}
                placeholder="Ej. Comisión 12% primer trimestre"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="booking_manager">Gestión de reservas</Label>
              <select
                id="booking_manager"
                {...register('booking_manager')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="unknown">Por acordar</option>
                <option value="gymbooking">GymBooking (Automático)</option>
                <option value="gym">Gimnasio (Confirmación manual)</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>

            <div>
              <Label htmlFor="schedule_manager">Gestión de horarios</Label>
              <select
                id="schedule_manager"
                {...register('schedule_manager')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="unknown">Por acordar</option>
                <option value="gymbooking">GymBooking</option>
                <option value="gym">Gimnasio</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commission_details">Detalle de comisiones</Label>
              <Input
                id="commission_details"
                {...register('commission_details')}
                placeholder="Ej. 10€ por pack o 15% por clase suelta"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contract_url">Enlace al contrato / Documento</Label>
              <Input
                id="contract_url"
                {...register('contract_url')}
                placeholder="https://drive.google.com/..."
                className="mt-1"
              />
              {errors.contract_url && (
                <p className="mt-1 text-xs text-red-500">{errors.contract_url.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cancellation_policy">Política de cancelación</Label>
              <Textarea
                id="cancellation_policy"
                {...register('cancellation_policy')}
                placeholder="Ej. Hasta 2 horas antes de la clase..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="special_conditions">Condiciones especiales</Label>
              <Textarea
                id="special_conditions"
                {...register('special_conditions')}
                placeholder="Ej. No válido para socios actuales del club..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar Cambios' : 'Crear Gimnasio'}
        </Button>
      </div>
    </form>
  )
}
