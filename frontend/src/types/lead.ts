export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

export type DiscussionKind = "note" | "system";

export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  follow_up_at: string | null;
  kind: DiscussionKind;
  created_at: string;
}

export interface LeadSummary {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;
  last_note: string | null;
  last_discussion_at: string | null;
}

export interface LeadDetail extends LeadSummary {
  discussions: Discussion[];
}

export interface LeadListResponse {
  items: LeadSummary[];
}

export interface LeadCreatePayload {
  name: string;
  company?: string | null;
  phone?: string | null;
}

export interface LeadStatusUpdatePayload {
  status: LeadStatus;
}

export interface DiscussionCreatePayload {
  note: string;
  follow_up_at?: string | null;
}

export interface DiscussionCreatedResponse {
  discussion: Discussion;
  lead: LeadSummary;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}
