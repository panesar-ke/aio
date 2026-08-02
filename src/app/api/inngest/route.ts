import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { deactivateStaleProducts } from "@/inngest/functions/store";
import { sendUserNewPassword } from "@/inngest/functions/users";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendUserNewPassword, deactivateStaleProducts],
});
