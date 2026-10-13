import { LeadStatus, STATUS_LABELS } from "@/types";

// Jira/Linear refined lozenge styles with subtle background and crisp contrast
const BADGE_STYLES: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  new: {
    bg: "bg-blue-50/80 border-blue-200/80",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  contacted: {
    bg: "bg-amber-50/80 border-amber-200/80",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  qualified: {
    bg: "bg-indigo-50/80 border-indigo-200/80",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  proposal_sent: {
    bg: "bg-purple-50/80 border-purple-200/80",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  won: {
    bg: "bg-emerald-50/80 border-emerald-200/80",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  lost: {
    bg: "bg-slate-100 border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
};

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  className = "",
  showDot = true,
}: StatusBadgeProps) {
  const style = BADGE_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ${style.bg} ${style.text} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}
