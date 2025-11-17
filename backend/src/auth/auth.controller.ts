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
    if (!req.user || !req.session) {
      throw new UnauthorizedException();
    }

    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;
    const userAgent = req.headers["user-agent"];

    return this.authService.login(req.user as any, req.session, ip, userAgent);
  }

  @UseGuards(SessionAuthGuard)
  @Post("logout")
  logout(@Req() req: Request) {
    return this.authService.logout(req.session);
  }

  @Get("session")
  session(@Req() req: Request) {
    return this.authService.session(req.session);
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }
}
