import {
  Bell,
  AlertTriangle,
  Building,
  Clock,
  CheckSquare,
  ArrowRight,
  Video,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { describeFollowUp, timeAgo } from "@/lib/time";
import { getGoogleMeetUrl } from "@/lib/calendar";
import { LeadStatus, LeadSummary } from "@/types";

interface LeadCardProps {
  lead: LeadSummary;
  onClick: () => void;
  isPinned?: boolean;
  onQuickAdvance?: (leadId: number, nextStatus: LeadStatus) => void;
}

const NEXT_STATUS: Record<LeadStatus, LeadStatus | null> = {
  new: "contacted",
  contacted: "qualified",
  qualified: "proposal_sent",
  proposal_sent: "won",
  won: null,
  lost: null,
};

export function LeadCard({
  lead,
  onClick,
  isPinned = false,
  onQuickAdvance,
}: LeadCardProps) {
  const followUp = describeFollowUp(lead.follow_up_at);
  const isWonOrLost = lead.status === "won" || lead.status === "lost";
  const nextStage = NEXT_STATUS[lead.status];

  const handleAdvance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextStage && onQuickAdvance) {
      onQuickAdvance(lead.id, nextStage);
    }
  };

  const handleGoogleMeet = (e: React.MouseEvent) => {
    e.stopPropagation();
    const meetUrl = getGoogleMeetUrl(lead);
    window.open(meetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`jira-card group relative flex flex-col justify-between rounded-lg border p-3.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc] ${
        isPinned
          ? followUp.type === "overdue"
            ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50/80"
            : "border-[#4c9aff]/60 bg-[#deebff]/40 hover:bg-[#deebff]/70"
          : isWonOrLost
          ? "border-slate-200 bg-white/70 opacity-80 hover:opacity-100 hover:border-slate-300"
          : "border-slate-200 bg-white hover:border-[#4c9aff]/70"
      }`}
    >
      {/* Top Header: Issue Type Icon + Key + Lead Name */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-xs bg-[#0052cc] text-white">
              <CheckSquare className="h-2.5 w-2.5" />
            </span>
            <span className="text-[11px] font-mono font-semibold text-[#0052cc] group-hover:underline">
              LEAD-{lead.id}
            </span>
            <span className="text-slate-300">·</span>
            <span className="truncate text-sm font-semibold tracking-tight text-[#172b4d] group-hover:text-[#0052cc] transition-colors">
              {lead.name}
            </span>
          </div>

          {lead.company && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-normal">
              <Building className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
        </div>

        <StatusBadge status={lead.status} />
      </div>

      {/* Middle row: Activity note preview */}
      {lead.last_note && (
        <div className="mt-3 rounded border border-slate-100 bg-[#f4f5f7]/70 p-2 text-xs text-slate-700">
          <p className="line-clamp-2 text-slate-700 leading-relaxed font-normal">
            <span className="font-semibold text-slate-500">Activity: </span>
            {lead.last_note}
          </p>
          {lead.last_discussion_at && (
            <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-slate-400">
              <Clock className="h-3 w-3" />
              <span>{timeAgo(lead.last_discussion_at)}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom row: Follow-up indicator & Quick Actions */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
        <div>
          {lead.follow_up_at ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold tracking-tight ${
                followUp.type === "overdue"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-[#deebff] text-[#0747a6] border-[#b3d4ff]"
              }`}
            >
              {followUp.type === "overdue" ? (
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              ) : (
                <Bell className="h-3.5 w-3.5 text-[#0052cc] shrink-0" />
              )}
              <span>{followUp.label}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">No follow-up set</span>
          )}
        </div>

        {/* Hover / Quick Actions: Schedule Meet + Quick Advance */}
        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {/* Schedule Google Meet button */}
          <button
            type="button"
            title="Schedule Google Meet"
            onClick={handleGoogleMeet}
            className="btn-press flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
          >
            <Video className="h-3 w-3" />
          </button>

          {/* Quick Stage Advance */}
          {nextStage && onQuickAdvance && (
            <button
              type="button"
              title={`Advance to ${nextStage}`}
              onClick={handleAdvance}
              className="btn-press flex items-center gap-1 rounded border border-blue-200 bg-blue-50/80 px-1.5 py-0.5 text-[11px] font-semibold text-[#0052cc] hover:bg-blue-100"
            >
              <span>Next</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
