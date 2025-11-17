/**
 * Configuración de la URL base de la API
 * 
 * En producción (cuando el backend sirve el frontend):
 * - Usa rutas relativas (vacío = mismo dominio)
 * 
 * En desarrollo:
 * - Usa http://localhost:3000 (backend en puerto 3000)
 */
export function getApiBaseUrl(): string {
  // Si estamos en producción (servido por el backend en el mismo dominio)
  // usar rutas relativas (vacío = mismo origen)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Si NO es localhost, estamos en producción
    // Usar rutas relativas (el backend sirve el frontend en el mismo dominio)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return ''; // Ruta relativa = mismo dominio
    }
  }
  
  // En desarrollo, usar localhost:3000
  return 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();

