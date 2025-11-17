import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    // En desarrollo (NODE_ENV !== 'production'), devolver mensaje de que el backend está corriendo
    // En producción, esta ruta NO debería ejecutarse porque el middleware sirve el frontend primero
    // Si llegamos aquí en producción, es un fallback por si algo falló
    return this.appService.getHello();
  }
}
