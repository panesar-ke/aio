export type ActionResult<T = undefined> =
  | {
      error: false;
      message: string;
      data?: T;
    }
  | {
      error: true;
      message: string;
    };
