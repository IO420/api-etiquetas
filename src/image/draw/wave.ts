import { SKRSContext2D } from '@napi-rs/canvas';
import { WaveShapeDto } from '../dto/image.dto';

const ORIGINAL_WIDTH = 468.289;
const ORIGINAL_HEIGHT = 1052;

export function buildWavePath(ctx: SKRSContext2D) {
  // ----- Lado izquierdo -----

  ctx.moveTo(0, 0);

  ctx.bezierCurveTo(0, 75.0819, 58.2776, 75.0819, 58.2776, 0);
  ctx.bezierCurveTo(58.2776, 75.295, 0, 75.295, 0, 150.377);
  ctx.bezierCurveTo(0, 225.459, 58.2776, 225.459, 58.2776, 300.754);
  ctx.bezierCurveTo(58.2776, 375.836, 0, 375.836, 0, 451.131);
  ctx.bezierCurveTo(0, 526.213, 58.2776, 526.213, 58.2776, 601.508);
  ctx.bezierCurveTo(58.2776, 676.59, 0, 676.59, 0, 751.885);
  ctx.bezierCurveTo(0, 826.967, 58.2776, 826.967, 58.2776, 902.262);
  ctx.bezierCurveTo(0, 977.557, 0, 977.344, 0, 1052.3);

  // Parte inferior
  ctx.lineTo(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

  // ----- Lado derecho -----

  ctx.bezierCurveTo(
    ORIGINAL_WIDTH,
    977.557,
    410.011,
    977.557,
    410.011,
    902.262,
  );

  ctx.bezierCurveTo(
    410.011,
    826.967,
    ORIGINAL_WIDTH,
    826.967,
    ORIGINAL_WIDTH,
    751.885,
  );

  ctx.bezierCurveTo(ORIGINAL_WIDTH, 676.59, 410.011, 676.59, 410.011, 601.508);

  ctx.bezierCurveTo(
    410.011,
    526.213,
    ORIGINAL_WIDTH,
    526.213,
    ORIGINAL_WIDTH,
    451.131,
  );

  ctx.bezierCurveTo(
    ORIGINAL_WIDTH,
    375.836,
    410.011,
    375.836,
    410.011,
    300.754,
  );

  ctx.bezierCurveTo(
    410.011,
    225.459,
    ORIGINAL_WIDTH,
    225.459,
    ORIGINAL_WIDTH,
    150.377,
  );

  ctx.bezierCurveTo(ORIGINAL_WIDTH, 75.0819, 410.011, 75.0819, 410.011, 0);

  ctx.closePath();
}

export function drawWave(ctx: SKRSContext2D, layer: WaveShapeDto) {
  ctx.save();

  ctx.translate(layer.position.x, layer.position.y);

  ctx.scale(
    (layer.width || ORIGINAL_WIDTH) / ORIGINAL_WIDTH,
    (layer.height || ORIGINAL_HEIGHT) / ORIGINAL_HEIGHT,
  );

  ctx.beginPath();

  buildWavePath(ctx);

  // relleno
  if (layer.fillColor) {
    ctx.fillStyle = layer.fillColor;
    ctx.fill();
  }

  // borde
  if (layer.strokeWidth) {
    ctx.strokeStyle = layer.strokeColor ?? '#fff';
    ctx.lineWidth = Number(layer.strokeWidth);
    ctx.lineJoin = 'round';

    ctx.setLineDash(layer.dash?.length ? layer.dash : [50, 10]);

    ctx.stroke();

    ctx.setLineDash([]);
  }

  ctx.restore();
}
