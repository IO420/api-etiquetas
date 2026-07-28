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
import { drawWave } from './shapes/wave';
import { drawCircle } from './shapes/circle';
import { drawRectangle } from './shapes/rectangle';

import PDFDocument from 'pdfkit';

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
    const fontFamily = label.textFont || 'Open Sans';

    this.getFont(fontFamily);

    const fontSize = label.fontSize || 80;

    ctx.save();
    ctx.translate(label.position.x, label.position.y);

    // degrees to radians
    const rotation = ((label.rotation ?? 0) * Math.PI) / 180;
    ctx.rotate(rotation);

    const fontWeight = label.fontWeight ?? 'normal';

    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // create border
    if (label.strokeWidth) {
      ctx.strokeStyle = label.strokeColor || '#FFFFFF';
      ctx.lineWidth = Math.max(12, fontSize * 0.15);
      ctx.lineJoin = 'round';

      ctx.strokeText(label.text, 0, 0);
    }

    //color text
    ctx.fillStyle = label.color || 'black';
    ctx.fillText(label.text, 0, 0);

    ctx.restore();
  }

  async drawImage(ctx: SKRSContext2D, label: ImageDto) {
    const imagePath = this.getImage(label.image);

    const img = await loadImage(imagePath);

    const originalWidth = img.width;
    const originalHeight = img.height;

    let width = label.width;
    let height = label.height;

    // calculate height
    if (width && !height) {
      height = (width * originalHeight) / originalWidth;
    }

    // calculate width
    if (height && !width) {
      width = (height * originalWidth) / originalHeight;
    }

    // use original size
    if (!width && !height) {
      width = originalWidth;
      height = originalHeight;
    }

    // max height or width
    if (width && height) {
      const aspectRatio = originalWidth / originalHeight;

      const targetRatio = width / height;

      if (targetRatio > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
    }

    const finalWidth = width ?? originalWidth;
    const finalHeight = height ?? originalHeight;

    ctx.drawImage(
      img,
      label.position.x,
      label.position.y,
      finalWidth,
      finalHeight,
    );
  }

  async generateCustomLabel(dto: GenerateTagDto): Promise<Buffer> {
    // create canvas
    const canvasWidth = dto.canvasWidth;
    const canvasHeight = dto.canvasHeight;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    for (const layer of dto.layers) {
      switch (layer.type) {
        case 'image':
          await this.drawImage(ctx, layer);
          break;

        case 'text':
          await this.drawText(ctx, layer);
          break;

        case 'wave':
          drawWave(ctx, layer);
          break;

        case 'circle':
          drawCircle(ctx, layer);
          break;

        case 'rectangle':
          drawRectangle(ctx, layer);
          break;
      }
    }

    // return PNG
    return canvas.toBuffer('image/png');
  }

  async generateCustomLabelPdf(dto: GenerateTagDto): Promise<Buffer> {
    const imageBuffer = await this.generateCustomLabel(dto);

    const widthInPoints = 20 * 28.3465; // ~566.93 puntos
    const heightInPoints = 26.5 * 28.3465; // ~751.18 puntos

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      //create the document without margin
      const doc = new PDFDocument({
        size: [widthInPoints, heightInPoints],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // insert the png
      doc.image(imageBuffer, 0, 0, {
        width: widthInPoints,
        height: heightInPoints,
      });

      doc.end();
    });
  }
}
//IO
