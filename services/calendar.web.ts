import type { CalendarEvent } from "@/types/calendar";

const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar/render";

/** "20261025": the day as Google Calendar expects it for an all-day event. */
function dayStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function nextDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

/** Opens Google Calendar in a new tab with the event filled in, ready to save. */
export async function addToCalendar({ title, date, notes }: CalendarEvent): Promise<void> {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    // All-day events end on the next day, exclusive.
    dates: `${dayStamp(date)}/${dayStamp(nextDay(date))}`,
    details: notes,
  });
  window.open(`${GOOGLE_CALENDAR_URL}?${params.toString()}`, "_blank", "noopener");
}
