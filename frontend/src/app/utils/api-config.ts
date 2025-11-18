/**
 * Configuración de la URL base de la API
 * 
 * Orden de prioridad:
 * 1. Variable de entorno API_BASE_URL (si está definida) - para deploy separado
 * 2. Si no es localhost, usar rutas relativas (backend sirve frontend en mismo dominio)
 * 3. En desarrollo local, usar http://localhost:3000
 */
export function getApiBaseUrl(): string {
  // Opción 1: Si hay una variable de entorno API_BASE_URL, usarla (para servicios separados)
  // En Angular, las variables de entorno se inyectan en build time
  // Pero también podemos leerlas del window si se inyectan en runtime
  if (typeof window !== 'undefined') {
    // Intentar leer de window.__API_BASE_URL__ (si se inyecta en runtime)
    const runtimeApiUrl = (window as any).__API_BASE_URL__;
    // Solo usar si está definida y no es undefined/null/string vacío
    if (runtimeApiUrl && typeof runtimeApiUrl === 'string' && runtimeApiUrl.trim() !== '') {
      return runtimeApiUrl;
    }
  }

  // Opción 2: Si estamos en producción pero en mismo dominio (backend sirve frontend)
  // usar rutas relativas (vacío = mismo origen)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Si es localhost, usar localhost:3000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // Si NO es localhost y no hay API_BASE_URL definida,
    // asumir que el backend sirve el frontend en el mismo dominio
    // (usar rutas relativas)
    return ''; // Ruta relativa = mismo dominio
  }
  
  // Fallback para desarrollo
  return 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();

