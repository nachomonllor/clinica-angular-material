export type AppointmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DONE"
  | "CANCELLED"
  | "REJECTED";

export interface AppointmentSlot {
  id: string;
  especialistaId: number;
  especialidadId: number;
  date: string; // ISO date
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  duration: "MIN_15" | "MIN_30" | "MIN_60";
  status: "FREE" | "RESERVED" | "CANCELLED";
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

export interface MedicalExtraField {
  clave: string;
  valor: string;
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  pacienteId: string;
  especialistaId: number;
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  extraData: MedicalExtraField[];
  searchText: string;
  createdAt: string;
  updatedAt: string;
  appointment: {
    id: string;
    especialidad: {
      id: number;
      nombre: string;
      slug: string;
    };
    specialist: {
      user: {
        id: string;
        nombre: string;
        apellido: string;
        email: string;
      };
    };
    slot: {
      date: string;
      startAt: string;
      endAt: string;
    };
  };
  especialista: {
    user: {
      id: string;
      nombre: string;
      apellido: string;
      email: string;
    };
  };
}

export interface Appointment {
  id: string;
  slotId: string;
  especialistaId: number;
  especialidadId: number;
  pacienteId: string;
  creadoPorId: string;
  status: AppointmentStatus;
  cancelReason: string | null;
  rejectReason: string | null;
  specialistReview: string | null;
  patientComment: string | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  slot: AppointmentSlot;
  especialidad: {
    id: number;
    nombre: string;
    slug: string;
  };
  specialist: {
    id: number;
    userId: string;
    user: {
      id: string;
      nombre: string;
      apellido: string;
      email: string;
    };
  };
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  creadoPor: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  medicalRecord: MedicalRecord | null;
}

