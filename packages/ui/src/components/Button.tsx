import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 transform-gpu focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 focus-visible:ring-slate-500 shadow-sm hover:shadow-md',
        primary: 'bg-gradient-to-r from-[#b4e300] to-[#a0ca00] text-slate-900 font-semibold hover:from-[#a0ca00] hover:to-[#8fb300] active:scale-[0.98] shadow-md hover:shadow-lg focus-visible:ring-[#b4e300]',
        secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:ring-slate-500 shadow-sm',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm hover:shadow-md',
        outline: 'border-2 border-slate-900 bg-transparent text-slate-900 hover:bg-slate-900 hover:text-white active:bg-slate-800 focus-visible:ring-slate-500',
        ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-500',
        link: 'text-slate-900 underline-offset-4 hover:underline hover:text-slate-700 focus-visible:ring-slate-500',
      },
      size: {
        default: 'h-11 px-6 py-2.5 text-sm rounded-lg',
        sm: 'h-9 px-4 py-2 text-xs rounded-md',
        lg: 'h-14 px-8 py-3.5 text-base rounded-xl',
        xl: 'h-16 px-10 py-4 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
