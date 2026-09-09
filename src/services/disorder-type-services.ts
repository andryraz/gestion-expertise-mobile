import { apiRequest } from "@/services/api-client";
import type {
  CreateDisorderTypePayload,
  DisorderType,
  DisorderTypeCategory,
} from "@/types/disorder-type";

/**
 * Liste des types de désordres. `search` est envoyé au backend
 * (recherche insensible à la casse sur le nom et la description) :
 * le filtrage n'est PAS fait côté client.
 */
export function getDisorderTypes(
  search?: string,
  category?: DisorderTypeCategory,
) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const query = params.toString();
  return apiRequest<DisorderType[]>(
    `/disorder-types${query ? `?${query}` : ""}`,
    { auth: true },
  );
}

/**
 * Création d'un type de désordre. Le nom doit être unique :
 * le backend renvoie 409 si un type du même nom existe déjà.
 */
export function createDisorderType(payload: CreateDisorderTypePayload) {
  return apiRequest<DisorderType>("/disorder-types", {
    method: "POST",
    body: payload,
    auth: true,
  });
}
