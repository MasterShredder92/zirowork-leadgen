import { useMemo } from "react";
import { useRealtimeTable } from "./useRealtimeTable";
import { derivePageFunnel } from "@/lib/derive/pageFunnel";
import type { PageEvent, ClientPage, Lead, Booking, Enrollment } from "@/lib/derive/types";

export function usePageFunnel(sinceMs?: number | null) {
  const pageEvents  = useRealtimeTable<PageEvent>("page_events", undefined, "fnl").data;
  const clientPages = useRealtimeTable<ClientPage>("client_pages", undefined, "fnl").data;
  const leads       = useRealtimeTable<Lead>("leads", undefined, "fnl").data;
  const bookings    = useRealtimeTable<Booking>("bookings", undefined, "fnl").data;
  const enrollments = useRealtimeTable<Enrollment>("enrollments", undefined, "fnl").data;
  return useMemo(
    () => derivePageFunnel({ pageEvents, clientPages, leads, bookings, enrollments }, sinceMs),
    [pageEvents, clientPages, leads, bookings, enrollments, sinceMs],
  );
}
