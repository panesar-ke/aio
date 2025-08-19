import { useState } from 'react';

export function useError() {
  const [errors, setErrors] = useState<string | Array<string>>();

  function onError(err: string | Array<string>) {
    setErrors(err);
  }

  function clearErrors() {
    setErrors(undefined);
  }

  return { errors, onError, clearErrors };
}
