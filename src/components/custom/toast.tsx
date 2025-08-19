import Image from 'next/image';
import type { ColorVariant } from '@/types/index.types';

interface Props {
  state?: ColorVariant;
  title: string;
  message: string;
}

export function ToastContent({ message, title }: Props) {
  return (
    <div className="max-w-2xl w-full bg-transparent rounded-lg pointer-events-auto flex ">
      <div className="flex-1">
        <div className="flex items-start pr-4">
          <div className="flex-shrink-0 pt-0.5">
            <Image
              width={32}
              height={32}
              className="h-10 w-10 rounded-full"
              src="/logos/favicon-black.svg"
              alt=""
            />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
