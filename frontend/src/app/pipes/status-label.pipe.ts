import { Pipe, PipeTransform } from "@angular/core";

const ESTADOS: Record<string, string> = {
  pending: "Pendiente",
  aceptado: "Aceptado",
  accepted: "Aceptado",
  realizado: "Realizado",
  done: "Realizado",
  cancelado: "Cancelado",
  cancelled: "Cancelado",
  rechazado: "Rechazado",
  rejected: "Rechazado",
};

@Pipe({
  name: "statusLabel",
  standalone: true,
})
export class StatusLabelPipe implements PipeTransform {
  transform(estado?: string | null, fallback = "—"): string {
    if (!estado) {
      return fallback;
    }
    const key = estado.toLowerCase();
    return ESTADOS[key] || fallback;
  }
}

