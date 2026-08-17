/** Activity log repository — GET /activity (spec §5.11 audit trail). */

import { api, Page } from "@/lib/api/client";
import { useCollection } from "@/lib/query";
import type { AuditEvent } from "@/lib/types";

const fetchActivity = async () =>
  (await api<Page<AuditEvent>>("/activity?limit=50")).data;

export function useActivity() {
  return useCollection<AuditEvent>(["activity"], fetchActivity);
}
