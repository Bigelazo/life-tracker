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

function buildLogsKey(habitId: string | null | undefined, since: string | null | undefined) {
  return ["habit-logs", { habitId: habitId ?? null, since: since ?? null }] as const;
}

function buildQuery(
  base: string,
  params: Record<string, string | null | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => fetchJSON<HabitResponse[]>("/api/habits"),
  });
}

interface UseHabitLogsOptions {
  /** Restrict to logs for a single habit (e.g. the detail view). */
  habitId?: string | null;
  /** ISO date string (YYYY-MM-DD) lower-bound on logDate. */
  since?: string | null;
}

export function useHabitLogs(options: UseHabitLogsOptions = {}) {
  const { habitId, since } = options;
  const queryKey = buildLogsKey(habitId, since);
  return useQuery({
    queryKey,
    queryFn: () =>
      fetchJSON<HabitLogResponse[]>(
        buildQuery("/api/habits/logs", { habitId: habitId ?? undefined, since: since ?? undefined }),
      ),
  });
}

export function useAllRelapses(options: { since?: string | null } = {}) {
  const { since } = options;
  return useQuery({
    queryKey: ["all-habit-relapses", { since: since ?? null }],
    queryFn: () =>
      fetchJSON<RelapseResponse[]>(
        buildQuery("/api/habits/relapses", { since: since ?? undefined }),
      ),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useHabitRelapses(habitId: string | null | undefined) {
  return useQuery({
    queryKey: ["habit-relapses", { habitId: habitId ?? null }],
    queryFn: () =>
      fetchJSON<RelapseResponse[]>(
        buildQuery("/api/habits/relapses", { habitId: habitId ?? undefined }),
      ),
    enabled: Boolean(habitId),
    staleTime: 5 * 60_000,
    retry: false,
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
      const snapshots = qc.getQueriesData<HabitLogResponse[]>({
        queryKey: ["habit-logs"],
      });
      const optimistic: HabitLogResponse = {
        id: `optimistic-${habitId}-${logDate}-${Date.now()}`,
        habitId,
        logDate,
        amount: amount ?? 1,
        createdAt: new Date().toISOString(),
      };
      for (const [key] of snapshots) {
        qc.setQueryData<HabitLogResponse[]>(key, (prev) =>
          prev ? [...prev, optimistic] : [optimistic],
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      for (const [key, value] of context?.snapshots ?? []) {
        if (value !== undefined) qc.setQueryData(key, value);
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
      const snapshots = qc.getQueriesData<HabitLogResponse[]>({
        queryKey: ["habit-logs"],
      });
      for (const [key] of snapshots) {
        qc.setQueryData<HabitLogResponse[]>(key, (prev) =>
          prev?.filter((l) => !(l.habitId === habitId && l.logDate === logDate)) ?? [],
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      for (const [key, value] of context?.snapshots ?? []) {
        if (value !== undefined) qc.setQueryData(key, value);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["habit-logs"] });
    },
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
      await qc.cancelQueries({ queryKey: ["habit-relapses"] });
      await qc.cancelQueries({ queryKey: ["all-habit-relapses"] });
      const singleSnapshots = qc.getQueriesData<RelapseResponse[]>({
        queryKey: ["habit-relapses"],
      });
      const allSnapshots = qc.getQueriesData<RelapseResponse[]>({
        queryKey: ["all-habit-relapses"],
      });
      const optimistic: RelapseResponse = {
        id: `optimistic-${habitId}-${Date.now()}`,
        habitId,
        relapsedAt: new Date().toISOString(),
      };
      for (const [key] of singleSnapshots) {
        qc.setQueryData<RelapseResponse[]>(key, (prev) =>
          prev ? [optimistic, ...prev] : [optimistic],
        );
      }
      for (const [key] of allSnapshots) {
        qc.setQueryData<RelapseResponse[]>(key, (prev) =>
          prev ? [optimistic, ...prev] : [optimistic],
        );
      }
      return { singleSnapshots, allSnapshots };
    },
    onError: (_err, _vars, context) => {
      for (const [key, value] of context?.singleSnapshots ?? []) {
        if (value !== undefined) qc.setQueryData(key, value);
      }
      for (const [key, value] of context?.allSnapshots ?? []) {
        if (value !== undefined) qc.setQueryData(key, value);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["habit-relapses"] });
      qc.invalidateQueries({ queryKey: ["all-habit-relapses"] });
    },
  });
}
