import { SlotStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional } from "class-validator";

export class QuerySlotsDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  especialistaId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  especialidadId?: number;

  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

