'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

/**
 * Props for the Modal component
 */
export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback function when modal is closed */
  onClose: () => void
  /** Optional title for the modal header */
  title?: string
  /** The content to display inside the modal */
  children: ReactNode
  /** Size variant of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show the close button */
  showCloseButton?: boolean
}

/**
 * An accessible modal dialog component with backdrop and keyboard support
 *
 * Features:
 * - Body scroll locking when open
 * - Escape key to close
 * - Click backdrop to close
 * - ARIA attributes for accessibility
 * - Multiple size variants
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose} title="My Modal">
 *   <p>Modal content here</p>
 * </Modal>
 * ```
 *
 * @param props - The component props
 * @returns A modal dialog component
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}: ModalProps) {
  useEffect(() => {
    // Capture and restore the previous value (works with nested modals)
    const previous = document.body.style.overflow
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = previous || ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.stopPropagation()
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  } as const

  return (
    <div className="fixed inset-0 z-50 overflow-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-label={title ? undefined : 'Modal'}
        >
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {title && (
            <div className="border-b px-6 py-4">
              <h2 id="modal-title" className="text-xl font-semibold">{title}</h2>
            </div>
          )}

          <div className={title ? 'p-6' : 'p-6 pt-10'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}