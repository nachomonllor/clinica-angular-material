import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { tap } from "rxjs";
import type { User } from "../models/user.model";
import { API_BASE_URL } from "../utils/api-config";

interface LoginResponse {
  user: User;
}

interface SessionResponse {
  user: User | null;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  loadSession() {
    return this.http
      .get<SessionResponse>(`${API_BASE_URL}/auth/session`, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.currentUser.set(res.user ?? null);
        }),
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          this.currentUser.set(res.user);
        }),
      );
  }

  register(data: {
    nombre: string;
    apellido: string;
    edad: number;
    dni: string;
    email: string;
    password: string;
    role?: "PATIENT" | "SPECIALIST" | "ADMIN";
    paciente?: {
      obraSocial: string;
    };
    especialista?: {
      especialidades: string[];
    };
  }) {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/register`, data, {
      withCredentials: true,
    });
  }

  logout() {
    return this.http
      .post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUser.set(null);
        }),
      );
  }

  setCurrentUser(user: User) {
    this.currentUser.set(user);
  }
}


