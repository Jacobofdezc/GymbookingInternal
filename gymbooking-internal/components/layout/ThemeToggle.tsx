'use client'

import * as React from 'react'
import { Moon, Sun, Laptop } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 rounded-xl text-slate-500 hover:text-slate-900"
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Cambiar tema</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title="Cambiar tema (Claro / Oscuro / Sistema)"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-lg border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center gap-2 cursor-pointer font-medium text-xs py-2"
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Claro</span>
          {theme === 'light' && <span className="ml-auto text-blue-600 font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2 cursor-pointer font-medium text-xs py-2"
        >
          <Moon className="h-3.5 w-3.5 text-blue-400" />
          <span>Oscuro</span>
          {theme === 'dark' && <span className="ml-auto text-blue-600 font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center gap-2 cursor-pointer font-medium text-xs py-2"
        >
          <Laptop className="h-3.5 w-3.5 text-slate-400" />
          <span>Sistema</span>
          {theme === 'system' && <span className="ml-auto text-blue-600 font-bold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
