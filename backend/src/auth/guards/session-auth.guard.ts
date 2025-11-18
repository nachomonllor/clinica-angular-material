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
    console.log(`[SessionAuthGuard] Session ID: ${request.sessionID || 'N/A'}`);
    console.log(`[SessionAuthGuard] Session existe: ${!!request.session}`);
    console.log(`[SessionAuthGuard] Session.user existe: ${!!request?.session?.user}`);
    console.log(`[SessionAuthGuard] Session.user:`, request?.session?.user ? `✅ ${request.session.user.id}` : '❌ No existe');
    console.log(`[SessionAuthGuard] Cookies recibidas:`, request.headers.cookie ? Object.keys(request.cookies || {}) : 'Ninguna');
    console.log(`[SessionAuthGuard] Cookie connect.sid:`, request.cookies?.['connect.sid'] ? `✅ Existe (${request.cookies['connect.sid'].substring(0, 20)}...)` : '❌ No existe');
    if (request.cookies?.['connect.sid']) {
      console.log(`[SessionAuthGuard] Cookie connect.sid completa:`, request.cookies['connect.sid']);
    }
    
    if (!request?.session?.user) {
      console.log(`[SessionAuthGuard] ❌ Sesión no válida - Unauthorized`);
      throw new UnauthorizedException();
    }

    console.log(`[SessionAuthGuard] ✅ Sesión válida para usuario: ${request.session.user.id}`);
    return true;
  }
}

