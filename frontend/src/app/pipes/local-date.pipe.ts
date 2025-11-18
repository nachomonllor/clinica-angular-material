import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "localDate",
  standalone: true,
  pure: false,
})
export class LocalDatePipe implements PipeTransform {
  transform(value: any, format: string = "mediumDate", tz?: string | null) {
    // Si el valor es null/undefined, retornar cadena vacía
    if (!value) {
      return "";
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return "";
      }

      const lang = localStorage.getItem("lang") || "es";
      
      // Formateo manual que funciona sin depender de locales de Angular
      // Esto es más robusto y no requiere registrar locales
      if (format === "short") {
        // Formato: dd/MM/yyyy HH:mm
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }

      // Para otros formatos, usar toLocaleString del navegador (más robusto)
      // El navegador soporta "es-AR" nativamente sin necesidad de registrarlo
      const localeMap: Record<string, string> = {
        en: "en-US",
        pt: "pt-BR",
        es: "es-AR",
      };
      const browserLocale = localeMap[lang] || "es-AR";

      // Mapear formatos comunes a opciones de toLocaleString
      if (format === "mediumDate") {
        return date.toLocaleDateString(browserLocale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      if (format === "shortDate") {
        return date.toLocaleDateString(browserLocale, {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        });
      }

      if (format === "fullDate") {
        return date.toLocaleDateString(browserLocale, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

      // Formato por defecto: fecha y hora completa
      return date.toLocaleString(browserLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("[LocalDatePipe] Error al formatear fecha:", error, "valor:", value);
      return "";
    }
  }
}

