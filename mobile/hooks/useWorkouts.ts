import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LogWorkoutInput, WorkoutsListResponse } from '@plate/shared';
import { api } from '../lib/api';

export function useWorkouts(date: string) {
  return useQuery({
    queryKey: ['workouts', date],
    queryFn: () => api.get<WorkoutsListResponse>(`/v1/workouts?date=${date}`),
    staleTime: 15_000,
  });
}

export function useLogWorkout(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LogWorkoutInput) =>
      api.post<{ id: string; kcalBurned: number }>('/v1/workouts', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workouts', date] });
    },
  });
}

export function useDeleteWorkout(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/v1/workouts/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workouts', date] });
    },
  });
}
