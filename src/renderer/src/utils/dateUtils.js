import { format, parseISO, isValid } from 'date-fns'

/**
 * Formats a date string, number, or Date object to MM/dd/yyyy format.
 * Returns "—" if the input is invalid or undefined.
 */
export const formatDate = (date) => {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(d) ? format(d, 'MM/dd/yyyy') : '—'
}

/**
 * Formats a date string, number, or Date object to a more readable medium format: MMM dd, yyyy.
 * Returns "—" if the input is invalid or undefined.
 */
export const formatMediumDate = (date) => {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(d) ? format(d, 'MMM dd, yyyy') : '—'
}

/**
 * Formats a date string, number, or Date object to MM/dd/yyyy hh:mm a format.
 * Returns "—" if the input is invalid or undefined.
 */
export const formatDateTime = (date) => {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(d) ? format(d, 'MM/dd/yyyy hh:mm a') : '—'
}
