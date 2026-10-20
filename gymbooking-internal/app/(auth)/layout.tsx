import React from 'react'
import { ShieldCheck } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none">
      {/* Subtle modern background grid & radial mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e115_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e115_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="w-full max-w-md relative z-10">
        {children}

        {/* Trust & Security footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acceso seguro cifrado • GymBooking Internal</span>
        </div>
      </div>
    </div>
  )
}
