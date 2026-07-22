import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
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

export class ImageDto {
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
}

export class TextDto {
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

export class GenerateTagDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextDto)
  texts?: TextDto[];
}
