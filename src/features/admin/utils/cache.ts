import { getIdTag, getGlobalTag } from '@/lib/cache';
import { revalidateTag } from 'next/cache';

export function getUsersGlobalTag() {
  return getGlobalTag('users');
}

export function getUserTag(userId: string) {
  return getIdTag('users', userId);
}

export function revalidateUserTags(userId: string) {
  revalidateTag(getUsersGlobalTag());
  revalidateTag(getUserTag(userId));
}

export function getFormsGlobalTag() {
  return getGlobalTag('forms');
}

export function getUserFormsGlobalTag(userId: string) {
  return getIdTag('forms', userId);
}
