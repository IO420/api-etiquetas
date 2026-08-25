import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fonts')
export class Font {
  @PrimaryGeneratedColumn()
  id_font: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; 

  @Column({ type: 'varchar', length: 255, unique: true })
  fileName: string; 

  @Column({ type: 'varchar', length: 50, nullable: true })
  fontFamily: string;
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}