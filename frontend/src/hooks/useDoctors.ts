import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDoctorsApi,
  getDoctorByIdApi,
  createDoctorApi,
  updateDoctorApi,
  deleteDoctorApi,
  type GetDoctorsParams,
} from '@/api/doctor.api';
import type { Doctor } from '@/types';

export const DOCTORS_KEY = 'doctors';

export function useDoctors(params?: GetDoctorsParams) {
  return useQuery({
    queryKey: [DOCTORS_KEY, params],
    queryFn: () => getDoctorsApi(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: [DOCTORS_KEY, id],
    queryFn: () => getDoctorByIdApi(id),
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<Doctor>) => createDoctorApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCTORS_KEY] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Doctor> }) =>
      updateDoctorApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCTORS_KEY] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDoctorApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCTORS_KEY] });
    },
  });
}
