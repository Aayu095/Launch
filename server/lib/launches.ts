import { fail } from "@agent-native/core/action";
import { accessFilter } from "@agent-native/core/sharing";
import { and, eq } from "drizzle-orm";

import { getDb, schema } from "../db/index.js";

/** Validate an ISO 8601 date-time with offset and normalize it to UTC ISO text. */
export function toIso(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    fail(`${field} must include a time and UTC offset.`, {
      errorCode: "invalid_time",
    });
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    fail(`${field} must be an ISO 8601 date-time.`, {
      errorCode: "invalid_time",
    });
  }
  return new Date(ms).toISOString();
}

/** Load a launch the current caller can access, or fail 404. */
export async function accessibleLaunch(launchId: string) {
  const { launches, launchShares } = schema;
  const [launch] = await getDb()
    .select({
      id: launches.id,
      productName: launches.productName,
      oneLiner: launches.oneLiner,
      audience: launches.audience,
      launchAt: launches.launchAt,
      orgId: launches.orgId,
    })
    .from(launches)
    .where(and(eq(launches.id, launchId), accessFilter(launches, launchShares)))
    .limit(1);
  if (!launch) {
    fail("Launch not found.", { errorCode: "not_found", statusCode: 404 });
  }
  return launch!;
}
