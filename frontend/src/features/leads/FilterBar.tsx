import { Search, X, Filter } from "lucide-react";
import { LEAD_STATUSES, LeadStatus, STATUS_LABELS } from "@/types";

interface FilterBarProps {
  selectedStatus: LeadStatus | null;
  onSelectStatus: (status: LeadStatus | null) => void;
  statusCounts: Record<LeadStatus, number>;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function FilterBar({
  selectedStatus,
  onSelectStatus,
  statusCounts,
  totalCount,
  searchQuery,
  onSearchChange,
  searchInputRef,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
      {/* Jira Board Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="flex items-center gap-1 px-1.5 text-xs font-semibold text-slate-500 shrink-0">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden md:inline">Quick Filters:</span>
        </div>

        <button
          type="button"
          onClick={() => onSelectStatus(null)}
          className={`btn-press inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors shrink-0 ${
            selectedStatus === null
              ? "bg-[#0052cc] text-white shadow-2xs"
              : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
          }`}
        >
          <span>All</span>
          <span
            className={`rounded-sm px-1.5 py-0.2 text-[10.5px] tabular-nums ${
              selectedStatus === null
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {totalCount}
          </span>
        </button>

        {LEAD_STATUSES.map((status) => {
          const isSelected = selectedStatus === status;
          const count = statusCounts[status] || 0;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onSelectStatus(isSelected ? null : status)}
              className={`btn-press inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors shrink-0 ${
                isSelected
                  ? "bg-[#0052cc] text-white shadow-2xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              <span>{STATUS_LABELS[status]}</span>
              <span
                className={`rounded-sm px-1.5 py-0.2 text-[10.5px] tabular-nums ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Jira Quick Search Input */}
      <div className="relative min-w-[200px] sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads or company... (⌘K)"
          className="w-full rounded border border-slate-300 bg-slate-50/50 py-1.5 pl-8 pr-7 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-[#0052cc] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
