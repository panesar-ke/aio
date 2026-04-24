'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon, FileWarningIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Unauthorized() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100dvh-6rem)]">
      <Card className="border-t-4 border-t-error max-w-lg w-full">
        <CardContent className="p-8">
          <div className="bg-error size-16 mx-auto rounded-full p-4  flex items-center justify-center mb-5">
            <FileWarningIcon className="size-8 text-error-foreground" />
          </div>
          <h1 className="text-2xl font-medium text-center mb-2">
            You don&apos;t have access!
          </h1>
          <p className="text-muted-foreground mb-8  text-center mx-auto">
            This page requires specific permissions to access. Please contact
            your administrator if you need access.
          </p>
          <Button className="w-full" onClick={() => router.back()}>
            <ArrowLeftIcon className="size-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
