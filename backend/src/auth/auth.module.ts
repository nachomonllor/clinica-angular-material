import { Global, Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { EmailModule } from "../email/email.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./guards/roles.guard";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { LocalStrategy } from "./strategies/local.strategy";

@Global()
@Module({
  imports: [UsersModule, EmailModule, PassportModule.register({ session: false })],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionAuthGuard, RolesGuard],
  exports: [SessionAuthGuard, RolesGuard],
})
export class AuthModule {}
