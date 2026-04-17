import { Platform, Linking } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

function formatICSDate(date: Date): string {
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

function sanitizeForICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function generateICS(title: string, date: Date, description: string): string {
  const uid = `${Date.now()}-danza-app@danzaapp`;
  const dtstart = formatICSDate(date);
  const dtend = formatICSDate(nextDay(date));
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Danza App//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}Z`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${sanitizeForICS(title)}`,
    `DESCRIPTION:${sanitizeForICS(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function googleCalendarUrl(
  title: string,
  date: Date,
  description: string
): string {
  const dtstart = formatICSDate(date);
  const dtend = formatICSDate(nextDay(date));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${dtstart}/${dtend}`,
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function openCalendarEvent(
  title: string,
  date: Date,
  description: string
): Promise<void> {
  if (Platform.OS === "web") {
    // On web: open Google Calendar in new tab
    window.open(googleCalendarUrl(title, date, description), "_blank");
    return;
  }

  if (Platform.OS === "android") {
    // On Android: open Google Calendar via URL
    const url = googleCalendarUrl(title, date, description);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
    return;
  }

  // iOS: generate .ics and share via system share sheet
  try {
    const icsContent = generateICS(title, date, description);
    const fileUri = FileSystem.cacheDirectory + "event.ics";
    await FileSystem.writeAsStringAsync(fileUri, icsContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/calendar",
        UTI: "public.calendar-event",
      });
    }
  } catch {
    // Fallback to Google Calendar URL if sharing fails
    const url = googleCalendarUrl(title, date, description);
    await Linking.openURL(url);
  }
}
