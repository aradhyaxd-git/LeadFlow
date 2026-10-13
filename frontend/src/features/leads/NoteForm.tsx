import { useState } from "react";
import { Calendar, Clock, User } from "lucide-react";

interface NoteFormProps {
  onSubmit: (payload: { note: string; follow_up_at: string | null }) => void;
  isSubmitting?: boolean;
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NoteForm({ onSubmit, isSubmitting = false }: NoteFormProps) {
  const [note, setNote] = useState("");
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  const applyQuickPreset = (daysAhead: number, hour = 10) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    setHasFollowUp(true);
    setFollowUpDate(getLocalDateString(target));
    setFollowUpTime(`${String(hour).padStart(2, "0")}:00`);
    setError(null);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setError("Please enter a discussion note before saving.");
      return;
    }

    let followUpIso: string | null = null;
    if (hasFollowUp) {
      if (!followUpDate) {
        setError("Please choose a follow-up date.");
        return;
      }
      const timePart = followUpTime || "09:00";
      const combined = new Date(`${followUpDate}T${timePart}`);
      if (isNaN(combined.getTime())) {
        setError("Invalid follow-up date or time.");
        return;
      }
      // Reject if more than 5 minutes in the past
      if (combined.getTime() < Date.now() - 5 * 60 * 1000) {
        setError("Follow-up date and time cannot be in the past.");
        return;
      }
      followUpIso = combined.toISOString();
    }

    onSubmit({ note: trimmedNote, follow_up_at: followUpIso });
    setNote("");
    setHasFollowUp(false);
    setFollowUpDate("");
    setFollowUpTime("10:00");
  };

  return (
    <form
      onSubmit={handleSave}
      className="border-t border-slate-200 bg-[#f4f5f7]/70 px-6 py-4"
    >
      <div className="flex gap-3.5 items-start">
        {/* User Avatar - aligned on the exact same axis as the timeline avatars above */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0052cc] text-white shadow-2xs">
          <User className="h-3.5 w-3.5" />
        </div>

        {/* Input box & controls - aligned on the exact same axis as the comment cards */}
        <div className="flex-1 min-w-0">
          <div>
            <label htmlFor="discussion-note" className="sr-only">
              Log a new discussion
            </label>
            <textarea
              id="discussion-note"
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Log a new discussion... (⌘ + Enter to save)"
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0052cc] focus:outline-none focus:ring-1 focus:ring-[#0052cc] shadow-2xs resize-none"
            />
          </div>

          {error && (
            <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}

          {/* Controls row */}
          <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasFollowUp}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasFollowUp(checked);
                    if (checked && !followUpDate) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFollowUpDate(getLocalDateString(tomorrow));
                    }
                    setError(null);
                  }}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#0052cc] focus:ring-[#0052cc]"
                />
                <span className="font-semibold text-slate-700">Set Follow-up</span>
              </label>

              {hasFollowUp && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      aria-label="Follow-up date"
                      value={followUpDate}
                      onChange={(e) => {
                        setFollowUpDate(e.target.value);
                        setError(null);
                      }}
                      className="rounded border border-slate-300 bg-white py-1 pl-6.5 pr-2 text-xs text-slate-800 focus:border-[#0052cc] focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                    />
                  </div>

                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      aria-label="Follow-up time"
                      value={followUpTime}
                      onChange={(e) => {
                        setFollowUpTime(e.target.value);
                        setError(null);
                      }}
                      className="rounded border border-slate-300 bg-white py-1 pl-6.5 pr-2 text-xs text-slate-800 focus:border-[#0052cc] focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-press inline-flex items-center justify-center rounded bg-[#0052cc] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0747a6] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc] shrink-0"
            >
              {isSubmitting ? "Saving..." : "Save Note"}
            </button>
          </div>

          {/* Quick pick chips */}
          {hasFollowUp && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Quick pick:</span>
              <button
                type="button"
                onClick={() => applyQuickPreset(1, 10)}
                className="btn-press rounded bg-white border border-slate-200 px-2 py-0.5 text-slate-600 hover:bg-slate-100 hover:border-slate-300 font-medium"
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(3, 14)}
                className="btn-press rounded bg-white border border-slate-200 px-2 py-0.5 text-slate-600 hover:bg-slate-100 hover:border-slate-300 font-medium"
              >
                In 3 days
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(7, 10)}
                className="btn-press rounded bg-white border border-slate-200 px-2 py-0.5 text-slate-600 hover:bg-slate-100 hover:border-slate-300 font-medium"
              >
                Next week
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
