import { Pipe, PipeTransform } from "@angular/core";

const ROL_LABELS: Record<string, string> = {
  patient: "Paciente",
  paciente: "Paciente",
  specialist: "Especialista",
  especialista: "Especialista",
  admin: "Administrador",
  administrator: "Administrador",
};

@Pipe({
  name: "roleLabel",
  standalone: true,
})
export class RoleLabelPipe implements PipeTransform {
  transform(rol?: string | null, fallback = "—"): string {
    if (!rol) {
      return fallback;
    }
    const key = rol.toLowerCase();
    return ROL_LABELS[key] || fallback;
  }
}

