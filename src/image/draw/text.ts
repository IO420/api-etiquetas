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

  if (registeredFonts.has(textFont)) {
    return;
  }

  const fontPath = path.join(assetsPath, 'fonts', textFont);

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

  // Usamos alphabetic porque vamos a calcular manualmente
  // la posición vertical real del texto.
  ctx.textBaseline = 'alphabetic';

  const maxWidth = width > 0 ? width : undefined;

  // Obtener las métricas reales de la fuente
  const metrics = ctx.measureText(label.text);

  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;

  // Centro real del área visible de los caracteres.
  const textHeight = ascent + descent;

  // Calculamos el baseline necesario para que el texto visible
  // quede centrado exactamente en Y = 0.
  const textY = (ascent - descent) / 2;

  const strokeWidth = Number(label.strokeWidth || 0);

  if (strokeWidth > 0) {
    ctx.strokeStyle = label.strokeColor || '#FFFFFF';
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.strokeText(label.text, 0, textY, maxWidth);
  }

  ctx.fillStyle = label.color || '#000000';

  ctx.fillText(label.text, 0, textY, maxWidth);

  ctx.restore();
}
