import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointmentTypesApi,
  getAppointmentTypeByIdApi,
  createAppointmentTypeApi,
  updateAppointmentTypeApi,
  deleteAppointmentTypeApi,
  type GetAppointmentTypesParams,
} from '@/api/appointment-type.api';
import type { AppointmentType } from '@/types';

export const APPOINTMENT_TYPES_KEY = 'appointment-types';

export function useAppointmentTypes(params?: GetAppointmentTypesParams) {
  return useQuery({
    queryKey: [APPOINTMENT_TYPES_KEY, params],
    queryFn: () => getAppointmentTypesApi(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAppointmentType(id: string) {
  return useQuery({
    queryKey: [APPOINTMENT_TYPES_KEY, id],
    queryFn: () => getAppointmentTypeByIdApi(id),
    enabled: !!id,
  });
}

export function useCreateAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<AppointmentType>) => createAppointmentTypeApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_TYPES_KEY] });
    },
  });
}

export function useUpdateAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AppointmentType> }) =>
      updateAppointmentTypeApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_TYPES_KEY] });
    },
  });
}

export function useDeleteAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppointmentTypeApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENT_TYPES_KEY] });
    },
  });
}
