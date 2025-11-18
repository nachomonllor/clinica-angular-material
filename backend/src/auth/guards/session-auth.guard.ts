import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Logging para debug
    console.log(`[SessionAuthGuard] Validando sesión para ${request.method} ${request.path}`);
    console.log(`[SessionAuthGuard] Session existe: ${!!request.session}`);
    console.log(`[SessionAuthGuard] Session.user existe: ${!!request?.session?.user}`);
    console.log(`[SessionAuthGuard] Cookies recibidas:`, request.headers.cookie ? Object.keys(request.cookies || {}) : 'Ninguna');
    
    if (!request?.session?.user) {
      console.log(`[SessionAuthGuard] ❌ Sesión no válida - Unauthorized`);
      throw new UnauthorizedException();
    }

    console.log(`[SessionAuthGuard] ✅ Sesión válida para usuario: ${request.session.user.id}`);
    return true;
  }
}

