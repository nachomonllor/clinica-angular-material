import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import type { AppointmentSlot, QuerySlotsParams } from "../models/slot.model";
import { API_BASE_URL } from "../utils/api-config";

export interface Specialty {
  id: number;
  nombre: string;
  slug: string;
}

@Injectable({ providedIn: "root" })
export class SlotsService {
  private http = inject(HttpClient);

  getAvailableSlots(params: QuerySlotsParams) {
    let httpParams = new HttpParams();
    if (params.especialistaId)
      httpParams = httpParams.set("especialistaId", params.especialistaId.toString());
    if (params.especialidadId)
      httpParams = httpParams.set("especialidadId", params.especialidadId.toString());
    if (params.status) httpParams = httpParams.set("status", params.status);
    if (params.dateFrom) httpParams = httpParams.set("dateFrom", params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set("dateTo", params.dateTo);

    return this.http.get<AppointmentSlot[]>(`${API_BASE_URL}/slots`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  // Obtener todas las especialidades disponibles (que tienen especialistas asignados)
  getAllAvailableSpecialties() {
    return this.http.get<Specialty[]>(`${API_BASE_URL}/slots/specialties`, {
      withCredentials: true,
    });
  }
}

