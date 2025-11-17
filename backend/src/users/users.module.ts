import { Module } from "@nestjs/common";
import { UsersController, SpecialistsController, MyProfileController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController, SpecialistsController, MyProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
