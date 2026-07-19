import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HabitLogResponse, HabitResponse, RelapseResponse } from "./api-types";
import type { HabitFrequency, HabitType } from "./domain";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchJSON<{ timezone: string; currency: string }>("/api/settings"),
    staleTime: 5 * 60_000,
  });
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => fetchJSON<HabitResponse[]>("/api/habits"),
  });
}

export function useHabitLogs() {
  return useQuery({
    queryKey: ["habit-logs"],
    queryFn: () => fetchJSON<HabitLogResponse[]>("/api/habits/logs"),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      habitType?: HabitType;
      frequency?: HabitFrequency;
      target?: number | null;
      unit?: string | null;
    }) =>
      fetchJSON<HabitResponse>("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (created) => {
      qc.setQueryData<HabitResponse[]>(["habits"], (old) =>
        old ? [...old, created] : [created],
      );
    },
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string | null;
      archived?: boolean;
      habitType?: HabitType;
      frequency?: HabitFrequency;
      target?: number | null;
      unit?: string | null;
    }) =>
      fetchJSON<HabitResponse>(`/api/habits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      qc.setQueryData<HabitResponse[]>(["habits"], (old) =>
        old?.map((h) => (h.id === updated.id ? updated : h)) ?? [updated],
      );
    },
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<HabitResponse>(`/api/habits/${id}`, { method: "DELETE" }),
    onSuccess: (archived) => {
      qc.setQueryData<HabitResponse[]>(["habits"], (old) =>
        old?.map((h) => (h.id === archived.id ? archived : h)) ?? [archived],
      );
    },
  });
}

export function useCheckHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      habitId,
      logDate,
      amount,
    }: {
      habitId: string;
      logDate: string;
      amount?: number;
    }) =>
      fetchJSON<{
        id: string | null;
        habitId: string;
        logDate: string;
        amount: number;
        createdAt: string | null;
      }>(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logDate, amount }),
      }),
    onMutate: async ({ habitId, logDate, amount }) => {
      await qc.cancelQueries({ queryKey: ["habit-logs"] });
      const previous = qc.getQueryData<HabitLogResponse[]>(["habit-logs"]);
      const optimistic: HabitLogResponse = {
        id: `optimistic-${habitId}-${logDate}-${Date.now()}`,
        habitId,
        logDate,
        amount: amount ?? 1,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<HabitLogResponse[]>(["habit-logs"], (old) =>
        old ? [...old, optimistic] : [optimistic],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["habit-logs"], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["habit-logs"] });
    },
  });
}

export function useUncheckHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      habitId,
      logDate,
    }: {
      habitId: string;
      logDate: string;
    }) =>
      fetchJSON<{ success: boolean }>(
        `/api/habits/${habitId}/log?logDate=${encodeURIComponent(logDate)}`,
        { method: "DELETE" },
      ),
    onMutate: async ({ habitId, logDate }) => {
      await qc.cancelQueries({ queryKey: ["habit-logs"] });
      const previous = qc.getQueryData<HabitLogResponse[]>(["habit-logs"]);
      qc.setQueryData<HabitLogResponse[]>(["habit-logs"], (old) =>
        old?.filter((l) => !(l.habitId === habitId && l.logDate === logDate)) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["habit-logs"], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["habit-logs"] });
    },
  });
}

export function useAllRelapses() {
  return useQuery({
    queryKey: ["all-habit-relapses"],
    queryFn: () => fetchJSON<RelapseResponse[]>("/api/habits/relapses"),
  });
}

export function useRecordRelapse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      habitId,
      relapsedAt,
    }: {
      habitId: string;
      relapsedAt?: string;
    }) =>
      fetchJSON<RelapseResponse>(`/api/habits/${habitId}/relapses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relapsedAt }),
      }),
    onMutate: async ({ habitId }) => {
      await qc.cancelQueries({ queryKey: ["habit-relapses", habitId] });
      await qc.cancelQueries({ queryKey: ["all-habit-relapses"] });
      const previous = qc.getQueryData<RelapseResponse[]>(["habit-relapses", habitId]);
      const allPrevious = qc.getQueryData<RelapseResponse[]>(["all-habit-relapses"]);
      const optimistic: RelapseResponse = {
        id: `optimistic-${habitId}-${Date.now()}`,
        habitId,
        relapsedAt: new Date().toISOString(),
      };
      qc.setQueryData<RelapseResponse[]>(["habit-relapses", habitId], (old) =>
        old ? [optimistic, ...old] : [optimistic],
      );
      qc.setQueryData<RelapseResponse[]>(["all-habit-relapses"], (old) =>
        old ? [optimistic, ...old] : [optimistic],
      );
      return { previous, allPrevious };
    },
    onError: (_err, { habitId }, context) => {
      if (context?.previous) {
        qc.setQueryData(["habit-relapses", habitId], context.previous);
      }
      if (context?.allPrevious) {
        qc.setQueryData(["all-habit-relapses"], context.allPrevious);
      }
    },
    onSettled: (_data, _err, { habitId }) => {
      qc.invalidateQueries({ queryKey: ["habit-relapses", habitId] });
      qc.invalidateQueries({ queryKey: ["all-habit-relapses"] });
    },
  });
}
