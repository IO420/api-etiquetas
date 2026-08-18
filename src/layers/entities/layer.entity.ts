import { Template } from '@/templates/entities/template.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  TableInheritance,
} from 'typeorm';

export enum LayerType {
  IMAGE = 'image',
  TEXT = 'text',
  RECTANGLE = 'rectangle',
  WAVE = 'wave',
  CIRCLE = 'circle',
  TEMPLATE = 'template',
}

@Entity('layers')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Layers {
  @PrimaryGeneratedColumn()
  id_layer: number;

  @Column({ type: 'enum', enum: LayerType })
  type: LayerType;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ type: 'float', default: 0 })
  positionX: number;

  @Column({ type: 'float', default: 0 })
  positionY: number;

  @Column({ type: 'float', nullable: true })
  width: number;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column({ type: 'float', default: 0 })
  rotation: number;

  @ManyToOne(() => Template, (template) => template.layers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @ManyToOne(() => Template, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'childTemplateId' })
  childTemplate?: Template;
}