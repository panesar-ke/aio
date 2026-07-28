export type ActionResult<T = undefined> =
  | {
      error: false;
      message: string;
      data?: T;
      redirectTo?: string;
    }
  | {
      error: true;
      message: string;
    };
