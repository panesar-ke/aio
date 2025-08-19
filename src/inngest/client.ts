import { EventSchemas, Inngest } from 'inngest';

type Events = {
  'procurement/supplier.po.email': {
    data: {
      orderId: string;
      userId: string;
    };
  };
};

export const inngest = new Inngest({
  id: 'pkl-aio',
  schemas: new EventSchemas().fromRecord<Events>(),
});
