import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImageDto {
  @IsIn(['image'])
  type: 'image';

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  positionX: number;

  @IsOptional()
  @IsNumber()
  positionY: number;

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
  @IsOptional()
  text: string;

  @IsString()
  @IsOptional()
  textFont?: string;

  @IsOptional()
  @IsIn(['left', 'center', 'right'])
  textAlign?: 'left' | 'center' | 'right';

  @IsOptional()
  @IsNumber()
  positionX: number;

  @IsOptional()
  @IsNumber()
  positionY: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @IsOptional()
  @IsNumber()
  strokeWidth?: number;

  @IsOptional()
  @IsString()
  strokeColor?: string;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsIn(['normal', 'bold'])
  fontWeight?: 'normal' | 'bold';
}

export class ShapeBaseDto {
  @IsOptional()
  @IsNumber()
  positionX: number;

  @IsOptional()
  @IsNumber()
  positionY: number;

  @IsOptional()
  @IsString()
  fillColor?: string;

  @IsOptional()
  @IsString()
  strokeColor?: string;

  @IsOptional()
  @IsString()
  strokeWidth?: string;

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

export class RectangleShapeDto extends ShapeBaseDto {
  @IsIn(['rectangle'])
  type: 'rectangle';

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsOptional()
  @IsNumber()
  borderRadius?: number;
}

export type LayerDto =
  ImageDto | TextDto | WaveShapeDto | CircleShapeDto | RectangleShapeDto;

export class GenerateTagDto {
  @IsNotEmpty()
  @IsNumber()
  canvasWidth: number;

  @IsNotEmpty()
  @IsNumber()
  canvasHeight: number;

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
        { value: RectangleShapeDto, name: 'rectangle' },
      ],
    },
  })
  layers!: LayerDto[];
}

export class GeneratePreviewDto extends GenerateTagDto {
  @IsNotEmpty()
  @IsNumber()
  templateId: number;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
