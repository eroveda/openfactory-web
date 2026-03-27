import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workpacksApi, briefApi, boxesApi, planApi, handoffApi, pinsApi, userApi, membersApi, inboxApi } from "../lib/api";
import type { MemberRole } from "../lib/api";

// -----------------------------------------------------------------------
// Workpacks
// -----------------------------------------------------------------------

export function useWorkpacks() {
  return useQuery({
    queryKey: ["workpacks"],
    queryFn: workpacksApi.list,
  });
}

export function useWorkpack(id: string) {
  return useQuery({
    queryKey: ["workpack", id],
    queryFn: () => workpacksApi.get(id),
    enabled: !!id,
    // Poll every 3s while the pipeline is running
    refetchInterval: (query) => {
      const status = query.state.data?.processingStatus;
      return status === "PROCESSING" || status === "PENDING" ? 3000 : false;
    },
  });
}

export function useIngest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      workpacksApi.ingest(title, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workpacks"] }),
  });
}

export function useShape(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => workpacksApi.shape(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workpack", id] }),
  });
}

export function useAdvanceStage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => workpacksApi.advance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workpack", id] });
      qc.invalidateQueries({ queryKey: ["workpacks"] });
    },
  });
}

export function useUpdateTitle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => workpacksApi.updateTitle(id, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workpack", id] });
      qc.invalidateQueries({ queryKey: ["workpacks"] });
    },
  });
}

export function useDeleteWorkpack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workpacksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workpacks"] }),
  });
}

// -----------------------------------------------------------------------
// Brief
// -----------------------------------------------------------------------

export function useBrief(workpackId: string) {
  return useQuery({
    queryKey: ["brief", workpackId],
    queryFn: () => briefApi.get(workpackId),
    enabled: !!workpackId,
  });
}

export function useUpdateBrief(workpackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof briefApi.update>[1]) =>
      briefApi.update(workpackId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brief", workpackId] }),
  });
}

// -----------------------------------------------------------------------
// Boxes
// -----------------------------------------------------------------------

export function useBoxes(workpackId: string) {
  return useQuery({
    queryKey: ["boxes", workpackId],
    queryFn: () => boxesApi.list(workpackId),
    enabled: !!workpackId,
  });
}

export function useUpdateBox(workpackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boxId, data }: { boxId: string; data: Parameters<typeof boxesApi.update>[2] }) =>
      boxesApi.update(workpackId, boxId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boxes", workpackId] }),
  });
}

// -----------------------------------------------------------------------
// Plan
// -----------------------------------------------------------------------

export function usePlan(workpackId: string) {
  return useQuery({
    queryKey: ["plan", workpackId],
    queryFn: () => planApi.get(workpackId),
    enabled: !!workpackId,
  });
}

// -----------------------------------------------------------------------
// Handoff
// -----------------------------------------------------------------------

export function useHandoff(workpackId: string) {
  return useQuery({
    queryKey: ["handoff", workpackId],
    queryFn: () => handoffApi.get(workpackId),
    enabled: !!workpackId,
  });
}

export function useUpdateHandoff(workpackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof handoffApi.update>[1]) =>
      handoffApi.update(workpackId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["handoff", workpackId] }),
  });
}

// -----------------------------------------------------------------------
// Pins
// -----------------------------------------------------------------------

export function usePins(workpackId: string) {
  return useQuery({
    queryKey: ["pins", workpackId],
    queryFn: () => pinsApi.list(workpackId),
    enabled: !!workpackId,
  });
}

export function useCreatePin(workpackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, type }: { content: string; type?: string }) =>
      pinsApi.create(workpackId, content, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pins", workpackId] }),
  });
}

export function useDeletePin(workpackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pinId: string) => pinsApi.delete(workpackId, pinId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pins", workpackId] }),
  });
}

// -----------------------------------------------------------------------
// Members
// -----------------------------------------------------------------------

export function useMembers(workpackId: string) {
  return useQuery({
    queryKey: ["members", workpackId],
    queryFn: () => membersApi.list(workpackId),
    enabled: !!workpackId,
  });
}

export function useInviteMember(workpackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role?: MemberRole }) =>
      membersApi.add(workpackId, email, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", workpackId] }),
  });
}

export function useRemoveMember(workpackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(workpackId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", workpackId] }),
  });
}

// -----------------------------------------------------------------------
// Inbox
// -----------------------------------------------------------------------

export function useInbox(unreadOnly = false) {
  return useQuery({
    queryKey: ["inbox", unreadOnly],
    queryFn: () => inboxApi.list(unreadOnly),
    refetchInterval: 30_000, // poll every 30s
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inboxApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inboxApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

// -----------------------------------------------------------------------
// Handoff approval request
// -----------------------------------------------------------------------

export function useRequestApproval(workpackId: string) {
  return useMutation({
    mutationFn: () => handoffApi.requestApproval(workpackId),
  });
}

// -----------------------------------------------------------------------
// User
// -----------------------------------------------------------------------

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: userApi.me,
  });
}
