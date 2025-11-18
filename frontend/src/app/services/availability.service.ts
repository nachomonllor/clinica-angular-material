import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import type {
  SpecialistAvailability,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  GenerateSlotsDto,
} from "../models/availability.model";

import { API_BASE_URL } from "../utils/api-config";

@Injectable({ providedIn: "root" })
export class AvailabilityService {
  private http = inject(HttpClient);

  getAvailability(especialistaId: number, active?: boolean) {
    let httpParams = new HttpParams().set("especialistaId", especialistaId.toString());
    if (active !== undefined) httpParams = httpParams.set("active", active.toString());

    return this.http.get<SpecialistAvailability[]>(`${API_BASE_URL}/availability`, {
      params: httpParams,
    });
  }

  createAvailability(dto: CreateAvailabilityDto) {
    return this.http.post<SpecialistAvailability>(`${API_BASE_URL}/availability`, dto);
  }

  updateAvailability(id: number, dto: UpdateAvailabilityDto) {
    return this.http.patch<SpecialistAvailability>(
      `${API_BASE_URL}/availability/${id}`,
      dto,
    );
  }

  generateSlots(especialistaId: number, dto?: GenerateSlotsDto) {
    return this.http.post<{ created: number }>(
      `${API_BASE_URL}/availability/specialist/${especialistaId}/generate-slots`,
      dto ?? {},
    );
  }
}

