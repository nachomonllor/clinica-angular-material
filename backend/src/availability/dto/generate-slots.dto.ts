import { IsInt, IsOptional, Max, Min } from "class-validator";

export class GenerateSlotsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number;
}

