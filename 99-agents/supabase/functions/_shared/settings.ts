// _shared/settings.ts — effective messaging settings.
// Code defaults overlaid by per-tenant overrides in agent_tenants.config. One resolver,
// used by every function that gates or paces outreach, so the operator can tune timing,
// cadence, and escalation from Settings without a code change. Missing keys → defaults,
// so behavior is identical to the old hardcoded constants until someone overrides them.

export interface EffectiveSettings {
  sendWindowStartHour: number;   // inclusive, 24h, in sendWindowTz
  sendWindowEndHour: number;     // exclusive, 24h
  sendWindowTz: string;          // IANA tz
  followupDayOffsets: number[];  // days since last_contact_at for follow-up #1, #2, #3…
  maxFollowups: number;
  escalationTriggers: string[];  // topics that make on-reply escalate to a human
}

export const SETTINGS_DEFAULTS: EffectiveSettings = {
  sendWindowStartHour: 9,
  sendWindowEndHour: 21,
  sendWindowTz: 'America/Chicago',
  followupDayOffsets: [2, 4, 7],
  maxFollowups: 3,
  escalationTriggers: ['pricing', 'payment', 'contracts', 'speak to a human', 'talk to a human', 'a real person'],
};

export function resolveSettings(tenantConfig: Record<string, unknown> | null | undefined): EffectiveSettings {
  const c = tenantConfig ?? {};
  const num = (v: unknown, d: number) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);
  const arr = <T>(v: unknown, d: T[]) => (Array.isArray(v) && v.length ? (v as T[]) : d);
  const str = (v: unknown, d: string) => (typeof v === 'string' && v ? v : d);
  return {
    sendWindowStartHour: num(c.send_window_start_hour, SETTINGS_DEFAULTS.sendWindowStartHour),
    sendWindowEndHour: num(c.send_window_end_hour, SETTINGS_DEFAULTS.sendWindowEndHour),
    sendWindowTz: str(c.send_window_tz, SETTINGS_DEFAULTS.sendWindowTz),
    followupDayOffsets: arr<number>(c.followup_day_offsets, SETTINGS_DEFAULTS.followupDayOffsets),
    maxFollowups: num(c.max_followups, SETTINGS_DEFAULTS.maxFollowups),
    escalationTriggers: arr<string>(c.escalation_triggers, SETTINGS_DEFAULTS.escalationTriggers),
  };
}

// ── timezone-aware business-hours helpers ──

function tzParts(date: Date, tz: string): { year: number; month: number; day: number; hour: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  });
  const p: Record<string, string> = {};
  dtf.formatToParts(date).forEach(({ type, value }) => { p[type] = value; });
  return { year: +p.year, month: +p.month, day: +p.day, hour: p.hour === '24' ? 0 : +p.hour };
}

// Minutes the tz is ahead of UTC at the given instant (negative for the Americas).
function tzOffsetMinutes(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p: Record<string, string> = {};
  dtf.formatToParts(date).forEach(({ type, value }) => { p[type] = value; });
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === '24' ? 0 : +p.hour, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

export function isInWindow(s: EffectiveSettings, now: Date = new Date()): boolean {
  const { hour } = tzParts(now, s.sendWindowTz);
  return hour >= s.sendWindowStartHour && hour < s.sendWindowEndHour;
}

// Next instant (ISO UTC) when the send window opens — for off-hours queueing.
export function nextWindowOpenUTC(s: EffectiveSettings, now: Date = new Date()): string {
  const local = tzParts(now, s.sendWindowTz);
  let { year, month, day } = local;
  if (local.hour >= s.sendWindowStartHour) {
    const t = tzParts(new Date(now.getTime() + 86_400_000), s.sendWindowTz);
    year = t.year; month = t.month; day = t.day;
  }
  // Build the instant whose tz-local clock reads startHour:00, correcting for the tz
  // offset on that day (handles DST). Mirrors the old Chicago 14/15-UTC approximation
  // for the default case, but works for any tz.
  const guessUTC = Date.UTC(year, month - 1, day, s.sendWindowStartHour, 0, 0);
  const offset = tzOffsetMinutes(new Date(guessUTC), s.sendWindowTz);
  return new Date(guessUTC - offset * 60_000).toISOString();
}
