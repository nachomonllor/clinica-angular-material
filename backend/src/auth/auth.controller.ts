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
import { SessionAuthGuard } from "./guards/session-auth.guard";

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
  login(@Body() _: LoginDto, @Req() req: AuthenticatedRequest) {
    console.log(`[AuthController] Login intento - User: ${req.user?.id}, Session: ${!!req.session}`);
    
    if (!req.user || !req.session) {
      console.log(`[AuthController] ❌ Login fallido - Usuario o sesión no válidos`);
      throw new UnauthorizedException();
    }

    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;
    const userAgent = req.headers["user-agent"];

    const result = this.authService.login(req.user as any, req.session, ip, userAgent);
    console.log(`[AuthController] ✅ Login exitoso para usuario: ${req.user.id}`);
    console.log(`[AuthController] Session ID: ${req.sessionID}`);
    console.log(`[AuthController] Cookie config: sameSite=${req.session.cookie?.sameSite}, secure=${req.session.cookie?.secure}`);
    console.log(`[AuthController] Session.user después del login:`, req.session.user ? `✅ ${req.session.user.id}` : '❌ No existe');
    
    return result;
  }

  @UseGuards(SessionAuthGuard)
  @Post("logout")
  logout(@Req() req: Request) {
    return this.authService.logout(req.session);
  }

  @Get("session")
  session(@Req() req: Request) {
    console.log(`[AuthController] Session check - Session existe: ${!!req.session}, User existe: ${!!req.session?.user}`);
    console.log(`[AuthController] Cookies recibidas:`, req.headers.cookie ? 'Sí' : 'No');
    return this.authService.session(req.session);
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }
}
