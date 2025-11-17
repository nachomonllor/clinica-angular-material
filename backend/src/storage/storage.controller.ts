import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Delete,
  Param,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { SessionUser } from "../auth/types/session-user";
import { StorageService } from "./storage.service";

@UseGuards(SessionAuthGuard)
@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("profile-image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadProfileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: SessionUser,
  ) {
    if (!file) {
      throw new BadRequestException("No se proporcionó ningún archivo");
    }

    const result = await this.storageService.uploadProfileImage(file, user.id);
    return {
      success: true,
      filename: result.filename,
      url: result.url,
    };
  }

  @Delete("profile-image/:filename")
  async deleteProfileImage(
    @Param("filename") filename: string,
    @CurrentUser() user: SessionUser,
  ) {
    // Verificar que el archivo pertenece al usuario (el filename debe empezar con el userId)
    if (!filename.startsWith(user.id)) {
      throw new BadRequestException("No tienes permiso para eliminar este archivo");
    }

    await this.storageService.deleteProfileImage(filename);
    return { success: true };
  }
}
