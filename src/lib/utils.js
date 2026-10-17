import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price, currency = 'USD') {
  const num = typeof price === 'number' ? price : parseFloat(price) || 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num)
}

export function truncate(str, length = 50) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
