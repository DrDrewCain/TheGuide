import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, type ModalProps } from './Modal'

/**
 * Testing stack note:
 * - Framework: Jest or Vitest (auto-detected by repo). The tests use standard React Testing Library APIs.
 * - Library: @testing-library/react + @testing-library/user-event for interaction.
 */

const setup = (props?: Partial<ModalProps>) => {
  const onClose = vi.fn ? vi.fn() : (jest.fn && jest.fn()) // support vitest or jest
  const utils = render(
    <Modal
      isOpen={props?.isOpen ?? true}
      onClose={onClose}
      title={props?.title}
      size={props?.size ?? 'md'}
      showCloseButton={props?.showCloseButton ?? true}
    >
      <div data-testid="modal-children">Hello modal</div>
    </Modal>
  )
  return { onClose, ...utils }
}

describe('Modal component', () => {
  afterEach(() => {
    // Ensure body overflow is reset after each test
    document.body.style.overflow = 'unset'
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        content
      </Modal>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders children when open', () => {
    setup()
    expect(screen.getByTestId('modal-children')).toHaveTextContent('Hello modal')
  })

  it('renders title when provided and not otherwise', () => {
    // With title
    setup({ title: 'My Title' })
    expect(screen.getByRole('heading', { level: 2, name: 'My Title' })).toBeInTheDocument()

    // Without title
    const { unmount } = setup()
    unmount()
    const { queryByRole } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>content</div>
      </Modal>
    )
    expect(queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('applies size classes based on size prop (sm, md, lg, xl) with md as default', () => {
    const sizes: Array<ModalProps['size']> = ['sm', 'md', 'lg', 'xl']
    const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    }

    for (const s of sizes) {
      const { unmount, container } = render(
        <Modal isOpen={true} onClose={() => {}} size={s\!}>
          content
        </Modal>
      )
      const modalPanel = container.querySelector('div.relative.bg-white')
      expect(modalPanel).toBeTruthy()
      expect(modalPanel\!.className).toContain(sizeClass[s\!])
      unmount()
    }

    // Default md
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        content
      </Modal>
    )
    const modalDefault = container.querySelector('div.relative.bg-white')
    expect(modalDefault).toBeTruthy()
    expect(modalDefault\!.className).toContain('max-w-md')
  })

  it('shows close button by default and hides it when showCloseButton=false', async () => {
    const user = userEvent.setup()
    const { onClose, unmount } = setup()
    const btn = screen.getByRole('button', { name: /close modal/i })
    expect(btn).toBeInTheDocument()
    await user.click(btn)
    expect(onClose).toHaveBeenCalledTimes(1)

    unmount()
    render(
      <Modal isOpen={true} onClose={onClose} showCloseButton={false}>
        content
      </Modal>
    )
    expect(screen.queryByRole('button', { name: /close modal/i })).toBeNull()
  })

  it('calls onClose when clicking on the overlay but not when clicking content', async () => {
    const user = userEvent.setup()
    const { onClose, container } = setup()

    // Click overlay: select the element with bg-black bg-opacity-50
    const overlay = container.querySelector('[class*="bg-black"][class*="bg-opacity-50"]') as HTMLElement
    expect(overlay).toBeTruthy()
    await user.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)

    // Clicking inside modal content should not trigger onClose
    const content = screen.getByTestId('modal-children')
    await user.click(content)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape key when open and does not when closed', () => {
    const onClose = (vi?.fn?.() as jest.Mock | undefined) || (jest?.fn?.() as jest.Mock | undefined) || (() => {})
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose as any}>
        content
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    // Now close modal and ensure listener removed
    rerender(
      <Modal isOpen={false} onClose={onClose as any}>
        content
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sets body overflow to hidden when opened and resets to unset when closed', () => {
    const { rerender, unmount } = render(
      <Modal isOpen={true} onClose={() => {}}>
        content
      </Modal>
    )
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        content
      </Modal>
    )
    expect(document.body.style.overflow).toBe('unset')

    // Also ensure cleanup on unmount
    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        content
      </Modal>
    )
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('unset')
  })
})