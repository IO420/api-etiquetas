import { Injectable } from '@nestjs/common';
import path from 'path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

@Injectable()
export class ImageService {

  async drawShark(): Promise<Buffer> {
    // 1. Definir la ruta física de la imagen en tu servidor
    const imagePath = path.resolve(__dirname, '../../assets/NameFrontPage/tiburon.png');

    // 2. Cargar la imagen usando la función de la librería canvas
    const sharkImage = await loadImage(imagePath);

    // 3. Crear un lienzo digital (Canvas) del tamaño de la imagen
    const canvas = createCanvas(sharkImage.width, sharkImage.height);
    const ctx = canvas.getContext('2d');

    // 4. Dibujar la imagen del tiburón en las coordenadas (0,0) del lienzo
    ctx.drawImage(sharkImage, 0, 0);

    // 5. Convertir todo el lienzo a un Buffer de bytes (formato PNG)
    return canvas.toBuffer('image/png');
  }

}
