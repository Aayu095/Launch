import { createGetDb } from "@agent-native/core/db";
import { registerShareableResource } from "@agent-native/core/sharing";

import * as schema from "./schema.js";

export const getDb = createGetDb(schema);
export { schema };

registerShareableResource({
  type: "launch",
  resourceTable: schema.launches,
  sharesTable: schema.launchShares,
  displayName: "Launch",
  titleColumn: "productName",
  getResourcePath: (launch) => `/launch?launch=${launch.id}`,
  getDb,
});
