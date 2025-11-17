import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class MedicalExtraFieldDto {
  @IsString()
  clave: string;

  @IsString()
  valor: string;
}

export class FinalizeAppointmentDto {
  @IsInt()
  @Min(30)
  @Max(300)
  altura: number;

  @IsInt()
  @Min(1)
  @Max(500)
  peso: number;

  @IsNumber()
  @Min(30)
  @Max(45)
  temperatura: number;

  @IsString()
  presion: string;

  @IsOptional()
  @IsString()
  specialistReview?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MedicalExtraFieldDto)
  @ArrayMaxSize(3)
  @IsArray()
  extraData?: MedicalExtraFieldDto[];
}

