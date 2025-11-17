import { AppointmentStatus } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class CreateAppointmentDto {
  @IsUUID()
  slotId: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @IsOptional()
  @IsString()
  patientComment?: string;
}
