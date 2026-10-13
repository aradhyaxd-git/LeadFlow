import { Flame, Clock, Award, Users } from "lucide-react";
import { LeadStatus } from "@/types";

interface PipelineMetricsProps {
  totalLeads: number;
  dueTodayCount: number;
  overdueCount: number;
  wonCount: number;
  selectedStatus: LeadStatus | null;
  onFilterToday: () => void;
  onFilterWon: () => void;
  onFilterAll: () => void;
}

export function PipelineMetrics({
  totalLeads,
  dueTodayCount,
  overdueCount,
  wonCount,
  selectedStatus,
  onFilterToday,
  onFilterWon,
  onFilterAll,
}: PipelineMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {/* 1. Total Active Leads */}
      <button
        type="button"
        onClick={onFilterAll}
        className={`jira-card flex items-center justify-between rounded-lg border p-3 text-left bg-white transition-all ${
          selectedStatus === null
            ? "border-[#0052cc] ring-1 ring-[#0052cc]/30 shadow-xs"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Leads
          </p>
          <p className="text-xl font-bold tracking-tight text-[#172b4d] mt-0.5">
            {totalLeads}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-[#0052cc]">
          <Users className="h-4 w-4" />
        </div>
      </button>

      {/* 2. Today's Due Follow-ups */}
      <button
        type="button"
        onClick={onFilterToday}
        className="jira-card flex items-center justify-between rounded-lg border border-blue-200/90 bg-[#deebff]/30 p-3 text-left hover:bg-[#deebff]/50 transition-all hover:border-blue-300"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0052cc]">
            Due Today
          </p>
          <p className="text-xl font-bold tracking-tight text-[#0747a6] mt-0.5">
            {dueTodayCount}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#deebff] text-[#0052cc]">
          <Clock className="h-4 w-4" />
        </div>
      </button>

      {/* 3. Overdue Follow-ups */}
      <div
        className={`flex items-center justify-between rounded-lg border p-3 text-left ${
          overdueCount > 0
            ? "border-rose-200 bg-rose-50/60"
            : "border-slate-200 bg-white"
        }`}
      >
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              overdueCount > 0 ? "text-rose-700" : "text-slate-500"
            }`}
          >
            Overdue
          </p>
          <p
            className={`text-xl font-bold tracking-tight mt-0.5 ${
              overdueCount > 0 ? "text-rose-800" : "text-slate-800"
            }`}
          >
            {overdueCount}
          </p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-md ${
            overdueCount > 0
              ? "bg-rose-100 text-rose-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <Flame className="h-4 w-4" />
        </div>
      </div>

      {/* 4. Deals Won */}
      <button
        type="button"
        onClick={onFilterWon}
        className={`jira-card flex items-center justify-between rounded-lg border p-3 text-left bg-white transition-all ${
          selectedStatus === "won"
            ? "border-emerald-600 ring-1 ring-emerald-500/30 shadow-xs"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Deals Won
          </p>
          <p className="text-xl font-bold tracking-tight text-emerald-800 mt-0.5">
            {wonCount}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
          <Award className="h-4 w-4" />
        </div>
      </button>
    </div>
  );
}
