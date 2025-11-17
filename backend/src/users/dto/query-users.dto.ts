import { UserRole, UserStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class QueryUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

