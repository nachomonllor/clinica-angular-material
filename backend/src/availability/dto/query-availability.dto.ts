import { Weekday } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional } from "class-validator";

export class QueryAvailabilityDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  especialistaId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  especialidadId?: number;

  @IsOptional()
  @IsEnum(Weekday)
  dayOfWeek?: Weekday;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

