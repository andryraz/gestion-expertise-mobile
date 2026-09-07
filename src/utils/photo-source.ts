import { API_URL } from "@/constants/api";
import type { Photo } from "@/types/photo";

/**
 * Les photos distantes sont servies depuis `${API_URL}/${photo.filePath}`.
 * Les placeholders optimistes référencent une URI locale (file://) — ils
 * s'affichent tels quels.
 */
export function getPhotoUri(photo: Photo): string {
  if (photo.filePath.startsWith("file://")) return photo.filePath;
  return `${API_URL}/${photo.filePath.replace(/^\//, "")}`;
}

export function isPendingPhoto(photo: Photo): boolean {
  return photo.id.startsWith("pending-") || photo.filePath.startsWith("file://");
}
