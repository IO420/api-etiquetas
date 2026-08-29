import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LayerType } from '@/layers/entities/layer.entity';
import { PartialType } from '@nestjs/mapped-types';

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
  @IsNotEmpty()
  type: LayerType;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsNotEmpty()
  positionX?: number;

  @IsNumber()
  @IsNotEmpty()
  positionY?: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsNumber()
  @IsOptional()
  rotation?: number;

  @IsBoolean()
  @IsOptional()
  flipX?: boolean;

  @IsBoolean()
  @IsOptional()
  flipY?: boolean;

  // text props
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

  @IsString()
  @IsOptional()
  textAlign?: string;

  // shape props
  @IsString()
  @IsOptional()
  fillColor?: string;

  @IsString()
  @IsOptional()
  strokeColor: string;

  @IsString()
  @IsOptional()
  strokeWidth: string;

  // template props
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

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}
