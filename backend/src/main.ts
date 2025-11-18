import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import session from "express-session";
import * as express from "express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? "change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  );

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
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "production") {
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
