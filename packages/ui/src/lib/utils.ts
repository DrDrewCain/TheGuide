import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge class names with Tailwind CSS conflict resolution
 *
 * This function combines clsx for conditional classes and tailwind-merge
 * to properly handle Tailwind CSS class conflicts. It ensures that when
 * multiple conflicting Tailwind classes are provided, the last one wins.
 *
 * @param inputs - Class values to be merged (strings, objects, arrays, etc.)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active-class')
 *
 * // Object syntax
 * cn('base', { 'text-red-500': hasError })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
