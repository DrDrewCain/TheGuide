/**
 * Tests for Modal component
 *
 * Testing framework/library:
 * - Expecting React Testing Library with either Vitest (preferred) or Jest, depending on repo setup.
 *   - If Vitest: vi.fn, describe/it/expect from 'vitest'
 *   - If Jest: jest.fn, describe/it/expect are globals or from '@jest/globals'
 *
 * These tests cover:
 * - Conditional rendering when isOpen is false (null render)
 * - Body overflow locking/unlocking on open/close and unmount
 * - Close interactions: overlay click, close button click, Escape key
 * - Ensuring non-Escape keys do not close
 * - Ensuring clicking content does not close
 * - Size prop class application
 * - Title rendering (and corresponding padding class toggling)
 * - showCloseButton behavior
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Choose mocking function depending on environment (Vitest or Jest)
const fn = (global as any).vi ? (global as any).vi.fn : (global as any).jest ? (global as any).jest.fn : (() => { throw new Error('No test mock fn found (vi/jest)') })()

// Import the Modal component from the same directory if present, or adjust path as per repository structure
import { Modal, type ModalProps } from './Modal'

/**
 * Utility to render the Modal with sensible defaults.
 */
function setup(uiProps: Partial<ModalProps> = {}) {
  const onClose = fn()
  const props: ModalProps = {
    isOpen: true,
    onClose,
    title: 'Test Modal',
    children: <div data-testid="modal-children">Hello</div>,
    size: 'md',
    showCloseButton: true,
    ...uiProps,
  }
  const utils = render(<Modal {...props} />)
  return { ...utils, onClose, props }
}

function pressKey(key: string) {
  fireEvent.keyDown(document, { key })
}

describe('Modal', () => {
  let originalOverflow: string

  beforeEach(() => {
    // Reset mock function between tests
    if ((fn as any).mockReset) (fn as any).mockReset()
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = '' // start clean
  })

  afterEach(() => {
    // Ensure body overflow is reset after each test
    document.body.style.overflow = originalOverflow || ''
  })

  it('does not render when isOpen is false', () => {
    const onClose = fn()
    const { container, unmount } = render(
      <Modal isOpen={false} onClose={onClose}>
        <div>Hidden</div>
      </Modal>
    )
    expect(container.firstChild).toBeNull()

    // Effects should set overflow to 'unset' on mount and cleanup
    expect(document.body.style.overflow).toBe('unset')
    unmount()
    expect(document.body.style.overflow).toBe('unset')
  })

  it('renders when isOpen is true and locks body scroll', () => {
    const { getByText } = setup()
    expect(getByText('Test Modal')).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when closed by prop change', () => {
    const { rerender, onClose } = setup()
    // Close via prop update (parent-controlled)
    rerender(
      <Modal isOpen={false} onClose={onClose} title="Test Modal">
        <div data-testid="modal-children">Hello</div>
      </Modal>
    )
    expect(document.body.style.overflow).toBe('unset')
  })

  it('restores body scroll on unmount', () => {
    const { unmount } = setup()
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('unset')
  })

  it('calls onClose when clicking the overlay', () => {
    const { onClose, container } = setup()
    const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50')
    expect(overlay).not.toBeNull()
    fireEvent.click(overlay as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the close button (when shown)', () => {
    const { onClose } = setup({ showCloseButton: true })
    const closeBtn = screen.getByRole('button', { name: /close modal/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not render close button when showCloseButton is false', () => {
    setup({ showCloseButton: false })
    expect(screen.queryByRole('button', { name: /close modal/i })).toBeNull()
  })

  it('closes on Escape key when open', () => {
    const { onClose } = setup()
    pressKey('Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on non-Escape keys', () => {
    const { onClose } = setup()
    pressKey('Enter')
    pressKey(' ')
    pressKey('a')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close on Escape when not open (no listener registered)', () => {
    const onClose = fn()
    const { rerender } = render(
      <Modal isOpen={false} onClose={onClose}>
        <div>Hidden</div>
      </Modal>
    )
    pressKey('Escape')
    expect(onClose).not.toHaveBeenCalled()

    // Now open and verify listener attaches
    rerender(
      <Modal isOpen={true} onClose={onClose}>
        <div>Shown</div>
      </Modal>
    )
    pressKey('Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not trigger onClose when clicking inside content', () => {
    const { onClose, container } = setup()
    const content = container.querySelector('.relative.bg-white.rounded-lg.shadow-xl')
    expect(content).not.toBeNull()
    fireEvent.click(content as Element)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies correct size classes', () => {
    const sizes: ModalProps['size'][] = ['sm', 'md', 'lg', 'xl']
    for (const size of sizes) {
      const { container, rerender, onClose } = setup({ size })
      const panel = container.querySelector('.relative.bg-white.rounded-lg.shadow-xl') as HTMLElement
      expect(panel).toBeTruthy()
      const className = panel.className
      expect(className).toEqual(expect.stringContaining(`max-w-${size}`))
      // Clean up DOM between iterations while reusing the same test
      rerender(
        <Modal isOpen={false} onClose={onClose}>
          <div />
        </Modal>
      )
    }
  })

  it('renders title when provided and uses regular padding', () => {
    const { getByText, container } = setup({ title: 'A Title' })
    expect(getByText('A Title')).toBeInTheDocument()
    const content = container.querySelector('div.p-6') as HTMLElement
    expect(content).toBeTruthy()
    expect(content.className).not.toContain('pt-10')
  })

  it('omits title area when not provided and adds pt-10 padding', () => {
    const { container } = setup({ title: undefined })
    const header = screen.queryByRole('heading', { level: 2 })
    expect(header).toBeNull()
    const content = container.querySelector('div.p-6.pt-10') as HTMLElement
    expect(content).toBeTruthy()
  })
})