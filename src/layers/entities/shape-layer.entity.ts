import { ChildEntity, Column } from 'typeorm';
import { Layers, LayerType } from './layer.entity';

@ChildEntity()
export abstract class ShapeLayer extends Layers {
  @Column({ type: 'varchar', length: 50, nullable: true })
  fillColor: string;

  @Column({ type: 'float', default: 0 })
  borderRadius: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dashPattern: string;
}

@ChildEntity(LayerType.RECTANGLE)
export class RectangleLayer extends ShapeLayer {}

@ChildEntity(LayerType.CIRCLE)
export class CircleLayer extends ShapeLayer {}

@ChildEntity(LayerType.WAVE)
export class WaveLayer extends ShapeLayer {}