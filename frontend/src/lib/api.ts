import {
  ApiErrorResponse,
  DiscussionCreatePayload,
  DiscussionCreatedResponse,
  LeadCreatePayload,
  LeadDetail,
  LeadListResponse,
  LeadStatus,
  LeadStatusUpdatePayload,
  LeadSummary,
} from "@/types";

export class ApiError extends Error {
  code: string;
  status: number;
  details: { field: string; message: string }[];

  constructor(status: number, message: string, code = "UNKNOWN_ERROR", details: { field: string; message: string }[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorJson: ApiErrorResponse | null = null;
    try {
      errorJson = (await response.json()) as ApiErrorResponse;
    } catch {
      // not JSON
    }

    const message = errorJson?.error?.message || `Request failed with status ${response.status}`;
    const code = errorJson?.error?.code || `HTTP_${response.status}`;
    const details = errorJson?.error?.details || [];
    throw new ApiError(response.status, message, code, details);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getLeads: (params?: { status?: LeadStatus | null; q?: string | null }): Promise<LeadListResponse> => {
    const query = new URLSearchParams();
    if (params?.status) {
      query.set("status", params.status);
    }
    if (params?.q && params.q.trim()) {
      query.set("q", params.q.trim());
    }
    const qs = query.toString();
    return request<LeadListResponse>(`/leads${qs ? `?${qs}` : ""}`);
  },

  getLead: (leadId: number): Promise<LeadDetail> => {
    return request<LeadDetail>(`/leads/${leadId}`);
  },

  createLead: (payload: LeadCreatePayload): Promise<LeadSummary> => {
    return request<LeadSummary>("/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateLeadStatus: (leadId: number, payload: LeadStatusUpdatePayload): Promise<LeadSummary> => {
    return request<LeadSummary>(`/leads/${leadId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  addDiscussion: (leadId: number, payload: DiscussionCreatePayload): Promise<DiscussionCreatedResponse> => {
    return request<DiscussionCreatedResponse>(`/leads/${leadId}/discussions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  clearFollowUp: (leadId: number): Promise<LeadSummary> => {
    return request<LeadSummary>(`/leads/${leadId}/follow-up`, {
      method: "DELETE",
    });
  },
};
