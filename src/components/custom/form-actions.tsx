import {
  CircleCheckBigIcon,
  CircleXIcon,
  type LucideIcon,
  SaveIcon,
} from 'lucide-react';

import type { IsEdit, IsPending } from '@/types/index.types';

import { ButtonLoader } from '@/components/custom/loaders';
import { Button } from '@/components/ui/button';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { cn } from '@/lib/utils';

interface FormActionsProps extends IsPending, IsEdit {
  resetFn: () => void;
  className?: string;
  defaultButtonNames?: boolean;
  actionButtonText?: string;
  cancelButtonText?: string;
}

export function FormActions({
  isEdit,
  isPending,
  resetFn,
  className,
  defaultButtonNames = true,
  actionButtonText = 'Save',
  cancelButtonText = 'Cancel',
}: FormActionsProps) {
  return (
    <div className={cn('flex items-center gap-x-2 justify-end', className)}>
      <Button type='submit' disabled={isPending} size='lg'>
        {isPending ? (
          <ButtonLoader loadingText='Processing...' />
        ) : (
          <>
            <CircleCheckBigIcon />
            <span>
              {defaultButtonNames
                ? isEdit
                  ? 'Update'
                  : 'Save'
                : actionButtonText}
            </span>
          </>
        )}
      </Button>
      <Button
        type='reset'
        variant='outline'
        disabled={isPending}
        onClick={resetFn}
        size='lg'
      >
        <CircleXIcon />
        <span>{defaultButtonNames ? 'Cancel' : cancelButtonText}</span>
      </Button>
    </div>
  );
}

type FooterFormActionsProps = {
  handleSubmit: () => void;
  handleReset: () => void;
  isSubmitting: boolean;
  saveText?: string;
  saveIcon?: LucideIcon;
  resetText?: string;
  resetIcon?: LucideIcon;
  withMarginTop?: boolean;
  footerClassName?: string;
  buttonGroupClassName?: string;
};

export function FooterFormActions(props: FooterFormActionsProps) {
  return (
    <footer
      className={cn(
        'sticky bottom-0 z-10 border-t bg-background',
        props.withMarginTop ? 'mt-12' : '',
        props.footerClassName,
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-end',
          props.buttonGroupClassName,
        )}
      >
        <Button
          type='button'
          onClick={props.handleSubmit}
          size='lg'
          disabled={props.isSubmitting}
          className='min-w-32'
        >
          <LoadingSwap
            isLoading={props.isSubmitting}
            className='flex gap-2 items-center'
          >
            {props.saveIcon ? <props.saveIcon /> : <SaveIcon />}
            <span>{props.saveText ?? 'Save'}</span>
          </LoadingSwap>
        </Button>
        <Button
          type='button'
          disabled={props.isSubmitting}
          variant='outline'
          size='lg'
          className='min-w-32'
          onClick={() => props.handleReset()}
        >
          {props.resetIcon ? <props.resetIcon /> : <CircleXIcon />}
          <span>{props.resetText ?? 'Cancel'}</span>
        </Button>
      </div>
    </footer>
  );
}
