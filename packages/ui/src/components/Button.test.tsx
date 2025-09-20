import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button, buttonVariants } from './Button'

// If using Vitest with non-global expect/vi, uncomment the next line:
// import { describe, it, expect, vi } from 'vitest'

describe('buttonVariants (CVA) - variants', () => {
  it('returns base + default variant/size when called with no args', () => {
    const classes = buttonVariants({})
    expect(classes).toContain('inline-flex')
    expect(classes).toContain('items-center')
    expect(classes).toContain('bg-slate-900')
    expect(classes).toContain('h-11')
  })

  it('includes primary gradient classes for variant="primary"', () => {
    const classes = buttonVariants({ variant: 'primary' })
    expect(classes).toContain('from-[#b4e300]')
    expect(classes).toContain('to-[#a0ca00]')
    expect(classes).toContain('text-slate-900')
  })

  it('includes secondary border classes', () => {
    const classes = buttonVariants({ variant: 'secondary' })
    expect(classes).toContain('border')
    expect(classes).toContain('border-slate-300')
    expect(classes).toContain('text-slate-700')
  })

  it('includes destructive red background', () => {
    const classes = buttonVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-red-600')
  })

  it('includes outline border and transparent background', () => {
    const classes = buttonVariants({ variant: 'outline' })
    expect(classes).toContain('border-2')
    expect(classes).toContain('bg-transparent')
    expect(classes).toContain('text-slate-900')
  })

  it('includes ghost hover background', () => {
    const classes = buttonVariants({ variant: 'ghost' })
    expect(classes).toContain('hover:bg-slate-100')
  })

  it('includes link underline styles', () => {
    const classes = buttonVariants({ variant: 'link' })
    expect(classes).toContain('underline-offset-4')
  })
})

describe('buttonVariants (CVA) - sizes', () => {
  it('size="sm" includes h-9', () => {
    expect(buttonVariants({ size: 'sm' })).toContain('h-9')
  })
  it('size="lg" includes h-14', () => {
    expect(buttonVariants({ size: 'lg' })).toContain('h-14')
  })
  it('size="xl" includes h-16', () => {
    expect(buttonVariants({ size: 'xl' })).toContain('h-16')
  })
  it('size="icon" includes square dimensions', () => {
    const classes = buttonVariants({ size: 'icon' })
    expect(classes).toContain('h-10')
    expect(classes).toContain('w-10')
  })
  it('merges custom className with generated classes', () => {
    const classes = buttonVariants({ className: 'custom-class bg-red-500' })
    expect(classes).toContain('custom-class')
    expect(classes).toContain('bg-red-500')
    // Ensure base is still present
    expect(classes).toContain('inline-flex')
  })
  it('gracefully ignores unknown variant/size values at runtime', () => {
    // @ts-expect-error: intentionally passing invalid values to simulate runtime misuse
    const classes = buttonVariants({ variant: 'unknown', size: 'weird' } as any)
    expect(typeof classes).toBe('string')
    expect(classes).toContain('inline-flex') // base classes still returned
  })
})

describe('<Button /> component', () => {
  it('renders a button element by default with role="button"', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: /click me/i })
    expect(btn).toBeInTheDocument()
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toHaveClass('inline-flex')
  })

  it('applies provided variant and size classes', () => {
    render(
      <Button variant="primary" size="lg">
        Primary LG
      </Button>
    )
    const btn = screen.getByRole('button', { name: /primary lg/i })
    expect(btn).toHaveClass('from-[#b4e300]')
    expect(btn).toHaveClass('h-14')
  })

  it('appends custom className', () => {
    render(<Button className="data-test-class">Custom</Button>)
    const btn = screen.getByRole('button', { name: /custom/i })
    expect(btn).toHaveClass('data-test-class')
  })

  it('forwards other props (e.g., type, aria-label) to the underlying element', () => {
    render(
      <Button type="button" aria-label="do action">
        Do
      </Button>
    )
    const btn = screen.getByRole('button', { name: /do/i })
    expect(btn).toHaveAttribute('type', 'button')
    expect(btn).toHaveAttribute('aria-label', 'do action')
  })

  it('handles onClick events', () => {
    const handleClick = jest.fn ? jest.fn() : (global as any).vi.fn()
    render(<Button onClick={handleClick}>Tap</Button>)
    const btn = screen.getByRole('button', { name: /tap/i })
    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('supports disabled state', () => {
    render(
      <Button disabled aria-disabled="true">
        Disabled
      </Button>
    )
    const btn = screen.getByRole('button', { name: /disabled/i })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-disabled', 'true')
    // Base "disabled:" Tailwind utilities are included in className string
    expect(btn.className).toMatch(/disabled:/)
  })

  it('forwards ref to the DOM element', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref test</Button>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe('BUTTON')
  })

  it('renders as child via Slot when asChild is true and applies classes to child', () => {
    render(
      <Button asChild variant="link">
        <a href="#home">Home</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /home/i })
    expect(link.tagName).toBe('A')
    expect(link).toHaveClass('underline-offset-4')
    expect(link).toHaveAttribute('href', '#home')
  })
})