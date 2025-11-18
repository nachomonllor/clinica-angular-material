import { Directive, HostBinding, Input } from "@angular/core";

type EstadoTurno =
  | "pending"
  | "pendiente"
  | "accepted"
  | "aceptado"
  | "done"
  | "realizado"
  | "cancelled"
  | "cancelado"
  | "rejected"
  | "rechazado";

@Directive({
  selector: "[appStatusBadge]",
  standalone: true,
})
export class StatusBadgeDirective {
  private estadoInterno: EstadoTurno | undefined;

  @HostBinding("class.badge") baseClass = true;
  @HostBinding("class.badge-pending") pending = false;
  @HostBinding("class.badge-accepted") accepted = false;
  @HostBinding("class.badge-done") done = false;
  @HostBinding("class.badge-cancelled") cancelled = false;
  @HostBinding("class.badge-rejected") rejected = false;

  @Input()
  set appStatusBadge(value: string | EstadoTurno | null | undefined) {
    const normalizado = (value || "").toLowerCase() as EstadoTurno;
    this.estadoInterno = normalizado;
    this.actualizarClases();
  }

  private actualizarClases(): void {
    // Reset todas las clases
    this.pending = false;
    this.accepted = false;
    this.done = false;
    this.cancelled = false;
    this.rejected = false;

    const estado = this.estadoInterno;
    
    // Aplicar clase según el estado
    if (estado === "pending" || estado === "pendiente") {
      this.pending = true;
    } else if (estado === "accepted" || estado === "aceptado") {
      this.accepted = true;
    } else if (estado === "done" || estado === "realizado") {
      this.done = true;
    } else if (estado === "cancelled" || estado === "cancelado") {
      this.cancelled = true;
    } else if (estado === "rejected" || estado === "rechazado") {
      this.rejected = true;
    }
  }
}

