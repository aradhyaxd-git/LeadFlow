import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Discussion,
  DiscussionCreatePayload,
  LeadCreatePayload,
  LeadDetail,
  LeadListResponse,
  LeadStatus,
  LeadSummary,
} from "@/types";

export const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (filters: { status?: LeadStatus | null; q?: string | null }) =>
    [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, "detail"] as const,
  detail: (id: number) => [...leadKeys.details(), id] as const,
};

export function useLeads(filters?: { status?: LeadStatus | null; q?: string | null }) {
  return useQuery({
    queryKey: leadKeys.list(filters ?? {}),
    queryFn: () => api.getLeads(filters),
  });
}

export function useLead(leadId: number | null) {
  return useQuery({
    queryKey: leadKeys.detail(leadId ?? 0),
    queryFn: () => api.getLead(leadId!),
    enabled: leadId !== null && leadId > 0,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeadCreatePayload) => api.createLead(payload),
    onSuccess: (newLead) => {
      queryClient.setQueriesData<LeadListResponse>(
        { queryKey: leadKeys.lists() },
        (old) => {
          if (!old) return { items: [newLead] };
          return { items: [newLead, ...old.items] };
        }
      );
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

export function useAddNote(leadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DiscussionCreatePayload) =>
      api.addDiscussion(leadId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) });
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() });

      const previousDetail = queryClient.getQueryData<LeadDetail>(
        leadKeys.detail(leadId)
      );

      const nowIso = new Date().toISOString();
      const optimisticDiscussion: Discussion = {
        id: -Date.now(),
        lead_id: leadId,
        note: payload.note.trim(),
        follow_up_at: payload.follow_up_at ?? null,
        kind: "note",
        created_at: nowIso,
      };

      if (previousDetail) {
        queryClient.setQueryData<LeadDetail>(leadKeys.detail(leadId), {
          ...previousDetail,
          last_note: optimisticDiscussion.note,
          last_discussion_at: nowIso,
          follow_up_at:
            payload.follow_up_at !== undefined && payload.follow_up_at !== null
              ? payload.follow_up_at
              : previousDetail.follow_up_at,
          discussions: [optimisticDiscussion, ...previousDetail.discussions],
        });
      }

      queryClient.setQueriesData<LeadListResponse>(
        { queryKey: leadKeys.lists() },
        (old) => {
          if (!old) return old;
          const updated = old.items.map((item) => {
            if (item.id !== leadId) return item;
            return {
              ...item,
              last_note: optimisticDiscussion.note,
              last_discussion_at: nowIso,
              follow_up_at:
                payload.follow_up_at !== undefined && payload.follow_up_at !== null
                  ? payload.follow_up_at
                  : item.follow_up_at,
            };
          });
          return { items: updated };
        }
      );

      return { previousDetail };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          leadKeys.detail(leadId),
          context.previousDetail
        );
      }
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<LeadDetail>(leadKeys.detail(leadId), (old) => {
        if (!old) return old;
        const filtered = old.discussions.filter((d) => d.id > 0);
        return {
          ...data.lead,
          discussions: [data.discussion, ...filtered],
        };
      });

      queryClient.setQueriesData<LeadListResponse>(
        { queryKey: leadKeys.lists() },
        (old) => {
          if (!old) return old;
          const others = old.items.filter((item) => item.id !== leadId);
          return { items: [data.lead, ...others] };
        }
      );
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

// Alias for compatibility
export const useAddDiscussion = useAddNote;

export function useUpdateStatus(leadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: LeadStatus) =>
      api.updateLeadStatus(leadId, { status }),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) });
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() });

      const previousDetail = queryClient.getQueryData<LeadDetail>(
        leadKeys.detail(leadId)
      );

      if (previousDetail) {
        queryClient.setQueryData<LeadDetail>(leadKeys.detail(leadId), {
          ...previousDetail,
          status: newStatus,
        });
      }

      queryClient.setQueriesData<LeadListResponse>(
        { queryKey: leadKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            items: old.items.map((item) =>
              item.id === leadId ? { ...item, status: newStatus } : item
            ),
          };
        }
      );

      return { previousDetail };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          leadKeys.detail(leadId),
          context.previousDetail
        );
      }
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
    onSuccess: (updatedLead: LeadSummary) => {
      queryClient.setQueryData<LeadDetail>(leadKeys.detail(leadId), (old) =>
        old ? { ...old, ...updatedLead } : old
      );
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

export function useClearFollowUp(leadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.clearFollowUp(leadId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) });
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() });

      const previousDetail = queryClient.getQueryData<LeadDetail>(
        leadKeys.detail(leadId)
      );

      if (previousDetail) {
        queryClient.setQueryData<LeadDetail>(leadKeys.detail(leadId), {
          ...previousDetail,
          follow_up_at: null,
        });
      }

      queryClient.setQueriesData<LeadListResponse>(
        { queryKey: leadKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            items: old.items.map((item) =>
              item.id === leadId ? { ...item, follow_up_at: null } : item
            ),
          };
        }
      );

      return { previousDetail };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          leadKeys.detail(leadId),
          context.previousDetail
        );
      }
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
    onSuccess: (updatedLead: LeadSummary) => {
      queryClient.setQueryData<LeadDetail>(leadKeys.detail(leadId), (old) =>
        old ? { ...old, ...updatedLead } : old
      );
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}
