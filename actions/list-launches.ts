import { defineAction } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { accessFilter } from "@agent-native/core/sharing";
import { desc } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

const launchOut = z.object({
  id: z.string(),
  productName: z.string(),
  oneLiner: z.string(),
  audience: z.string(),
  launchAt: z.string(),
});

export default defineAction({
  description: "List the launches the current user can see, newest first.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  outputSchema: z.object({ launches: z.array(launchOut) }),
  link: () => ({
    url: buildDeepLink({ view: "launch", to: "/launch" }),
    label: "Open Launch",
  }),
  run: async () => {
    const { launches, launchShares } = schema;
    const rows = await getDb()
      .select({
        id: launches.id,
        productName: launches.productName,
        oneLiner: launches.oneLiner,
        audience: launches.audience,
        launchAt: launches.launchAt,
      })
      .from(launches)
      .where(accessFilter(launches, launchShares))
      .orderBy(desc(launches.createdAt))
      .limit(50);
    return { launches: rows };
  },
});
