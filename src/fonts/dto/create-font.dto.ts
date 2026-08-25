import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateFontDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsOptional()
  fontFamily?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}