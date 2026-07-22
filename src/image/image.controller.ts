import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get('NameFrontPage')
  async testImage(@Res() res: Response) {
    try {
      // Llamamos al servicio para obtener los bytes de la imagen dibujada
      const imageBuffer = await this.imageService.drawShark();

      // Le decimos al navegador que lo que viene es una imagen PNG
      res.setHeader('Content-Type', 'image/png');

      // Enviamos el buffer directamente como respuesta
      return res.send(imageBuffer);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al cargar la imagen. Revisa que la ruta sea correcta.',
        error: error.message,
      });
    }
  }
}
