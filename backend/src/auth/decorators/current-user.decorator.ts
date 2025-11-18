import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Intentar leer user de req.user (JWT) o req.session.user (sesión) para compatibilidad
    return request.user || request.session?.user;
  },
);

