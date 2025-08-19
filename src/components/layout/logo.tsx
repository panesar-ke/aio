'use client';
import Image from 'next/image';
import { useSidebar } from '@/components/ui/sidebar';

export default function Logo() {
  const { open } = useSidebar();

  if (!open) {
    return (
      <Image
        src="/logos/favicon-black.svg"
        alt="Panesar Logo"
        height={32}
        width={32}
        className="size-6"
        priority
      />
    );
  }
  return (
    <Image
      src="/logos/logo-light.svg"
      alt="Panesar Logo"
      height={360}
      width={600}
      className="w-1/3 h-auto py-4 mx-auto"
      priority
    />
  );
}
