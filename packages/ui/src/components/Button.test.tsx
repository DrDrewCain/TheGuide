/**
 * @jest-environment jsdom
 *
 * Test framework: Jest or Vitest (globals describe/it/expect).
 * Libraries: @testing-library/react, @testing-library/user-event, @testing-library/jest-dom.
 * Scope: Tests focus on Button.tsx and buttonVariants from the PR diff.
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { Button, buttonVariants } from './Button'

/** Create a compatible mock function for either Vitest or Jest */
const createMockFn = () => {
  const g: any = globalThis as any
  if (g.vi && typeof g.vi.fn === 'function') return g.vi.fn()
  if (g.jest && typeof g.jest.fn === 'function') return g.jest.fn()
  // Fallback (shouldn't be used in normal setups)
  return (() => {}) as any
}

describe('buttonVariants (pure function)', () => {
  it('returns base + default variant and size classes when called with no options', () => {
    const cls = buttonVariants({})
    ;[
      // base tokens (subset to avoid fragility)
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'whitespace-nowrap',
      'transition-all',
      'duration-200',
      'transform-gpu',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:pointer-events-none',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      // default variant + size tokens
      'bg-slate-900',
      'text-white',
      'h-11',
      'px-6',
      'py-2.5',
      'text-sm',
      'rounded-lg',
    ].forEach(token => expect(cls).toContain(token))
  })

  it('merges provided className into the computed classes', () => {
    const cls = buttonVariants({ className: 'my-extra-class' })
    expect(cls).toContain('my-extra-class')
  })

  it.each([
    ['primary', 'xl', ['bg-gradient-to-r', 'from-[#b4e300]', 'to-[#a0ca00]', 'text-slate-900', 'font-semibold', 'h-16', 'px-10', 'py-4', 'text-lg', 'rounded-xl']],
    ['secondary', 'sm', ['bg-white', 'text-slate-700', 'border', 'border-slate-300', 'h-9', 'px-4', 'py-2', 'text-xs', 'rounded-md']],
    ['destructive', 'default', ['bg-red-600', 'text-white', 'hover:bg-red-700', 'active:bg-red-800', 'h-11', 'px-6', 'py-2.5', 'text-sm', 'rounded-lg']],
    ['outline', 'lg', ['border-2', 'border-slate-900', 'bg-transparent', 'text-slate-900', 'hover:bg-slate-900', 'hover:text-white', 'h-14', 'px-8', 'py-3.5', 'text-base', 'rounded-xl']],
    ['ghost', 'default', ['text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100', 'active:bg-slate-200']],
    ['link', 'default', ['text-slate-900', 'underline-offset-4', 'hover:underline', 'hover:text-slate-700']],
    ['default', 'icon', ['h-10', 'w-10', 'rounded-lg', 'bg-slate-900']],
  ])('applies variant=%s and size=%s classes', (variant, size, expectedTokens) => {
    const cls = buttonVariants({ variant: variant as any, size: size as any })
    expectedTokens.forEach(token => expect(cls).toContain(token))
  })

  it('handles unknown variant values gracefully (returns a string with base classes)', () => {
    const cls = buttonVariants({ variant: 'not-a-real-variant' as any })
    expect(typeof cls).toBe('string')
    expect(cls).toContain('inline-flex')
  })
})

describe('<Button /> component', () => {
  it('renders a native button by default with default styles', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: /click me/i })
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toHaveClass('bg-slate-900')
    expect(btn).toHaveClass('text-white')
    expect(btn).toHaveClass('h-11')
    expect(btn).toHaveClass('px-6')
    expect(btn).toHaveClass('py-2.5')
    expect(btn).toHaveClass('text-sm')
    expect(btn).toHaveClass('rounded-lg')
  })

  it('applies provided className in addition to computed classes', () => {
    render(<Button className="custom-class">Styled</Button>)
    const btn = screen.getByRole('button', { name: /styled/i })
    expect(btn).toHaveClass('custom-class')
    // Ensure a base class remains
    expect(btn).toHaveClass('inline-flex')
  })

  it.each([
    ['primary', 'xl', ['bg-gradient-to-r', 'from-[#b4e300]', 'to-[#a0ca00]', 'text-slate-900', 'font-semibold', 'h-16', 'px-10', 'py-4', 'text-lg', 'rounded-xl']],
    ['secondary', 'sm', ['bg-white', 'text-slate-700', 'border', 'border-slate-300', 'h-9', 'px-4', 'py-2', 'text-xs', 'rounded-md']],
    ['destructive', 'default', ['bg-red-600', 'text-white']],
    ['outline', 'lg', ['border-2', 'border-slate-900', 'text-slate-900', 'h-14', 'px-8', 'py-3.5']],
    ['ghost', 'default', ['text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100']],
    ['link', 'default', ['text-slate-900', 'underline-offset-4']],
    ['default', 'icon', ['h-10', 'w-10', 'rounded-lg']],
  ])('renders with variant=%s and size=%s classes', (variant, size, tokens) => {
    render(
      <Button variant={variant as any} size={size as any}>
        Combo
      </Button>
    )
    const btn = screen.getByRole('button', { name: /combo/i })
    tokens.forEach(token => expect(btn).toHaveClass(token))
  })

  it('forwards ref to the underlying HTMLButtonElement', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>With ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toBeInTheDocument()
  })

  it('renders as child element when asChild is true and applies classes to the child', () => {
    render(
      <Button asChild>
        <a href="/test">Go</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveClass('inline-flex')
    expect(screen.queryByRole('button', { name: 'Go' })).toBeNull()
  })

  it('respects disabled prop and prevents click handler execution', async () => {
    const user = userEvent.setup()
    const onClick = createMockFn()
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    )
    const btn = screen.getByRole('button', { name: /disabled/i })
    expect(btn).toBeDisabled()
    await user.click(btn)
    // Both Jest and Vitest spies support toHaveBeenCalledTimes
    expect(onClick).toHaveBeenCalledTimes(0)
  })

  it('passes through native attributes like type and aria-label', () => {
    render(
      <Button type="submit" aria-label="submit-button">
        Submit
      </Button>
    )
    const btn = screen.getByRole('button', { name: /submit/i })
    expect(btn).toHaveAttribute('type', 'submit')
    expect(btn).toHaveAttribute('aria-label', 'submit-button')
  })
})