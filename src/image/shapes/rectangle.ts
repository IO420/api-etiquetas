import { SKRSContext2D } from '@napi-rs/canvas';
import { RectangleShapeDto } from '../dto/image.dto';


export function drawRectangle(
  ctx: SKRSContext2D,
  layer: RectangleShapeDto,
) {

  const radius = layer.borderRadius ?? 0;

  ctx.save();

  ctx.translate(
    layer.position.x,
    layer.position.y
  );

  ctx.beginPath();

  ctx.roundRect(
    0,
    0,
    layer.width,
    layer.height,
    radius
  );


  if(layer.fillColor){
    ctx.fillStyle = layer.fillColor;
    ctx.fill();
  }


  if(layer.strokeWidth){

    ctx.strokeStyle =
      layer.strokeColor ?? '#fff';

    ctx.lineWidth = layer.strokeWidth;

    if(layer.dash?.length){
      ctx.setLineDash(layer.dash);
    }

    ctx.stroke();

    ctx.setLineDash([]);
  }


  ctx.restore();
}