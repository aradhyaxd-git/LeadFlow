import { LeadSummary } from "@/types";

function formatDateForGoogle(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

/**
 * Generate a Google Calendar link with a pre-configured Google Meet video call.
 */
export function getGoogleMeetUrl(lead: LeadSummary): string {
  const title = `Follow-up Call with ${lead.name}${lead.company ? ` (${lead.company})` : ""}`;
  const details = `Follow-up discussion scheduled via LeadFlow CRM.\nLead: ${lead.name}\nCompany: ${lead.company ?? "N/A"}\nPhone: ${lead.phone ?? "N/A"}\nLast Note: ${lead.last_note ?? "None"}`;

  let start = lead.follow_up_at ? new Date(lead.follow_up_at) : new Date();
  if (isNaN(start.getTime()) || start.getTime() < Date.now()) {
    // If no future follow-up set, schedule for tomorrow at 10:00 AM
    start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 mins

  const datesParam = `${formatDateForGoogle(start)}/${formatDateForGoogle(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details,
    dates: datesParam,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
