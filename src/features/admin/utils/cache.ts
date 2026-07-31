import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/cache';

export function getUsersGlobalTag() {
  return getGlobalTag('users');
}

export function getUserTag(userId: string) {
  return getIdTag('users', userId);
}

export function revalidateUserTags(userId: string) {
  revalidateTag(getUsersGlobalTag(), 'max');
  revalidateTag(getUserTag(userId), 'max');
}

export function getFormsGlobalTag() {
  return getGlobalTag('forms');
}

export function getUserFormsGlobalTag(userId: string) {
  return getIdTag('forms', userId);
}
