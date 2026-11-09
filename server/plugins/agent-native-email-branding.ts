import { defineAppConfig } from "@agent-native/core/server";

export default defineAppConfig({
  app: {
    // This name appears in transactional emails. Change it to your product name.
    name: "Launch",
    // The source template keeps a renamed app from inheriting first-party email branding.
    sourceTemplate: "chat",
    // Authenticated entry: the in-app dashboard at /dashboard — the user's
    // own launches, countdown and readiness. The public website lives at
    // "/" and the runway board at /launch.
    homePath: "/dashboard",
    // Optional: use your own absolute HTTPS logo URL in transactional emails.
    // logoUrl: "https://example.com/logo.png",
  },
});
