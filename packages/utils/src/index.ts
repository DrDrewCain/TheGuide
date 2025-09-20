// Utility functions for working with decisions
export const getDecisionTypeLabel = (type: string): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const calculateNetWorth = (
  assets: Record<string, number>,
  liabilities: Record<string, number>
): number => {
  const totalAssets = Object.values(assets).reduce((sum, value) => sum + value, 0)
  const totalLiabilities = Object.values(liabilities).reduce((sum, value) => sum + value, 0)
  return totalAssets - totalLiabilities
}

// Date utilities
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Number utilities
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

export const roundToDecimals = (value: number, decimals: number = 2): number => {
  return Math.round(value * 10 ** decimals) / 10 ** decimals
}
