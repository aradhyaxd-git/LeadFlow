import { Clock, Calendar, ShieldCheck, User } from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/time";
import { Discussion } from "@/types";

interface TimelineProps {
  discussions: Discussion[];
}

export function Timeline({ discussions }: TimelineProps) {
  if (discussions.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        No comments or discussions logged yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {discussions.map((d, idx) => {
        const isLatest = idx === 0;
        const isSystem = d.kind === "system";
        const isLast = idx === discussions.length - 1;

        return (
          <div key={d.id} className="flex gap-3.5 relative group">
            {/* Left spine & Avatar column */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-2xs ${
                  isLatest
                    ? "bg-[#0052cc] text-white ring-2 ring-[#0052cc]/20"
                    : isSystem
                    ? "bg-slate-200 text-slate-600"
                    : "bg-slate-700 text-white"
                }`}
              >
                {isSystem ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Spine connector line to next item */}
              {!isLast && (
                <div
                  className="w-0.5 flex-1 bg-slate-200 my-1"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Right content column */}
            <div className="flex-1 min-w-0 pb-2">
              {/* Author / Timestamp row */}
              <div className="flex items-center justify-between gap-2 mb-1.5 pt-0.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-800">
                    {isSystem ? "System" : "Sales Representative"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-normal">
                    {formatDateTime(d.created_at)}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo(d.created_at)}</span>
                </span>
              </div>

              {/* Comment Box */}
              <div
                className={`rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed transition-colors ${
                  isSystem
                    ? "border-slate-200/60 bg-slate-50/70 text-slate-600 italic"
                    : "border-slate-200 bg-white text-slate-800 shadow-2xs"
                }`}
              >
                <p className="whitespace-pre-wrap">{d.note}</p>

                {d.follow_up_at && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center">
                    <span className="inline-flex items-center gap-1.5 rounded bg-[#deebff]/60 px-2 py-0.5 text-[11px] font-semibold text-[#0747a6] border border-[#b3d4ff]">
                      <Calendar className="h-3 w-3 text-[#0052cc]" />
                      <span>Follow-up set for: {formatDateTime(d.follow_up_at)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
