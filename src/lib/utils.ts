import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function generateRandomId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 15)}`
}
