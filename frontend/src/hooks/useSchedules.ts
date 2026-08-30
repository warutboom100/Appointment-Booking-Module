import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDoctorSchedulesApi,
  getAllSchedulesApi,
  createDoctorScheduleApi,
  updateDoctorScheduleApi,
  deleteDoctorScheduleApi,
  getDoctorOverridesApi,
  getAllOverridesApi,
  createDoctorOverrideApi,
  updateDoctorOverrideApi,
  deleteDoctorOverrideApi,
  type CreateSchedulePayload,
  type CreateOverridePayload,
  type GetSchedulesParams,
  type GetOverridesParams,
} from '@/api/schedule.api';

export const SCHEDULES_KEY = 'doctor-schedules';
export const OVERRIDES_KEY = 'doctor-overrides';

// === All Schedules (Bulk) ===
export function useAllSchedules(params?: GetSchedulesParams) {
  return useQuery({
    queryKey: [SCHEDULES_KEY, 'all', params],
    queryFn: () => getAllSchedulesApi(params),
    staleTime: 5 * 60 * 1000,
  });
}

// === All Overrides (Bulk) ===
export function useAllOverrides(params?: GetOverridesParams) {
  return useQuery({
    queryKey: [OVERRIDES_KEY, 'all', params],
    queryFn: () => getAllOverridesApi(params),
    staleTime: 5 * 60 * 1000,
  });
}

// === Weekly Recurring Schedules ===
export function useDoctorSchedules(doctorId: string) {
  return useQuery({
    queryKey: [SCHEDULES_KEY, doctorId],
    queryFn: () => getDoctorSchedulesApi(doctorId),
    enabled: !!doctorId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doctorId, input }: { doctorId: string; input: CreateSchedulePayload }) =>
      createDoctorScheduleApi(doctorId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULES_KEY, variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateSchedulePayload> }) =>
      updateDoctorScheduleApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDoctorScheduleApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
    },
  });
}

// === Date-specific Overrides ===
export function useDoctorOverrides(
  doctorId: string,
  params?: { from_date?: string; to_date?: string },
) {
  return useQuery({
    queryKey: [OVERRIDES_KEY, doctorId, params],
    queryFn: () => getDoctorOverridesApi(doctorId, params),
    enabled: !!doctorId,
  });
}

export function useCreateOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doctorId, input }: { doctorId: string; input: CreateOverridePayload }) =>
      createDoctorOverrideApi(doctorId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [OVERRIDES_KEY, variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: [OVERRIDES_KEY] });
    },
  });
}

export function useUpdateOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateOverridePayload> }) =>
      updateDoctorOverrideApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OVERRIDES_KEY] });
    },
  });
}

export function useDeleteOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDoctorOverrideApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OVERRIDES_KEY] });
    },
  });
}
