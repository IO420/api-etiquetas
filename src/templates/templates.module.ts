import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Layers } from '@/layers/entities/layer.entity';
import { Template } from './entities/template.entity';
import { TextLayer } from '@/layers/entities/text-layer.entity';
import { ComponentLayer } from '@/layers/entities/component-layer.entity';
import { ImageLayer } from '@/layers/entities/image-layer.entity';
import { ImageModule } from '@/image/image.module';
import { CircleLayer, RectangleLayer, ShapeLayer, WaveLayer } from '@/layers/entities/shape-layer.entity';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Layers,
      Template,
      TextLayer,
      ComponentLayer,
      ImageLayer,
      ShapeLayer,
      RectangleLayer,
      CircleLayer,
      WaveLayer
    ]),
    ImageModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
