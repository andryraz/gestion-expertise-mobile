import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDisorderType,
  getDisorderTypes,
} from "@/services/disorder-type-services";
import type {
  CreateDisorderTypePayload,
  DisorderTypeCategory,
} from "@/types/disorder-type";

export const disorderTypesKeys = {
  all: ["disorder-types"] as const,
  list: (search?: string, category?: DisorderTypeCategory) =>
    [
      ...disorderTypesKeys.all,
      "list",
      search ?? null,
      category ?? null,
    ] as const,
};

export function useDisorderTypes(
  search?: string,
  category?: DisorderTypeCategory,
) {
  return useQuery({
    queryKey: disorderTypesKeys.list(search, category),
    queryFn: () => getDisorderTypes(search, category),
  });
}

export function useCreateDisorderType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDisorderTypePayload) =>
      createDisorderType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disorderTypesKeys.all });
    },
  });
}
