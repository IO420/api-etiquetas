import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsIn,
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
  @IsIn(['image'])
  type: 'image';

  @IsString()
  image: string;

  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

export class TextDto {
  @IsIn(['text'])
  type: 'text';

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  textFont: string;

  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  fontSize?: number;
}

export class ShapeBaseDto {
  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @IsOptional()
  @IsString()
  fillColor?: string;

  @IsOptional()
  @IsString()
  strokeColor?: string;

  @IsOptional()
  @IsNumber()
  strokeWidth?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  dash?: number[];
}

export class WaveShapeDto extends ShapeBaseDto {
  @IsIn(['wave'])
  type: 'wave';

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

export class CircleShapeDto extends ShapeBaseDto {
  @IsIn(['circle'])
  type: 'circle';

  @IsNumber()
  radius: number;
}

export type LayerDto = ImageDto | TextDto | WaveShapeDto | CircleShapeDto;

export class GenerateTagDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: ImageDto, name: 'image' },
        { value: TextDto, name: 'text' },
        { value: WaveShapeDto, name: 'wave' },
        { value: CircleShapeDto, name: 'circle' },
      ],
    },
  })
  layers!: LayerDto[];
}
