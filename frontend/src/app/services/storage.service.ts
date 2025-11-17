import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { API_BASE_URL } from "../utils/api-config";

export interface UploadImageResponse {
  success: boolean;
  filename: string;
  url: string;
}

@Injectable({ providedIn: "root" })
export class StorageService {
  private http = inject(HttpClient);

  /**
   * Subir una imagen de perfil
   * @param file Archivo de imagen a subir
   * @returns Observable con la respuesta del servidor (filename y url)
   */
  uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return this.http.post<UploadImageResponse>(
      `${API_BASE_URL}/storage/profile-image`,
      formData,
      { withCredentials: true }
    );
  }

  /**
   * Eliminar una imagen de perfil
   * @param filename Nombre del archivo a eliminar
   * @returns Observable con la respuesta del servidor
   */
  deleteProfileImage(filename: string) {
    return this.http.delete<{ success: boolean }>(
      `${API_BASE_URL}/storage/profile-image/${filename}`,
      { withCredentials: true }
    );
  }

  /**
   * Obtener la URL completa de una imagen
   * @param imageUrl URL relativa o absoluta de la imagen
   * @returns URL completa de la imagen
   */
  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return "";

    // Si ya es una URL absoluta (http:// o https://), devolverla tal cual
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Si es una URL relativa que empieza con /uploads, concatenar con API_BASE_URL
    if (imageUrl.startsWith("/uploads")) {
      return `${API_BASE_URL}${imageUrl}`;
    }

    // Si es solo el nombre del archivo, construir la URL completa
    return `${API_BASE_URL}/uploads/profiles/${imageUrl}`;
  }
}

