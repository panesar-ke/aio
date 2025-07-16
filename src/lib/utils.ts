import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'
import { isAxiosError } from 'axios'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function generateRandomId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 15)}`
}

export function apiErrorHandler(err: unknown) {
  let error = ''
  if (isAxiosError(err)) {
    switch (err.status) {
      case 422:
        error = 'Validation failed. Please check your inputs.'
        break
      case 404:
        error = 'Could not find the requested resource.'
        break
      case 302:
        error = err.response?.data.message
        break
      case 401:
        error = 'Unauthorized access.'
        break
      default:
        error = err.response?.data.error || err.response?.data.message
        break
    }
  } else {
    if (err instanceof Error) {
      error = err.message
    } else {
      error = 'An unexpected error occurred.'
    }
  }
  return error
}
