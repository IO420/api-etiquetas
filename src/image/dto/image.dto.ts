import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PositionDto {
  @IsNumber({}, { message: 'El valor de X debe ser un número' })
  @IsNotEmpty()
  x: number;

  @IsNumber({}, { message: 'El valor de Y debe ser un número' })
  @IsNotEmpty()
  y: number;
}

export class GenerateTagDto {
  @IsString()
  image: string;

  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  imagePosition: PositionDto;

  @IsOptional()
  @IsNumber()
  imageWidth?: number;

  @IsOptional()
  @IsNumber()
  imageHeight?: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  textFont: string;

  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  textPosition: PositionDto;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsNumber()
  fontSize?: number;
}
