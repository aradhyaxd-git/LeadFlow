"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import {
  AddLeadDialog,
  FilterBar,
  KanbanBoard,
  LeadDialog,
  LeadList,
  PinnedSection,
  PipelineMetrics,
  useLeads,
  useUpdateStatus,
} from "@/features/leads";
import { groupLeads } from "@/lib/leads";
import { exportLeadsToCsv } from "@/lib/exportCsv";
import { LEAD_STATUSES, LeadStatus } from "@/types";

function LeadFlowDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStatus = useMemo<LeadStatus | null>(() => {
    const raw = searchParams.get("status");
    if (raw && (LEAD_STATUSES as readonly string[]).includes(raw)) {
      return raw as LeadStatus;
    }
    return null;
  }, [searchParams]);

  const initialQuery = searchParams.get("q") ?? "";

  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(
    initialStatus
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeLeadId, setActiveLeadId] = useState<number | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Sync URL query params when filter or search changes
  const updateUrlParams = useCallback(
    (status: LeadStatus | null, q: string) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const handleStatusChange = (status: LeadStatus | null) => {
    setSelectedStatus(status);
    updateUrlParams(status, searchQuery);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    updateUrlParams(selectedStatus, q);
  };

  // Keyboard shortcut Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const addToast = useCallback((type: "success" | "error", text: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all leads so status chip counts remain accurate while filtering client-side
  const { data: allLeadsData, isLoading, isError, refetch } = useLeads();

  const allItems = useMemo(() => allLeadsData?.items ?? [], [allLeadsData]);

  // Compute global counts for chips
  const { statusCounts, totalCount, pinned: allPinned } = useMemo(
    () => groupLeads(allItems),
    [allItems]
  );

  const overdueCount = useMemo(() => {
    const now = Date.now();
    return allItems.filter(
      (l) =>
        l.follow_up_at &&
        new Date(l.follow_up_at).getTime() < now &&
        l.status !== "won" &&
        l.status !== "lost"
    ).length;
  }, [allItems]);

  // Filter leads by status and search query
  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((lead) => {
      if (selectedStatus && lead.status !== selectedStatus) {
        return false;
      }
      if (q) {
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesCompany = (lead.company ?? "").toLowerCase().includes(q);
        return matchesName || matchesCompany;
      }
      return true;
    });
  }, [allItems, selectedStatus, searchQuery]);

  // Group filtered leads into Pinned ("Today's Follow-ups") vs All Leads
  const { pinned, allLeads } = useMemo(
    () => groupLeads(filteredLeads),
    [filteredLeads]
  );

  // Quick advance lead status
  const updateStatusMutation = useUpdateStatus(activeLeadId ?? 0);
  const handleQuickAdvance = (leadId: number, nextStatus: LeadStatus) => {
    updateStatusMutation.mutate(nextStatus, {
      onSuccess: () => {
        addToast("success", `Advanced lead to ${nextStatus.replace("_", " ")}`);
      },
      onError: (err) => {
        addToast("error", err instanceof Error ? err.message : "Failed to advance stage");
      },
    });
  };

  const handleExportCsv = () => {
    exportLeadsToCsv(filteredLeads);
    addToast("success", `Exported ${filteredLeads.length} leads to CSV`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f5f7]">
      <Header
        onAddLeadClick={() => setIsAddLeadOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExportCsv={handleExportCsv}
        reminderLeads={allPinned}
        onSelectLead={(id) => setActiveLeadId(id)}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
        {/* KPI Metrics Summary Strip */}
        <PipelineMetrics
          totalLeads={totalCount}
          dueTodayCount={allPinned.length}
          overdueCount={overdueCount}
          wonCount={statusCounts.won}
          selectedStatus={selectedStatus}
          onFilterToday={() => {
            setSelectedStatus(null);
            setSearchQuery("");
          }}
          onFilterWon={() => handleStatusChange("won")}
          onFilterAll={() => handleStatusChange(null)}
        />

        {/* Filter Toolbar */}
        <FilterBar
          selectedStatus={selectedStatus}
          onSelectStatus={handleStatusChange}
          statusCounts={statusCounts}
          totalCount={totalCount}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchInputRef={searchInputRef}
        />

        <div className="mt-5">
          {isLoading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading leads">
              <div className="h-32 animate-pulse rounded-lg bg-slate-200/70" />
              <div className="h-32 animate-pulse rounded-lg bg-slate-200/70" />
              <div className="h-32 animate-pulse rounded-lg bg-slate-200/70" />
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-xs">
              <p className="text-sm font-semibold text-red-800">
                Could not connect to the LeadFlow API.
              </p>
              <p className="mt-1 text-xs text-red-600">
                Ensure your backend server is running on port 8000.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="btn-press mt-3 rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
              >
                Retry Connection
              </button>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {viewMode === "grid" ? (
                <>
                  <PinnedSection
                    pinnedLeads={pinned}
                    onSelectLead={(id) => setActiveLeadId(id)}
                    onQuickAdvance={handleQuickAdvance}
                  />

                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Active Leads ({allLeads.length})
                      </h2>
                    </div>
                    <LeadList
                      leads={allLeads}
                      onSelectLead={(id) => setActiveLeadId(id)}
                      onQuickAdvance={handleQuickAdvance}
                    />
                  </section>
                </>
              ) : (
                <KanbanBoard
                  leads={filteredLeads}
                  onSelectLead={(id) => setActiveLeadId(id)}
                  onQuickAdvance={handleQuickAdvance}
                />
              )}
            </>
          )}
        </div>
      </main>

      <LeadDialog
        leadId={activeLeadId}
        onClose={() => setActiveLeadId(null)}
        onNotify={addToast}
      />

      <AddLeadDialog
        open={isAddLeadOpen}
        onOpenChange={setIsAddLeadOpen}
        onNotify={addToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading LeadFlow...
        </div>
      }
    >
      <LeadFlowDashboard />
    </Suspense>
  );
}
