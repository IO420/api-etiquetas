import { NotFoundException } from '@nestjs/common';
import { ImageDto } from '../dto/image.dto'; // Asumiendo que esta es la ruta correcta
import { loadImage, SKRSContext2D } from '@napi-rs/canvas';
import * as path from 'path';
import * as fs from 'fs';

function getImage(image: string, assetsPath: string): string {
  if (!image) throw new NotFoundException(`null detected.`);

  const imagePath = path.join(assetsPath, '', image);

  if (!fs.existsSync(imagePath)) {
    throw new NotFoundException(`'${image}' not exist.`);
  }

  return imagePath;
}

export async function drawImage(
  ctx: SKRSContext2D,
  label: ImageDto,
  assetsPath: string,
) {
  console.log(label)
  const imagePath = getImage(label.imageUrl, assetsPath);
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

  ctx.save();

  const scaleX = label.flipX ? -1 : 1;
  const scaleY = label.flipY ? -1 : 1;

  const centerX = label.positionX + finalWidth / 2;
  const centerY = label.positionY + finalHeight / 2;

  ctx.translate(centerX, centerY);

  ctx.scale(scaleX, scaleY);

  if (label.rotation) {
    const radians = label.rotation * (Math.PI / 180);
    ctx.rotate(radians);
  }

  ctx.translate(-centerX, -centerY);

  ctx.drawImage(img, label.positionX, label.positionY, finalWidth, finalHeight);

  ctx.restore();
}
//IO