import { SKRSContext2D } from '@napi-rs/canvas';
import { CircleShapeDto } from '../dto/image.dto';

export function buildCirclePath(ctx: SKRSContext2D, radius: number) {
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
}

export function drawCircle(ctx: SKRSContext2D, layer: CircleShapeDto) {
  ctx.save();

  ctx.translate(layer.position.x, layer.position.y);

  ctx.beginPath();

  buildCirclePath(ctx, layer.radius);

  if (layer.fillColor) {
    ctx.fillStyle = layer.fillColor;
    ctx.fill();
  }

  if (layer.strokeWidth) {
    ctx.strokeStyle = layer.strokeColor ?? '#fff';
    ctx.lineWidth = layer.strokeWidth;
    ctx.lineJoin = 'round';

    ctx.setLineDash(layer.dash?.length ? layer.dash : [50, 10]);

    ctx.stroke();
  }

  ctx.restore();
}
