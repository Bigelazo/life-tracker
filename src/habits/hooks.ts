import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HabitLogResponse, HabitResponse } from "./api-types";
import type { HabitFrequency } from "./domain";

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
