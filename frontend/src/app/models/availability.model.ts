export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type SlotDuration = "MIN_15" | "MIN_30" | "MIN_60";

export interface SpecialistAvailability {
  id: number;
  especialistaId: number;
  especialidadId: number;
  dayOfWeek: Weekday;
  startMinute: number; // minutos desde medianoche (ej: 480 = 8:00)
  endMinute: number; // minutos desde medianoche (ej: 1140 = 19:00)
  duration: SlotDuration;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  especialidad?: {
    id: number;
    nombre: string;
    slug: string;
  };
}

export interface CreateAvailabilityDto {
  especialistaId: number;
  especialidadId: number;
  dayOfWeek: Weekday;
  startMinute: number;
  endMinute: number;
  duration: SlotDuration;
  active?: boolean;
}

export interface UpdateAvailabilityDto {
  especialidadId?: number;
  dayOfWeek?: Weekday;
  startMinute?: number;
  endMinute?: number;
  duration?: SlotDuration;
  active?: boolean;
}

export interface GenerateSlotsDto {
  days?: number; // default 15
}

