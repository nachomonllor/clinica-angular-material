export interface LoginLog {
  id: number;
  userId: string;
  createdAt: string;
  ip?: string | null;
  userAgent?: string | null;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    role: string;
  };
}

export interface TurnosPorEspecialidad {
  especialidadId: number;
  _count: {
    _all: number;
  };
}

export interface TurnosPorDia {
  date: string; // ISO date string
  count: number;
}

export interface TurnosPorMedico {
  especialistaId: number;
  _count: {
    _all: number;
  };
}

export interface QueryReportParams {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  userId?: string; // Solo para logins
  soloFinalizados?: boolean; // Solo para turnos por médico
}

