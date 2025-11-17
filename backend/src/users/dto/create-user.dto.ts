import { UserRole } from "@prisma/client";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class PacienteProfileDto {
  @IsNotEmpty()
  @IsString()
  obraSocial: string;

  @IsOptional()
  @IsString()
  imagenUno?: string;

  @IsOptional()
  @IsString()
  imagenDos?: string;
}

class EspecialistaProfileDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  especialidades: string[];

  @IsOptional()
  @IsString()
  imagen?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

class AdminProfileDto {
  @IsOptional()
  @IsString()
  imagen?: string;
}

export class CreateUserDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  apellido: string;

  @IsInt()
  @Min(0)
  edad: number;

  @IsNotEmpty()
  @IsString()
  dni: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @ValidateNested()
  @Type(() => PacienteProfileDto)
  @IsOptional()
  paciente?: PacienteProfileDto;

  @ValidateNested()
  @Type(() => EspecialistaProfileDto)
  @IsOptional()
  especialista?: EspecialistaProfileDto;

  @ValidateNested()
  @Type(() => AdminProfileDto)
  @IsOptional()
  admin?: AdminProfileDto;
}
