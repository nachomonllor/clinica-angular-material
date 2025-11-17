import { SlotDuration, Weekday } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class CreateAvailabilityDto {
  @IsInt()
  especialistaId: number;

  @IsInt()
  especialidadId: number;

  @IsEnum(Weekday)
  dayOfWeek: Weekday;

  @IsInt()
  @Min(0)
  @Max(1435)
  startMinute: number;

  @IsInt()
  @Min(5)
  @Max(1440)
  endMinute: number;

  @IsEnum(SlotDuration)
  duration: SlotDuration;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
