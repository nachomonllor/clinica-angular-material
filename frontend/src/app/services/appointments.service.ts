import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import type { Appointment, AppointmentStatus } from "../models/appointment.model";
import { API_BASE_URL } from "../utils/api-config";

export interface CreateAppointmentDto {
  slotId: string;
  pacienteId?: string;
  patientComment?: string;
}

export interface AppointmentActionDto {
  note?: string;
}

export interface FinalizeAppointmentDto {
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  specialistReview?: string;
  extraData?: Array<{ clave: string; valor: string }>;
}

export interface QueryAppointmentsParams {
  status?: AppointmentStatus;
  especialidadId?: string;
  pacienteId?: string;
  especialistaId?: string;
  search?: string;
}

@Injectable({ providedIn: "root" })
export class AppointmentsService {
  private http = inject(HttpClient);

  getMyAppointments(params?: QueryAppointmentsParams) {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set("status", params.status);
    if (params?.especialidadId)
      httpParams = httpParams.set("especialidadId", params.especialidadId);
    if (params?.pacienteId)
      httpParams = httpParams.set("pacienteId", params.pacienteId);
    if (params?.especialistaId)
      httpParams = httpParams.set("especialistaId", params.especialistaId);
    if (params?.search) httpParams = httpParams.set("search", params.search);

    return this.http.get<Appointment[]>(`${API_BASE_URL}/appointments/me`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getAdminAppointments(params?: QueryAppointmentsParams) {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set("status", params.status);
    if (params?.especialidadId)
      httpParams = httpParams.set("especialidadId", params.especialidadId);
    if (params?.search) httpParams = httpParams.set("search", params.search);

    return this.http.get<Appointment[]>(`${API_BASE_URL}/appointments/admin`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  createAppointment(dto: CreateAppointmentDto) {
    return this.http.post<Appointment>(`${API_BASE_URL}/appointments`, dto, {
      withCredentials: true,
    });
  }

  cancelAppointment(id: string, note?: string) {
    return this.http.patch<Appointment>(
      `${API_BASE_URL}/appointments/${id}/cancel`,
      { note },
,
    );
  }

  acceptAppointment(id: string) {
    return this.http.patch<Appointment>(
      `${API_BASE_URL}/appointments/${id}/accept`,
      {},
,
    );
  }

  rejectAppointment(id: string, note: string) {
    return this.http.patch<Appointment>(
      `${API_BASE_URL}/appointments/${id}/reject`,
      { note },
,
    );
  }

  finalizeAppointment(id: string, dto: FinalizeAppointmentDto) {
    return this.http.patch<Appointment>(
      `${API_BASE_URL}/appointments/${id}/finalize`,
      dto,
,
    );
  }

  patientReview(id: string, note: string) {
    return this.http.patch<Appointment>(
      `${API_BASE_URL}/appointments/${id}/patient-review`,
      { note },
,
    );
  }
}

