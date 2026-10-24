import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import type { CalendarEvent } from "@/types/calendar";

/**
 * Opens the system's "new event" screen with the event filled in; the user
 * picks the calendar and saves it there. iOS only shows that screen once the
 * app has calendar access. Android hands it to the calendar app and needs none.
 */
export async function addToCalendar({ title, date, notes }: CalendarEvent): Promise<void> {
  if (Platform.OS === "ios") {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) throw new Error("Calendar access was not granted.");
  }
  await Calendar.createEventInCalendarAsync({
    title,
    notes,
    startDate: date,
    endDate: date,
    allDay: true,
  });
}
