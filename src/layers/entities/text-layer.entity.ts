import { ChildEntity, Column } from 'typeorm';
import { Layers, LayerType } from './layer.entity';

@ChildEntity(LayerType.TEXT)
export class TextLayer extends Layers {
  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string;

  @Column({ type: 'int', nullable: true })
  fontSize: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  textFont: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fontWeight: string; // bold, normal, etc.

  @Column({ type: 'varchar', length: 20, nullable: true })
  textAlign: string;
}
