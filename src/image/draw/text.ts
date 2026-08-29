import * as path from 'path';
import * as fs from 'fs';
import { GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import { TextDto } from '../dto/image.dto';

export function getFont(
  textFont: string,
  assetsPath: string,
  registeredFonts: Set<string>,
): void {
  if (!textFont) return;

  //if the font ist already in the set, dont save
  if (registeredFonts.has(textFont)) {
    return;
  }

  const fontPath = path.join(assetsPath, 'fonts', textFont);

  //save the font
  if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, textFont);
    registeredFonts.add(textFont);
  }
}

export function drawText(
  ctx: SKRSContext2D,
  label: TextDto,
  assetsPath: string,
  registeredFonts: Set<string>,
) {
  if (!label.text || label.text.trim() === '') {
    return;
  }

  const fontFamily = label.textFont || 'Open Sans';
  getFont(fontFamily, assetsPath, registeredFonts);

  const fontSize = label.fontSize || 32;
  const width = label.width || 0;
  const height = label.height || 0;

  ctx.save();

  const centerX = label.positionX + width / 2;
  const centerY = label.positionY + height / 2;

  ctx.translate(centerX, centerY);

  const rotation = ((label.rotation ?? 0) * Math.PI) / 180;
  ctx.rotate(rotation);

  const fontWeight = label.fontWeight ?? 'normal';

  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;

  ctx.textAlign = label.textAlign || 'center';
  ctx.textBaseline = 'middle';

  // create border
  if (label.strokeWidth) {
    ctx.strokeStyle = label.strokeColor || '#FFFFFF';
    ctx.lineWidth = label.strokeWidth || Math.max(2, fontSize * 0.1);
    ctx.lineJoin = 'round';

    ctx.strokeText(label.text, 0, 0, width > 0 ? width : undefined);
  }

  ctx.fillStyle = label.color || '#000000';

  ctx.fillText(label.text, 0, 0, width > 0 ? width : undefined);

  ctx.restore();
}
