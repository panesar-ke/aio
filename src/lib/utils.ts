import { isAxiosError } from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

export function generateRandomId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 15)}`;
}

export function apiErrorHandler(err: unknown) {
  let error = '';
  if (isAxiosError(err)) {
    switch (err.status) {
      case 422:
        error = 'Validation failed. Please check your inputs.';
        break;
      case 404:
        error = 'Could not find the requested resource.';
        break;
      case 302:
        error = err.response?.data.message;
        break;
      case 401:
        error = 'Unauthorized access.';
        break;
      default:
        error = err.response?.data.error || err.response?.data.message;
        break;
    }
  } else {
    if (err instanceof Error) {
      error = err.message;
    } else {
      error = 'An unexpected error occurred.';
    }
  }
  return error;
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}
