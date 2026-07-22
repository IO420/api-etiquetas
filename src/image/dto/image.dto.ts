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
  type!: 'image';

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
  @IsIn(['text'])
  type!: 'text';

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

export type LayerDto = ImageDto | TextDto;

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
      ],
    },
  })
  layers!: LayerDto[];
}
