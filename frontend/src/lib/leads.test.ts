import { describe, it, expect } from "vitest";
import { groupLeads } from "./leads";
import { LeadSummary } from "@/types";

describe("groupLeads", () => {
  const now = new Date("2026-10-13T12:00:00Z");

  const sampleLeads: LeadSummary[] = [
    {
      id: 1,
      name: "Due Today Lead",
      company: "Acme",
      phone: null,
      status: "proposal_sent",
      follow_up_at: "2026-10-13T15:00:00Z",
      created_at: "2026-10-01T00:00:00Z",
      last_note: "Note 1",
      last_discussion_at: "2026-10-10T00:00:00Z",
    },
    {
      id: 2,
      name: "Overdue Lead",
      company: "Initech",
      phone: null,
      status: "contacted",
      follow_up_at: "2026-10-11T10:00:00Z",
      created_at: "2026-10-01T00:00:00Z",
      last_note: "Note 2",
      last_discussion_at: "2026-10-10T00:00:00Z",
    },
    {
      id: 3,
      name: "Future Lead",
      company: "Stark",
      phone: null,
      status: "qualified",
      follow_up_at: "2026-10-15T10:00:00Z",
      created_at: "2026-10-01T00:00:00Z",
      last_note: "Note 3",
      last_discussion_at: "2026-10-10T00:00:00Z",
    },
    {
      id: 4,
      name: "Won Lead with Followup",
      company: "Wayne",
      phone: null,
      status: "won",
      follow_up_at: "2026-10-13T14:00:00Z", // today, but won -> exempt
      created_at: "2026-10-01T00:00:00Z",
      last_note: "Note 4",
      last_discussion_at: "2026-10-10T00:00:00Z",
    },
    {
      id: 5,
      name: "No Followup Lead",
      company: null,
      phone: null,
      status: "new",
      follow_up_at: null,
      created_at: "2026-10-01T00:00:00Z",
      last_note: "Note 5",
      last_discussion_at: "2026-10-10T00:00:00Z",
    },
  ];

  it("pins today and overdue leads, excludes won/lost from pinned, and ensures no duplicates", () => {
    const { pinned, allLeads, statusCounts, totalCount } = groupLeads(sampleLeads, now);

    expect(totalCount).toBe(5);
    expect(pinned.map((l) => l.id)).toEqual([2, 1]); // overdue first (id 2), then today (id 1)
    expect(allLeads.map((l) => l.id)).toEqual([3, 4, 5]);

    expect(statusCounts.proposal_sent).toBe(1);
    expect(statusCounts.contacted).toBe(1);
    expect(statusCounts.qualified).toBe(1);
    expect(statusCounts.won).toBe(1);
    expect(statusCounts.new).toBe(1);
  });
});
