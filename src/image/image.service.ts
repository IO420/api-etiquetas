import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import * as path from 'path';
import * as fs from 'fs';
import { GenerateTagDto } from './dto/image.dto';

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

  async generateCustomLabel(dto: GenerateTagDto): Promise<Buffer> {
    // create canvas
    const canvasWidth = 600;
    const canvasHeight = 500;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // get font and image
    this.getFont(dto.textFont);
    const imagePath = this.getImage(dto.image);

    //draw the image
    const characterImg = await loadImage(imagePath);
    const imgWidth = dto.imageWidth || characterImg.width;
    const imgHeight = dto.imageHeight || characterImg.height;

    ctx.drawImage(
      characterImg,
      dto.imagePosition.x,
      dto.imagePosition.y,
      imgWidth,
      imgHeight,
    );

    // draw the text
    const fontSize = dto.fontSize || 80;
    ctx.font = `${fontSize}px "${dto.textFont}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = dto.textPosition.x;
    const textY = dto.textPosition.y;

    // create border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(12, fontSize * 0.15); //this borde is proportional to the size
    ctx.lineJoin = 'round';
    ctx.strokeText(dto.text.toUpperCase(), textX, textY);

    //color text
    ctx.fillStyle = dto.textColor || 'black';
    ctx.fillText(dto.text.toUpperCase(), textX, textY);

    // return PNG
    return canvas.toBuffer('image/png');
  }
}
//IO
