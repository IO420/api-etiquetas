import { Injectable, NotFoundException } from '@nestjs/common';
import {
  createCanvas,
  loadImage,
  GlobalFonts,
  SKRSContext2D,
} from '@napi-rs/canvas';
import * as path from 'path';
import * as fs from 'fs';
import { GenerateTagDto, ImageDto, TextDto } from './dto/image.dto';

@Injectable()
export class ImageService {
  private registeredFonts = new Set<string>();

  getFont(textFont: string): void {
    if (!textFont) return;

    //if the font ist already in the set, dont save
    if (this.registeredFonts.has(textFont)) {
      return;
    }

    const fontPath = path.resolve(
      __dirname,
      '../../assets/label/fonts',
      textFont,
    );

    //save the font
    if (fs.existsSync(fontPath)) {
      GlobalFonts.registerFromPath(fontPath, textFont);
      this.registeredFonts.add(textFont);
    }
  }

  getImage(image: string): string {
    if (!image) throw new NotFoundException(`null detected.`);

    const imagePath = path.resolve(
      __dirname,
      '../../assets/label/images',
      image,
    );
    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException(`'${image}' not exist.`);
    }

    return imagePath;
  }

  async drawText(ctx: SKRSContext2D, label: TextDto) {
    this.getFont(label.textFont);

    const fontSize = label.fontSize || 80;
    ctx.font = `${fontSize}px "${label.textFont}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = label.textPosition.x;
    const textY = label.textPosition.y;

    // create border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(12, fontSize * 0.15); //this borde is proportional to the size
    ctx.lineJoin = 'round';
    ctx.strokeText(label.text, textX, textY);

    //color text
    ctx.fillStyle = label.textColor || 'black';
    ctx.fillText(label.text, textX, textY);
  }

  async drawImage(ctx: SKRSContext2D, label: ImageDto) {
    const imagePath = this.getImage(label.image);

    const characterImg = await loadImage(imagePath);
    const imgWidth = label.imageWidth || characterImg.width;
    const imgHeight = label.imageHeight || characterImg.height;

    ctx.drawImage(
      characterImg,
      label.imagePosition.x,
      label.imagePosition.y,
      imgWidth,
      imgHeight,
    );
  }

  async generateCustomLabel(dto: GenerateTagDto): Promise<Buffer> {
    // create canvas
    const canvasWidth = 600;
    const canvasHeight = 500;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    for (const layer of dto.layers) {
      switch (layer.type) {
        case 'image':
          await this.drawImage(ctx, layer);
          break;

        case 'text':
          this.drawText(ctx, layer);
          break;
      }
    }

    // return PNG
    return canvas.toBuffer('image/png');
  }
}
//IO
