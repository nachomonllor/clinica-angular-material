import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import type { MedicalRecord } from "../models/appointment.model";
import type { User } from "../models/user.model";
import { API_BASE_URL } from "../utils/api-config";

@Injectable({ providedIn: "root" })
export class MedicalRecordsService {
  private http = inject(HttpClient);

  // Para pacientes: obtener sus propios registros médicos
  getMyRecords() {
    return this.http.get<MedicalRecord[]>(`${API_BASE_URL}/medical-records/me`, {
      withCredentials: true,
    });
  }

  // Para admins: obtener historia clínica de un paciente específico
  getPatientRecords(patientId: string) {
    return this.http.get<MedicalRecord[]>(
      `${API_BASE_URL}/medical-records/admin/patient/${patientId}`,
,
    );
  }

  // Para especialistas: listar pacientes que ha atendido
  getSpecialistPatients() {
    return this.http.get<Array<User & { paciente?: { obraSocial: string } }>>(
      `${API_BASE_URL}/medical-records/specialist/patients`,
,
    );
  }

  // Para especialistas: obtener historia clínica de un paciente específico
  getSpecialistPatientHistory(patientId: string) {
    return this.http.get<MedicalRecord[]>(
      `${API_BASE_URL}/medical-records/specialist/patient/${patientId}`,
,
    );
  }
}

