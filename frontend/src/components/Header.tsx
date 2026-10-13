import { useState, useRef, useEffect } from "react";
import {
  Plus,
  LayoutGrid,
  Bell,
  Kanban,
  Download,
  Calendar,
  AlertTriangle,
  Building,
} from "lucide-react";
import { describeFollowUp } from "@/lib/time";
import { LeadSummary } from "@/types";

interface HeaderProps {
  onAddLeadClick: () => void;
  viewMode: "grid" | "kanban";
  onViewModeChange: (mode: "grid" | "kanban") => void;
  onExportCsv: () => void;
  reminderLeads: LeadSummary[];
  onSelectLead: (leadId: number) => void;
}

export function Header({
  onAddLeadClick,
  viewMode,
  onViewModeChange,
  onExportCsv,
  reminderLeads,
  onSelectLead,
}: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close notifications popover on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

  const reminderCount = reminderLeads.length;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Single unified Brand & Workspace label */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0052cc] to-[#0747a6] text-white shadow-xs">
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-[#172b4d]">
              LeadFlow
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-500">
              Pipeline Board
            </span>
          </div>
        </div>

        {/* Right: Consolidated Controls (View Mode + Export + Bell + Create CTA) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`btn-press flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-[#0052cc] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List / Grid</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("kanban")}
              className={`btn-press flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-[#0052cc] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCsv}
            title="Export leads to CSV"
            className="btn-press hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Notification Reminders Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              aria-label={`Follow-up reminders (${reminderCount} pending)`}
              aria-expanded={isNotificationsOpen}
              className={`btn-press relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                isNotificationsOpen
                  ? "border-[#0052cc] bg-[#deebff]/40 text-[#0052cc]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              {reminderCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9.5px] font-bold text-white shadow-2xs">
                  {reminderCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 bg-[#f4f5f7] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-[#0052cc]" />
                    <span className="text-xs font-bold text-[#172b4d]">
                      Follow-up Reminders
                    </span>
                  </div>
                  <span className="rounded bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10.5px] font-semibold text-rose-700 tabular-nums">
                    {reminderCount} {reminderCount === 1 ? "pending" : "pending"}
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {reminderCount === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <p className="text-xs font-medium text-slate-700">
                        🎉 All caught up!
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        No pending follow-ups due today.
                      </p>
                    </div>
                  ) : (
                    reminderLeads.map((lead) => {
                      const followUp = describeFollowUp(lead.follow_up_at);
                      const isOverdue = followUp.type === "overdue";

                      return (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => {
                            onSelectLead(lead.id);
                            setIsNotificationsOpen(false);
                          }}
                          className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                        >
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                              isOverdue
                                ? "bg-rose-100 text-rose-700"
                                : "bg-blue-100 text-[#0052cc]"
                            }`}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {lead.name}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold shrink-0 ${
                                  isOverdue
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-blue-50 text-[#0747a6] border border-blue-200"
                                }`}
                              >
                                {followUp.label}
                              </span>
                            </div>

                            {lead.company && (
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                <Building className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{lead.company}</span>
                              </div>
                            )}

                            {lead.last_note && (
                              <p className="mt-1 text-[11px] text-slate-600 line-clamp-1 italic">
                                &quot;{lead.last_note}&quot;
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {reminderCount > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[10.5px] text-slate-500">
                    Click any reminder to view timeline and take action
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={onAddLeadClick}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-[#0052cc] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0747a6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc] focus-visible:ring-offset-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>
    </header>
  );
}
