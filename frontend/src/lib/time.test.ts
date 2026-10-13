import { describe, it, expect } from "vitest";
import { isToday, isOverdue, timeAgo, formatDateTime, describeFollowUp } from "./time";

describe("time utilities", () => {
  const baseNow = new Date("2026-10-13T12:00:00Z");

  it("identifies isToday correctly across UTC and local time", () => {
    // Same calendar date in local time
    const sameDay = new Date(baseNow);
    sameDay.setHours(sameDay.getHours() + 2);
    expect(isToday(sameDay.toISOString(), baseNow)).toBe(true);

    // 2 days ago
    const pastDay = new Date(baseNow);
    pastDay.setDate(pastDay.getDate() - 2);
    expect(isToday(pastDay.toISOString(), baseNow)).toBe(false);

    // 2 days ahead
    const futureDay = new Date(baseNow);
    futureDay.setDate(futureDay.getDate() + 2);
    expect(isToday(futureDay.toISOString(), baseNow)).toBe(false);
    // Null/undefined
    expect(isToday(null, baseNow)).toBe(false);
  });

  it("identifies isOverdue correctly", () => {
    // 1 hour ago
    expect(isOverdue("2026-10-13T11:00:00Z", baseNow)).toBe(true);
    // 1 hour in future
    expect(isOverdue("2026-10-13T13:00:00Z", baseNow)).toBe(false);
  });

  it("calculates timeAgo relative strings accurately", () => {
    expect(timeAgo("2026-10-13T11:59:30Z", baseNow)).toBe("just now");
    expect(timeAgo("2026-10-13T11:45:00Z", baseNow)).toBe("15m ago");
    expect(timeAgo("2026-10-13T10:00:00Z", baseNow)).toBe("2 hours ago");
    expect(timeAgo("2026-10-11T12:00:00Z", baseNow)).toBe("2 days ago");
    expect(timeAgo("2026-09-29T12:00:00Z", baseNow)).toBe("2 weeks ago");
    expect(timeAgo("2026-08-13T12:00:00Z", baseNow)).toBe("2 months ago");
  });

  it("formats dates and generates follow-up descriptions", () => {
    expect(formatDateTime("2026-10-13T14:30:00Z")).toContain("Oct 13");

    // Overdue on a previous day
    const pastDesc = describeFollowUp("2026-10-11T10:00:00Z", baseNow);
    expect(pastDesc.type).toBe("overdue");
    expect(pastDesc.badgeClass).toContain("red");

    // Today future
    const todayDesc = describeFollowUp("2026-10-13T16:00:00Z", baseNow);
    expect(todayDesc.type).toBe("today");
    expect(todayDesc.badgeClass).toContain("blue");

    // Future day
    const futureDesc = describeFollowUp("2026-10-18T10:00:00Z", baseNow);
    expect(futureDesc.type).toBe("future");
  });
});
