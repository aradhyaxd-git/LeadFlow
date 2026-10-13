import { LeadStatus, LeadSummary } from "@/types";
import { isOverdue, isToday } from "./time";

export interface GroupedLeads {
  pinned: LeadSummary[];
  allLeads: LeadSummary[];
  statusCounts: Record<LeadStatus, number>;
  totalCount: number;
}

/**
 * Group and sort leads per product rules:
 * - Pinned: follow_up_at is today or overdue AND status is NOT 'won' or 'lost'
 * - Pinned leads are sorted: overdue first (earliest follow_up_at first), then today (earliest first)
 * - Pinned leads do NOT appear in allLeads (no duplicate rows)
 * - Status counts are computed across all leads
 */
export function groupLeads(
  leads: LeadSummary[],
  now: Date = new Date()
): GroupedLeads {
  const statusCounts: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal_sent: 0,
    won: 0,
    lost: 0,
  };

  const pinned: LeadSummary[] = [];
  const rest: LeadSummary[] = [];

  for (const lead of leads) {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;

    const hasFollowUp = Boolean(lead.follow_up_at);
    const isExemptStatus = lead.status === "won" || lead.status === "lost";
    const dueTodayOrOverdue =
      hasFollowUp && (isToday(lead.follow_up_at, now) || isOverdue(lead.follow_up_at, now));

    if (dueTodayOrOverdue && !isExemptStatus) {
      pinned.push(lead);
    } else {
      rest.push(lead);
    }
  }

  // Sort pinned: overdue first, then earliest time first
  pinned.sort((a, b) => {
    const timeA = new Date(a.follow_up_at!).getTime();
    const timeB = new Date(b.follow_up_at!).getTime();
    return timeA - timeB;
  });

  return {
    pinned,
    allLeads: rest,
    statusCounts,
    totalCount: leads.length,
  };
}
