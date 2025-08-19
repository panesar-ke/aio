import Image from 'next/image';

export default function Loading() {
  return (
    <div className="h-full flex flex-col gap-2 items-center justify-center">
      <Image
        className="animate-ping w-8 h-8"
        src="/logos/favicon-black.svg"
        alt="Panesar Logo"
        width={64}
        height={64}
      />
      <p className="text-muted-foreground text-sm mt-4 animate-pulse">
        Loading....
      </p>
    </div>
  );
}
