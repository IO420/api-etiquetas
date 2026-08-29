import { ChildEntity, Column } from 'typeorm';
import { Layers, LayerType } from './layer.entity';

@ChildEntity(LayerType.IMAGE)
export class ImageLayer extends Layers {
  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 50, default: 'cover' })
  objectFit: string; // cover, contain, fill

  @Column({ type: 'boolean', default: false })
  flipX: boolean;

  @Column({ type: 'boolean', default: false })
  flipY: boolean;
}