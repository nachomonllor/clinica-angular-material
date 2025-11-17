import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
