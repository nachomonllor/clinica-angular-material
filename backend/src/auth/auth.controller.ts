import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/create-auth.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

type AuthenticatedRequest = Request & {
  user?: any;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Body() _: LoginDto, @Req() req: AuthenticatedRequest) {
    console.log(`[AuthController] Login intento - User: ${req.user?.id}, Session: ${!!req.session}`);
    
    if (!req.user) {
      console.log(`[AuthController] ❌ Login fallido - Usuario no válido`);
      throw new UnauthorizedException();
    }

    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;
    const userAgent = req.headers["user-agent"];

    // Usar sesión si está disponible, sino null (JWT funciona sin sesión)
    const loginResult = await this.authService.login(req.user as any, req.session || null, ip, userAgent);
    
    console.log(`[AuthController] ✅ Login exitoso para usuario: ${req.user.id}`);
    console.log(`[AuthController] JWT token generado: ${loginResult.token ? '✅ Sí' : '❌ No'}`);
    
    return loginResult;
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout() {
    // Con JWT, el logout es simplemente borrar el token del cliente
    // No hay sesión que destruir
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("session")
  session(@Req() req: AuthenticatedRequest) {
    // Con JWT, el user viene de req.user (validado por JwtAuthGuard)
    if (!req.user) {
      return { user: null };
    }
    return { user: req.user };
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }
}
