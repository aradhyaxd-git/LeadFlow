import { LeadStatus, LeadSummary } from "@/types";
import { LeadCard } from "./LeadCard";

interface LeadListProps {
  leads: LeadSummary[];
  onSelectLead: (leadId: number) => void;
  onQuickAdvance?: (leadId: number, nextStatus: LeadStatus) => void;
}

export function LeadList({ leads, onSelectLead, onQuickAdvance }: LeadListProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-12 text-center shadow-2xs">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <span className="text-base font-semibold">∅</span>
        </div>
        <p className="text-sm font-semibold text-slate-800">No leads match your criteria</p>
        <p className="mt-1 text-xs text-slate-400">
          Try resetting your status filter or clearing your search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onClick={() => onSelectLead(lead.id)}
          onQuickAdvance={onQuickAdvance}
        />
      ))}
    </div>
  );
}
