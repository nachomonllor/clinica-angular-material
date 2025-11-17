export type UserRole = "PATIENT" | "SPECIALIST" | "ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  especialista?: {
    id: number;
    imagen?: string | null;
    notas?: string | null;
    especialidades: string[]; // Nombres de especialidades
  };
  paciente?: {
    obraSocial: string;
    imagenUno?: string | null;
    imagenDos?: string | null;
  };
  admin?: {
    imagen?: string | null;
  };
}


