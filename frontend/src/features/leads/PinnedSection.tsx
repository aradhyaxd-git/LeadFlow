import { Pin, CalendarClock } from "lucide-react";
import { LeadStatus, LeadSummary } from "@/types";
import { LeadCard } from "./LeadCard";

interface PinnedSectionProps {
  pinnedLeads: LeadSummary[];
  onSelectLead: (leadId: number) => void;
  onQuickAdvance?: (leadId: number, nextStatus: LeadStatus) => void;
}

export function PinnedSection({
  pinnedLeads,
  onSelectLead,
  onQuickAdvance,
}: PinnedSectionProps) {
  if (pinnedLeads.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-800">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-100/80 text-rose-600">
            <Pin className="h-3 w-3 fill-rose-600" />
          </div>
          <span className="font-bold">Today&apos;s Follow-ups</span>
          <span className="rounded-full bg-rose-50 px-2 py-0.2 text-[10.5px] font-semibold text-rose-700 border border-rose-200/60 tabular-nums">
            {pinnedLeads.length}
          </span>
        </div>

        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <CalendarClock className="h-3 w-3" />
          <span>Requires attention today</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {pinnedLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isPinned={true}
            onClick={() => onSelectLead(lead.id)}
            onQuickAdvance={onQuickAdvance}
          />
        ))}
      </div>
    </section>
  );
}
