import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDepartmentsApi,
  getDepartmentByIdApi,
  createDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
} from '@/api/department.api';
import type { Department } from '@/types';

export const DEPARTMENTS_KEY = 'departments';

export function useDepartments() {
  return useQuery({
    queryKey: [DEPARTMENTS_KEY],
    queryFn: getDepartmentsApi,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: [DEPARTMENTS_KEY, id],
    queryFn: () => getDepartmentByIdApi(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<Department>) => createDepartmentApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Department> }) =>
      updateDepartmentApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDepartmentApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
    },
  });
}
