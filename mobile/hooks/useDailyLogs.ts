import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MealRowEntry } from '../components/today/MealRow';

export interface DayPayload {
  date: string;
  logs: MealRowEntry[];
  totals: { kcal: number; proteinG: number; carbsG: number; fatG: number };
}

export function useDailyLogs(date: string) {
  return useQuery({
    queryKey: ['food', 'logs', date],
    queryFn: () => api.get<DayPayload>(`/v1/food/logs?date=${date}`),
    staleTime: 15_000,
  });
}

export function useDeleteLog(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/v1/food/log/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['food', 'logs', date] });
    },
  });
}

export function useLogFood(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post<{ id: string }>('/v1/food/log', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['food', 'logs', date] });
    },
  });
}
