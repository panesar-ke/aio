import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

import { useModal } from '@/features/integrations/modal-provider';
import { cn } from '@/lib/utils';

interface CustomModalProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  className?: string;
}

export default function CustomModal({
  children,
  title,
  subtitle,
  defaultOpen,
  className,
}: CustomModalProps) {
  const { isOpen, setClose } = useModal();
  return (
    <Dialog open={isOpen || defaultOpen} onOpenChange={setClose}>
      <DialogContent
        className={cn('md:max-h-[700px] md:h-fit h-screen bg-card', className)}
      >
        <DialogTitle>{title}</DialogTitle>
        {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        {children}
      </DialogContent>
    </Dialog>
  );
}
