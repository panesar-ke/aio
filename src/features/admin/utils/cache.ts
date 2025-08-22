import { getIdTag, getGlobalTag } from '@/lib/cache';

export function getUsersGlobalTag() {
  return getGlobalTag('users');
}

export function getFormsGlobalTag() {
  return getGlobalTag('forms');
}

export function getUserFormsGlobalTag(userId: string) {
  return getIdTag('forms', userId);
}
