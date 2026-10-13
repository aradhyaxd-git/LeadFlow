import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Phone, X, Building, Calendar, MessageSquare, CheckSquare, Video } from "lucide-react";
import { describeFollowUp } from "@/lib/time";
import { getGoogleMeetUrl } from "@/lib/calendar";
import { LEAD_STATUSES, LeadStatus, STATUS_LABELS } from "@/types";
import {
  useAddNote,
  useClearFollowUp,
  useLead,
  useUpdateStatus,
} from "./hooks";
import { NoteForm } from "./NoteForm";
import { Timeline } from "./Timeline";

interface LeadDialogProps {
  leadId: number | null;
  onClose: () => void;
  onNotify: (type: "success" | "error", text: string) => void;
}

export function LeadDialog({ leadId, onClose, onNotify }: LeadDialogProps) {
  const isOpen = leadId !== null;
  const activeId = leadId ?? 0;

  const { data: lead, isLoading, isError } = useLead(leadId);
  const addNoteMutation = useAddNote(activeId);
  const updateStatusMutation = useUpdateStatus(activeId);
  const clearFollowUpMutation = useClearFollowUp(activeId);

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateStatusMutation.mutate(newStatus, {
      onSuccess: () => {
        onNotify("success", `Status changed to ${STATUS_LABELS[newStatus]}`);
      },
      onError: (err) => {
        onNotify(
          "error",
          err instanceof Error ? err.message : "Failed to update status"
        );
      },
    });
  };

  const handleAddNote = (payload: { note: string; follow_up_at: string | null }) => {
    addNoteMutation.mutate(payload, {
      onSuccess: () => {
        onNotify(
          "success",
          payload.follow_up_at
            ? "Discussion saved & follow-up scheduled"
            : "Discussion note logged"
        );
      },
      onError: (err) => {
        onNotify(
          "error",
          err instanceof Error ? err.message : "Failed to save discussion note"
        );
      },
    });
  };

  const handleClearFollowUp = () => {
    clearFollowUpMutation.mutate(undefined, {
      onSuccess: () => {
        onNotify("success", "Follow-up marked as completed");
      },
      onError: (err) => {
        onNotify(
          "error",
          err instanceof Error ? err.message : "Failed to clear follow-up"
        );
      },
    });
  };

  const followUpDesc = describeFollowUp(lead?.follow_up_at);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs transition-opacity duration-150" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-2xl focus:outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
        >
          {/* Header Bar styled like Jira issue detail view */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#f4f5f7] px-6 py-4">
            <div className="min-w-0 flex-1">
              {/* Ticket key + breadcrumbs */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0052cc]">
                <CheckSquare className="h-3.5 w-3.5" />
                <span className="font-mono">LEAD-{lead?.id ?? "..."}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600 font-normal">Discussion Activity</span>
              </div>

              <Dialog.Title className="mt-1 text-lg font-bold tracking-tight text-[#172b4d] truncate">
                {lead ? lead.name : "Loading lead..."}
              </Dialog.Title>

              {/* Lead metadata pills */}
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                {lead?.company && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>{lead.company}</span>
                  </div>
                )}
                {lead?.phone && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-[#0052cc] hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Follow-up reminder banner */}
              {lead?.follow_up_at && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold tracking-tight ${
                      followUpDesc.type === "overdue"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-[#deebff] text-[#0747a6] border-[#b3d4ff]"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{followUpDesc.label}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFollowUp}
                    disabled={clearFollowUpMutation.isPending}
                    className="btn-press inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Mark done</span>
                  </button>

                  <a
                    href={lead ? getGoogleMeetUrl(lead) : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <Video className="h-3 w-3 text-emerald-600" />
                    <span>Google Meet</span>
                  </a>
                </div>
              )}
            </div>

            {/* Right side: Jira Status Dropdown & Close */}
            <div className="flex items-center gap-2 shrink-0">
              {lead && (
                <div>
                  <label htmlFor="lead-status-select" className="sr-only">
                    Issue Status
                  </label>
                  <select
                    id="lead-status-select"
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                    className="btn-press rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0052cc] hover:border-[#0052cc] focus:outline-none focus:ring-1 focus:ring-[#0052cc] cursor-pointer"
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close dialog"
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc]"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Activity Section Subheader */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#f4f5f7]/60 px-6 py-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-600">
              <MessageSquare className="h-3.5 w-3.5 text-[#0052cc]" />
              <span>Activity History</span>
            </div>
            {lead && (
              <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600 tabular-nums">
                {lead.discussions.length} {lead.discussions.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>

          {/* Scrollable Timeline Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading && (
              <div className="space-y-4 py-4">
                <div className="h-16 animate-pulse rounded bg-slate-100" />
                <div className="h-16 animate-pulse rounded bg-slate-100" />
              </div>
            )}

            {isError && (
              <div className="py-8 text-center text-sm text-red-600">
                Could not load discussion history.
              </div>
            )}

            {lead && <Timeline discussions={lead.discussions} />}
          </div>

          {/* Sticky Bottom Form */}
          {lead && (
            <NoteForm
              onSubmit={handleAddNote}
              isSubmitting={addNoteMutation.isPending}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
