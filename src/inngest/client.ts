import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'pkl-aio',
  isDev: process.env.NODE_ENV !== 'production',
  checkpointing: {
    maxRuntime: '50s',
  },
});
