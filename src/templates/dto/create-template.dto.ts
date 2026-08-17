import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LayerType } from '@/layers/entities/layer.entity';

export class CanvasDto {
  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class PositionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class SizeDto {
  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class CreateLayerDto {
  @IsEnum(LayerType)
  @IsOptional()
  type?: LayerType; // Si no viene, se infiere según las propiedades (por defecto IMAGE si trae 'name')

  @IsString()
  @IsOptional()
  name?: string; // Nombre del archivo de imagen o identificador

  @ValidateNested()
  @Type(() => PositionDto)
  position: PositionDto;

  @ValidateNested()
  @Type(() => SizeDto)
  size: SizeDto;

  @IsNumber()
  @IsOptional()
  rotation?: number;

  // Propiedades opcionales para capas de Texto
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  fontSize?: number;

  @IsString()
  @IsOptional()
  textFont?: string;

  @IsString()
  @IsOptional()
  color?: string;

  // Propiedades opcionales para Formas / Figuras
  @IsString()
  @IsOptional()
  fillColor?: string;

  // Sub-plantilla anidada (si es tipo TEMPLATE)
  @IsNumber()
  @IsOptional()
  childTemplateId?: number;
}

export class CreateTemplateDto {
  @IsString()
  title: string;

  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @ValidateNested()
  @Type(() => CanvasDto)
  canvas: CanvasDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLayerDto)
  layers: CreateLayerDto[];
}