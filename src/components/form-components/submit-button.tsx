import type { ComponentProps } from 'react';

import { CheckIcon, Undo2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFormContext } from '@/lib/form';

type SubmitButtonProps = {
  buttonText: string;
  disabled?: boolean;
  isLoading?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  withReset?: boolean;
  onReset?: () => void;
  icon?: React.ReactNode;
};

export function SubmitButton({
  buttonText,
  disabled,
  isLoading,
  orientation,
  withReset = true,
  onReset,
  icon: Icon,
}: SubmitButtonProps & ComponentProps<'button'>) {
  const form = useFormContext();
  const isMobile = useIsMobile();
  return (
    <form.Subscribe selector={state => [state.isSubmitting]}>
      {([isSubmitting]) => (
        <Field
          orientation={isMobile ? 'vertical' : orientation || 'horizontal'}
          className="flex-row justify-end"
        >
          {withReset && (
            <Button
              type="button"
              disabled={isSubmitting}
              variant="outline"
              onClick={onReset ? () => onReset() : () => form.reset()}
            >
              <Undo2Icon />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex"
            disabled={isSubmitting || disabled || isLoading}
          >
            <LoadingSwap
              isLoading={isSubmitting || !!isLoading}
              className="flex items-center gap-2"
            >
              {Icon ?? <CheckIcon />}
              {buttonText}
            </LoadingSwap>
          </Button>
        </Field>
      )}
    </form.Subscribe>
  );
}
