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
  @HostBinding("class.badge-ok") ok = false;
  @HostBinding("class.badge-warn") warn = false;
  @HostBinding("class.badge-bad") bad = false;

  @Input()
  set appStatusBadge(value: string | EstadoTurno | null | undefined) {
    const normalizado = (value || "").toLowerCase() as EstadoTurno;
    this.estadoInterno = normalizado;
    this.actualizarClases();
  }

  private actualizarClases(): void {
    const estado = this.estadoInterno;
    this.ok =
      estado === "realizado" ||
      estado === "done" ||
      estado === "aceptado" ||
      estado === "accepted";
    this.warn =
      estado === "pendiente" ||
      estado === "pending" ||
      estado === "aceptado" ||
      estado === "accepted";
    this.bad =
      estado === "cancelado" ||
      estado === "cancelled" ||
      estado === "rechazado" ||
      estado === "rejected";
  }
}

