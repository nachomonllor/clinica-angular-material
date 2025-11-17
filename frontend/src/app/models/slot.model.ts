export type SlotStatus = "FREE" | "RESERVED" | "CANCELLED";
export type SlotDuration = "MIN_15" | "MIN_30" | "MIN_60";

export interface AppointmentSlot {
  id: string;
  especialistaId: number;
  especialidadId: number;
  date: string; // ISO date (YYYY-MM-DD)
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  duration: SlotDuration;
  status: SlotStatus;
  createdAt: string;
  updatedAt: string;
  specialistAvailabilityId: number;
  especialidad?: {
    id: number;
    nombre: string;
    slug: string;
  };
  specialist?: {
    id: number;
    userId: string;
    user: {
      id: string;
      nombre: string;
      apellido: string;
      email: string;
    };
  };
}

export interface QuerySlotsParams {
  especialistaId?: number;
  especialidadId?: number;
  status?: SlotStatus;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
}

