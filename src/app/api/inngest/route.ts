import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { runStoreProductDeactivation } from "@/inngest/functions/store-product-deactivation";
import { sendUserNewPassword } from "@/inngest/functions/users";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendUserNewPassword, runStoreProductDeactivation],
  streaming: "allow",
});
