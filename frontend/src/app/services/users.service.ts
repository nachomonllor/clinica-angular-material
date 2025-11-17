import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import type { User } from "../models/user.model";
import { API_BASE_URL } from "../utils/api-config";

@Injectable({ providedIn: "root" })
export class UsersService {
  private http = inject(HttpClient);

  getCurrentUser() {
    return this.http.get<User>(`${API_BASE_URL}/auth/session`, {
      withCredentials: true,
    });
  }

  // Para admins: obtener lista de pacientes
  getPatients() {
    return this.http.get<User[]>(`${API_BASE_URL}/admin/users?role=PATIENT`, {
      withCredentials: true,
    });
  }

  // Para especialistas: obtener especialidades del especialista actual (más fácil)
  getMySpecialties() {
    return this.http.get<Array<{ id: number; nombre: string; slug: string }>>(
      `${API_BASE_URL}/specialists/me/specialties`,
      { withCredentials: true }
    );
  }

  // Para especialistas: obtener especialidades de un especialista específico (por ID)
  getSpecialistSpecialties(especialistaId: number) {
    return this.http.get<Array<{ id: number; nombre: string; slug: string }>>(
      `${API_BASE_URL}/specialists/${especialistaId}/specialties`,
      { withCredentials: true }
    );
  }
}

