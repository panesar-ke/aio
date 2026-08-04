import { EventSchemas, Inngest } from "inngest";

type Events = {
  "user/send.new.password": {
    data: {
      contact: string;
      password: string;
      name: string;
    };
  };
  "store/run.product-deactivation": {
    data: {
      requestId: string;
      source: "vercel-cron";
      triggeredAt: string;
    };
  };
};

export const inngest = new Inngest({
  id: "pkl-aio",
  schemas: new EventSchemas().fromRecord<Events>(),
});
