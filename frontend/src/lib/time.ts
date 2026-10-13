/**
 * Pure date & time utilities.
 * All functions accept an optional `now` parameter for deterministic testing.
 */

export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(iso: string | null | undefined, now: Date = new Date()): boolean {
  const d = parseDate(iso);
  if (!d) return false;
  return isSameDay(d, now);
}

export function isOverdue(iso: string | null | undefined, now: Date = new Date()): boolean {
  const d = parseDate(iso);
  if (!d) return false;
  return d.getTime() < now.getTime();
}

export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string {
  const d = parseDate(iso);
  if (!d) return "";

  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) {
    // In future or very slight negative clock drift
    return "just now";
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

export function formatTimeOnly(d: Date): string {
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minStr} ${ampm}`;
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return "";
  return `${formatDateShort(d)}, ${formatTimeOnly(d)}`;
}

export interface FollowUpDescription {
  type: "today" | "overdue" | "future" | "none";
  label: string;
  badgeClass: string;
}

export function describeFollowUp(
  iso: string | null | undefined,
  now: Date = new Date()
): FollowUpDescription {
  const d = parseDate(iso);
  if (!d) {
    return { type: "none", label: "", badgeClass: "" };
  }

  const overdue = isOverdue(iso, now);
  const today = isToday(iso, now);

  if (overdue && !today) {
    // Overdue on a prior day
    const diffMs = now.getTime() - d.getTime();
    const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return {
      type: "overdue",
      label: `Overdue by ${days} ${days === 1 ? "day" : "days"} (${formatDateShort(d)})`,
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (today) {
    if (overdue) {
      return {
        type: "today",
        label: `Follow-up overdue today (${formatTimeOnly(d)})`,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    return {
      type: "today",
      label: `Follow-up today at ${formatTimeOnly(d)}`,
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  return {
    type: "future",
    label: `Follow-up: ${formatDateShort(d)} at ${formatTimeOnly(d)}`,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  };
}
