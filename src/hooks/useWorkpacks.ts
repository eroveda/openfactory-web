import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workpacksApi, briefApi, boxesApi, planApi, handoffApi, pinsApi, userApi } from "../lib/api";

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
// User
// -----------------------------------------------------------------------

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: userApi.me,
  });
}
