import { IsString, IsOptional, MaxLength } from "class-validator";

export class AppointmentActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

