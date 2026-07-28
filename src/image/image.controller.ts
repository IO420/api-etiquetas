import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ImageService } from './image.service';
import { GenerateTagDto } from './dto/image.dto';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('label')
  @HttpCode(HttpStatus.OK)
  async generateLabel(@Body() dto: GenerateTagDto, @Res() res: Response) {
    try {
      const imageBuffer = await this.imageService.generateCustomLabel(dto);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="etiqueta.png"');

      return res.send(imageBuffer);
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: 'Error to generate the label.',
        error: error.message,
      });
    }
  }

  @Post('label/pdf')
  @HttpCode(HttpStatus.OK)
  async generateLabelPdf(@Body() dto: GenerateTagDto, @Res() res: Response) {
    try {
      const pdfBuffer = await this.imageService.generateCustomLabelPdf(dto);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="portada-cuaderno.pdf"',
      );

      return res.send(pdfBuffer);
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: 'Error to generate the PDF layout.',
        error: error.message,
      });
    }
  }
}
