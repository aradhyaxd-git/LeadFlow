import { LEAD_STATUSES, LeadStatus, LeadSummary, STATUS_LABELS } from "@/types";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  leads: LeadSummary[];
  onSelectLead: (leadId: number) => void;
  onQuickAdvance: (leadId: number, nextStatus: LeadStatus) => void;
}

const COLUMN_COLORS: Record<LeadStatus, { header: string; border: string }> = {
  new: { header: "bg-blue-100/70 text-blue-800", border: "border-blue-200" },
  contacted: { header: "bg-amber-100/70 text-amber-800", border: "border-amber-200" },
  qualified: { header: "bg-indigo-100/70 text-indigo-800", border: "border-indigo-200" },
  proposal_sent: { header: "bg-purple-100/70 text-purple-800", border: "border-purple-200" },
  won: { header: "bg-emerald-100/70 text-emerald-800", border: "border-emerald-200" },
  lost: { header: "bg-slate-200/70 text-slate-700", border: "border-slate-300" },
};

export function KanbanBoard({
  leads,
  onSelectLead,
  onQuickAdvance,
}: KanbanBoardProps) {
  // Group leads into status columns
  const columns = LEAD_STATUSES.map((status) => {
    return {
      status,
      label: STATUS_LABELS[status],
      items: leads.filter((lead) => lead.status === status),
    };
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 scrollbar-thin">
      {columns.map((col) => {
        return (
          <div
            key={col.status}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200/80 bg-[#ebecf0]/60 p-2.5 shadow-2xs"
          >
            {/* Column Header */}
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${COLUMN_COLORS[col.status].header}`}>
                  {col.label}
                </span>
                <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10.5px] font-semibold text-slate-600 tabular-nums">
                  {col.items.length}
                </span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
              {col.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300/80 p-6 text-center text-xs text-slate-400">
                  No leads in {col.label}
                </div>
              ) : (
                col.items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => onSelectLead(lead.id)}
                    onQuickAdvance={onQuickAdvance}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
