import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  id_image: number;

  @Column()
  name: string;
}
