'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Share2,
  Building2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react'

interface GymPortalShareModalProps {
  gym: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
  }
  isOpen: boolean
  onClose: () => void
}

export function GymPortalShareModal({
  gym,
  isOpen,
  onClose,
}: GymPortalShareModalProps) {
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const portalUrl = `${origin}/portal/${gym.id}`

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const defaultMessage = `Hola! Te comparto el enlace a tu Portal de Incorporación de GymBooking para ${gym.name}:\n\n${portalUrl}\n\nDesde aquí podrás seguir el estado de tu alta, dar el visto bueno a tus clases y subir las fotos y logotipo de tu centro.`

  const rawPhone = (gym.phone || '').replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(defaultMessage)}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Portal de Incorporación del Gimnasio
              </DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enlace seguro para que el dueño de {gym.name} colabore en su alta.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Enlace de acceso directo (Sin contraseña)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="w-full text-xs font-mono bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 select-all focus:outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-8.5 px-3 rounded-xl font-bold text-xs shrink-0 cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1">{copied ? 'Copiado' : 'Copiar'}</span>
              </Button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-1.5 text-xs text-blue-900 dark:text-blue-300">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              ¿Qué puede hacer el cliente en este portal?
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800/90 dark:text-blue-300/80">
              <li>Consultar el porcentaje y pasos completados de su incorporación.</li>
              <li>Revisar las clases y horarios cargados y dar su visto bueno.</li>
              <li>Subir su logotipo y fotos de salas directamente a su ficha.</li>
              <li>Contactar con un clic por WhatsApp con su gestor de cuenta.</li>
            </ul>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              asChild
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs text-xs h-10"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar enlace por WhatsApp al dueño
              </a>
            </Button>

            <Button
              variant="outline"
              asChild
              className="w-full rounded-xl cursor-pointer text-xs h-9"
            >
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Abrir portal en pestaña nueva (Vista previa)
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
