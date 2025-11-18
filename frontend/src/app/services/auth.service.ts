import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, of } from "rxjs";
import type { User } from "../models/user.model";
import { API_BASE_URL } from "../utils/api-config";

interface LoginResponse {
  user: User;
  token: string;
}

interface SessionResponse {
  user: User | null;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  loadSession() {
    // Si no hay token, retornar user null inmediatamente
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return of({ user: null }).pipe(
        tap((res) => {
          this.currentUser.set(res.user ?? null);
        }),
      );
    }

    return this.http
      .get<SessionResponse>(`${API_BASE_URL}/auth/session`)
      .pipe(
        tap((res) => {
          this.currentUser.set(res.user ?? null);
          // Si el token es inválido, borrar el token
          if (!res.user) {
            localStorage.removeItem("auth_token");
          }
        }),
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(
        `${API_BASE_URL}/auth/login`,
        { email, password },
      )
      .pipe(
        tap((res) => {
          // Guardar token en localStorage
          if (res.token) {
            localStorage.setItem("auth_token", res.token);
          }
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
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/register`, data).pipe(
      tap((res) => {
        // Guardar token en localStorage si está disponible
        if (res.token) {
          localStorage.setItem("auth_token", res.token);
        }
        if (res.user) {
          this.currentUser.set(res.user);
        }
      }),
    );
  }

  logout() {
    return this.http.post(`${API_BASE_URL}/auth/logout`, {}).pipe(
      tap(() => {
        // Borrar token de localStorage
        localStorage.removeItem("auth_token");
        this.currentUser.set(null);
      }),
    );
  }

  setCurrentUser(user: User) {
    this.currentUser.set(user);
  }
}


