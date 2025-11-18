import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import session from "express-session";
import * as express from "express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para producción (cross-origin) o desarrollo (same-origin)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  
  // Determinar si frontend y backend están en dominios/puertos diferentes
  const hasFrontendUrl = !!process.env.FRONTEND_URL;
  
  // En producción con servicios separados, permitir el dominio del frontend explícitamente
  // En desarrollo, permitir localhost:4200 explícitamente
  let corsOrigin: string | string[] | boolean | undefined;
  
  if (isProduction && hasFrontendUrl && process.env.FRONTEND_URL) {
    // En producción, usar FRONTEND_URL si está configurado
    // Si FRONTEND_URL contiene múltiples URLs (separadas por coma), parsearlas
    const frontendUrls = process.env.FRONTEND_URL.split(",").map((url) => url.trim());
    corsOrigin = frontendUrls.length === 1 ? frontendUrls[0] : frontendUrls;
    console.log(`[Main] CORS configurado para producción con FRONTEND_URL: ${JSON.stringify(corsOrigin)}`);
  } else if (!isProduction) {
    // En desarrollo, permitir localhost:4200 y localhost:3000
    corsOrigin = ["http://localhost:4200", "http://localhost:3000"];
    console.log(`[Main] CORS configurado para desarrollo: ${JSON.stringify(corsOrigin)}`);
  } else {
    // En producción sin FRONTEND_URL, permitir todos los orígenes (menos seguro pero funcional)
    // Esto permite que funcione incluso si no está configurado FRONTEND_URL
    corsOrigin = true;
    console.log(`[Main] CORS configurado para permitir todos los orígenes (fallback - configurar FRONTEND_URL para mayor seguridad)`);
  }
  
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use(cookieParser());
  
  // Configurar cookies de sesión para soportar cross-origin
  const cookieConfig: any = {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
  };
  
  // Para producción HTTPS con dominios diferentes, usar sameSite: "none" y secure: true
  // Esto es necesario para que las cookies funcionen en cross-origin HTTPS
  // Si hay FRONTEND_URL configurado, asumimos que son servicios separados (cross-origin)
  // En Railway/cloud, generalmente estamos en HTTPS, así que usamos secure: true
  if (isProduction) {
    // En producción, siempre usar sameSite: "none" y secure: true para cross-origin HTTPS
    // Esto funciona tanto si el frontend está en el mismo dominio como si está separado
    cookieConfig.sameSite = "none";
    cookieConfig.secure = true; // Requerido para sameSite: "none" y para HTTPS
  } else {
    // Desarrollo local: sameSite: "lax" funciona para localhost:4200 -> localhost:3000
    cookieConfig.sameSite = "lax";
    cookieConfig.secure = false; // No requerido en localhost HTTP
  }
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? "change-me",
      resave: false,
      saveUninitialized: false,
      cookie: cookieConfig,
    }),
  );
  
  console.log(`[Main] CORS configurado para origen: ${JSON.stringify(corsOrigin)}`);
  console.log(`[Main] Cookies configuradas: sameSite=${cookieConfig.sameSite}, secure=${cookieConfig.secure}`);
  console.log(`[Main] NODE_ENV: ${nodeEnv}, FRONTEND_URL: ${process.env.FRONTEND_URL || "no configurado"}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Servir archivos estáticos de uploads (solo si STORAGE_TYPE=local)
  const storageType = process.env.STORAGE_TYPE || "local";
  if (storageType === "local") {
    const uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), "uploads");
    app.use("/uploads", express.static(uploadsDir));
  }

  // Servir archivos estáticos del frontend Angular (solo en producción y si existe)
  // En desarrollo, el frontend corre en puerto 4200 separado
  if (isProduction) {
    const frontendDistPath = process.env.FRONTEND_DIST_PATH || join(process.cwd(), "..", "frontend", "dist", "frontend", "browser");
    const fs = require("fs");
    const indexHtmlPath = join(frontendDistPath, "index.html");
    
    // Solo servir el frontend si el directorio existe y tiene index.html
    const frontendExists = fs.existsSync(frontendDistPath) && fs.existsSync(indexHtmlPath);
    
    if (frontendExists) {
      console.log(`[Main] Frontend encontrado en: ${frontendDistPath}`);
      
      // Rutas de API que NO deben servir el frontend
      const apiRoutes = [
        "/api",
        "/auth",
        "/admin",
        "/appointments",
        "/availability",
        "/slots",
        "/medical-records",
        "/storage",
        "/specialists",
        "/uploads",
      ];

      // Servir archivos estáticos del frontend PRIMERO
      // Esto permite que archivos JS, CSS, imágenes se sirvan directamente
      app.use(express.static(frontendDistPath));

      // Middleware catch-all para SPA routing (sirve index.html para rutas no-API)
      // Este middleware se ejecuta ANTES de las rutas de NestJS para capturar rutas del frontend
      // Pero respeta las rutas de API
      app.use((req, res, next) => {
        // Si es una ruta de API, pasar al siguiente middleware (NestJS la manejará)
        const isApiRoute = apiRoutes.some((route) => req.path.startsWith(route));
        const isStaticFile = req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
        
        if (isApiRoute || isStaticFile) {
          return next();
        }
        
        // Para rutas del frontend (SPA routing), servir index.html
        // Usar res.sendFile con path absoluto
        res.sendFile(indexHtmlPath, (err) => {
          if (err) {
            console.error("[Main] Error al servir index.html:", err);
            next(err);
          }
        });
      });
    } else {
      console.log(`[Main] Frontend no encontrado en: ${frontendDistPath} - Solo sirviendo API backend`);
    }
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
