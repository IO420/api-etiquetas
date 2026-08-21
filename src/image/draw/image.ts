import { NotFoundException } from '@nestjs/common';
import { ImageDto } from '../dto/image.dto';
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

  ctx.drawImage(
    img,
    label.positionX,
    label.positionY,
    finalWidth,
    finalHeight,
  );
}
