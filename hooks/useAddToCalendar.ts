import { useCallback } from "react";
import { addToCalendar } from "@/services/calendar";
import { TOAST_LONG_DURATION_MS, ToastTone } from "@/constants/toast";
import { useToast } from "@/providers/ToastProvider";
import type { CalendarEvent } from "@/types/calendar";

const CALENDAR_ERROR_MESSAGE =
  "We couldn't open your calendar. Check that Danza App has access to it in Settings.";

/** `addToCalendar`, telling the user when the calendar can't be opened. */
export function useAddToCalendar() {
  const { showToast } = useToast();

  return useCallback(
    async (event: CalendarEvent) => {
      try {
        await addToCalendar(event);
      } catch (error) {
        console.warn("Could not add the event to the calendar", error);
        showToast({ message: CALENDAR_ERROR_MESSAGE, tone: ToastTone.WARNING, duration: TOAST_LONG_DURATION_MS });
      }
    },
    [showToast],
  );
}
