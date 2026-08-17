import { ChildEntity, Column } from 'typeorm';
import { Layers, LayerType } from './layer.entity';

@ChildEntity(LayerType.TEXT)
export class TextLayer extends Layers {
  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string;

  @Column({ type: 'int', default: 16 })
  fontSize: number;

  @Column({ type: 'varchar', length: 100, default: 'Arial' })
  textFont: string;

  @Column({ type: 'varchar', length: 50, default: '#000000' })
  color: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  fontWeight: string; // bold, normal, etc.

  @Column({ type: 'varchar', length: 20, default: 'left' })
  textAlign: string; // left, center, right
}