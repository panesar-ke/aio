import { EventSchemas, Inngest } from "inngest";

type Events = {
  "user/send.new.password": {
    data: {
      contact: string;
      password: string;
      name: string;
    };
  };
  "products/import.requested": {
    data: {
      batchId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "pkl-aio",
  schemas: new EventSchemas().fromRecord<Events>(),
});
