import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-600 text-white shadow-2xs hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        destructive:
          'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-950',
        outline:
          'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950',
        info:
          'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-950',
        danger:
          'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950',
        purple:
          'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-950',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
