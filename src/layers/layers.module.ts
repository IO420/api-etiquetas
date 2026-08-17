import { Module } from '@nestjs/common';
import { LayersService } from './layers.service';
import { LayersController } from './layers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from '@/templates/entities/template.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Template])],
  controllers: [LayersController],
  providers: [LayersService],
})
export class LayersModule {}
