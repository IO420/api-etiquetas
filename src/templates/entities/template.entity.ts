import { Layers } from '@/layers/entities/layer.entity';
import { User } from '@/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';


@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn()
  id_template: number;

  @Column()
  title: string;

  @Column({ default: false })
  is_public: boolean;

  @Column({ type: 'int', default: 600 })
  canvasWidth: number;

  @Column({ type: 'int', default: 850 })
  canvasHeight: number;

  @ManyToOne(() => User, (user) => user.templates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Layers, (layer) => layer.template, {
    cascade: true,
  })
  layers: Layers[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}