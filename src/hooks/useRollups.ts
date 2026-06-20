import { useMemo } from "react";
import { useRealtimeTable } from "./useRealtimeTable";
import { deriveRollups } from "@/lib/derive/rollups";
import type { Lead, Booking, Enrollment, Campaign, Escalation } from "@/lib/derive/types";

// Distinct channel key 'roll' so it never collides with a page's own subscriptions.
// TRAP: open escalations come from ziro_messaging_escalations (the table the Escalations page
// treats as truth), NOT the 'escalations' table. Do not collapse the two.
export function useRollups() {
  const leads       = useRealtimeTable<Lead>("leads", undefined, "roll").data;
  const bookings    = useRealtimeTable<Booking>("bookings", undefined, "roll").data;
  const enrollments = useRealtimeTable<Enrollment>("enrollments", undefined, "roll").data;
  const campaigns   = useRealtimeTable<Campaign>("campaigns", undefined, "roll").data;
  const escalations = useRealtimeTable<Escalation>("ziro_messaging_escalations", undefined, "roll").data;
  return useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => deriveRollups({ leads, bookings, enrollments, campaigns, escalations }, Date.now()),
    [leads, bookings, enrollments, campaigns, escalations],
  );
}
