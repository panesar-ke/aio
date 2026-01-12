import { EventSchemas, Inngest } from 'inngest';

type Events = {
  'procurement/supplier.po.email': {
    data: {
      orderId: string;
      userId: string;
    };
  };
  'user/send.new.password': {
    data: {
      contact: string;
      password: string;
      name: string;
    };
  };
};

export const inngest = new Inngest({
  id: 'pkl-aio',
  schemas: new EventSchemas().fromRecord<Events>(),
});
