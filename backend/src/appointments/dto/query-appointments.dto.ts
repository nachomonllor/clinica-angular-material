import { AppointmentStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class QueryAppointmentsDto {
  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @IsOptional()
  @IsUUID()
  especialistaId?: string;

  @IsOptional()
  @IsUUID()
  especialidadId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

