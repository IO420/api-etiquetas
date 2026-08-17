import { ChildEntity } from 'typeorm';
import { Layers, LayerType } from './layer.entity';

@ChildEntity(LayerType.TEMPLATE)
export class ComponentLayer extends Layers {
}