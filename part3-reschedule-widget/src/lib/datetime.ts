// Local-time-in-the-UI / UTC-on-the-wire is the one non-obvious rule this
// widget has to get right — a parent in Chennai and a parent in Toronto must
// each see and pick times in their own clock, but the two timestamps that
// end up in Firestore need to be directly comparable, so storage is always UTC.

/**
 * Format a Date as the value <input type="datetime-local"> expects:
 * "YYYY-MM-DDTHH:mm", in the *browser's local time zone*.
 *
 * The tempting shortcut is `date.toISOString().slice(0, 16)` — it produces a
 * string that looks right but toISOString() is always UTC. Anywhere the
 * local UTC offset isn't 0 (i.e. almost everywhere, most of the year), that
 * would set the input's min/value to the wrong local wall-clock time. Build
 * the string from the Date object's local getters instead.
 */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * <input type="datetime-local"> hands back a timezone-naive string like
 * "2026-08-12T14:30" — no offset, no "Z". Per the JS Date spec, a date-time
 * string with no timezone designator is parsed as *local* time, which is
 * exactly what we want: whatever the parent typed is what they meant in
 * their own timezone, not UTC.
 */
export function parseDatetimeLocalValue(value: string): Date {
  return new Date(value);
}

/** Convert a local Date to the UTC ISO string that's stored/sent to the backend. */
export function toUtcIso(date: Date): string {
  return date.toISOString();
}

/** Render a stored UTC ISO string back into the viewer's local time for display. */
export function formatLocal(isoUtc: string): string {
  return new Date(isoUtc).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
