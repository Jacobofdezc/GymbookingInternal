import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-2xs transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
