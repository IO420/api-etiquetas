import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { Layers, LayerType } from '@/layers/entities/layer.entity';
import { CreateLayerDto, CreateTemplateDto } from './dto/create-template.dto';
import { TextLayer } from '@/layers/entities/text-layer.entity';
import { ShapeLayer } from '@/layers/entities/shape-layer.entity';
import { ComponentLayer } from '@/layers/entities/component-layer.entity';
import { ImageLayer } from '@/layers/entities/image-layer.entity';
import { PaginationDto } from '@/image/dto/image.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(Layers)
    private readonly layersRepository: Repository<Layers>,
  ) {}

  async findPublicTemplatesPaginated(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { is_public: true },
      relations: {
        creator: true,
        layers: {
          childTemplate: {
            layers: true,
          },
        },
      },
      order: {
        id_template: 'DESC', 
        layers: {
          order_index: 'ASC',
        },
      },
      take: limit,
      skip: skip,
    });

    const formattedTemplates = templates.map((template) => {
      const flatLayers: Layers[] = [];

      for (const layer of template.layers) {
        if (layer.type === LayerType.TEMPLATE && layer.childTemplate) {
          const offsetX = layer.positionX || 0;
          const offsetY = layer.positionY || 0;

          for (const childLayer of layer.childTemplate.layers) {
            flatLayers.push(
              this.mapEntityToCanvasLayer({
                ...childLayer,
                positionX: childLayer.positionX + offsetX,
                positionY: childLayer.positionY + offsetY,
              }),
            );
          }
        } else {
          flatLayers.push(this.mapEntityToCanvasLayer(layer));
        }
      }

      return {
        id_template: template.id_template,
        title: template.title,
        canvasWidth: template.canvasWidth,
        canvasHeight: template.canvasHeight,
        createdAt: template.createdAt,
        layers: flatLayers,
      };
    });

    return {
      data: formattedTemplates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mapeador helper de Entidad TypeORM -> DTO de Canvas
  private mapEntityToCanvasLayer(layer: any) {
    const basePosition = {
      position: { x: layer.positionX, y: layer.positionY },
    };

    switch (layer.type) {
      case LayerType.IMAGE: {
        const imgLayer = layer as ImageLayer;
        return {
          type: 'image',
          image: imgLayer.imageUrl,
          width: imgLayer.width,
          height: imgLayer.height,
          ...basePosition,
        };
      }

      case LayerType.TEXT: {
        const textLayer = layer as TextLayer;
        return {
          type: 'text',
          text: textLayer.text,
          textFont: textLayer.textFont,
          textAlign: textLayer.textAlign as any,
          color: textLayer.color,
          fontSize: textLayer.fontSize,
          fontWeight: textLayer.fontWeight as any,
          rotation: textLayer.rotation,
          ...basePosition,
        };
      }

      case LayerType.RECTANGLE: {
        const shapeLayer = layer as ShapeLayer;
        return {
          type: 'rectangle',
          width: shapeLayer.width,
          height: shapeLayer.height,
          fillColor: shapeLayer.fillColor,
          strokeColor: shapeLayer.strokeColor,
          strokeWidth: shapeLayer.strokeWidth,
          borderRadius: shapeLayer.borderRadius,
          dash: shapeLayer.dashPattern
            ? shapeLayer.dashPattern.split(',').map(Number)
            : undefined,
          ...basePosition,
        };
      }

      case LayerType.WAVE: {
        const shapeLayer = layer as ShapeLayer;
        return {
          type: 'wave',
          width: shapeLayer.width,
          height: shapeLayer.height,
          fillColor: shapeLayer.fillColor,
          strokeColor: shapeLayer.strokeColor,
          strokeWidth: shapeLayer.strokeWidth,
          ...basePosition,
        };
      }

      case LayerType.CIRCLE: {
        const shapeLayer = layer as ShapeLayer;
        return {
          type: 'circle',
          radius: (shapeLayer.width || 0) / 2,
          fillColor: shapeLayer.fillColor,
          strokeColor: shapeLayer.strokeColor,
          strokeWidth: shapeLayer.strokeWidth,
          ...basePosition,
        };
      }

      default:
        return layer;
    }
  }

  async create(createTemplateDto: CreateTemplateDto, userId?: number) {
    const { title, is_public, canvas, layers } = createTemplateDto;

    // 1. Instanciar la plantilla principal
    const template = this.templateRepository.create({
      title,
      is_public: is_public ?? false,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      creator: userId ? ({ id_user: userId } as any) : null,
    });

    // 2. Mapear cada capa del DTO a su respectiva entidad
    const layerEntities: Layers[] = layers.map((layerDto, index) => {
      return this.mapDtoToLayerEntity(layerDto, index);
    });

    template.layers = layerEntities;

    // 3. Guardar en base de datos (con relación en cascada)
    return await this.templateRepository.save(template);
  }

  private mapDtoToLayerEntity(dto: CreateLayerDto, orderIndex: number): Layers {
    // Si no se especifica el tipo, inferir 'IMAGE' si trae la propiedad name/imageUrl
    const type = dto.type;

    const baseProperties = {
      type,
      order_index: orderIndex,
      positionX: dto.position.x,
      positionY: dto.position.y,
      width: dto.size.width,
      height: dto.size.height,
      rotation: dto.rotation || 0,
    };

    switch (type) {
      case LayerType.TEXT:
        return this.layersRepository.manager.create(TextLayer, {
          ...baseProperties,
          text: dto.text,
          label: dto.label,
          fontSize: dto.fontSize,
          textFont: dto.textFont,
          color: dto.color,
          textAlign:dto.textAlign
        });

      case LayerType.RECTANGLE:
      case LayerType.WAVE:
      case LayerType.CIRCLE:
        return this.layersRepository.manager.create(ShapeLayer, {
          ...baseProperties,
          fillColor: dto.fillColor,
          strokeColor:dto.strokeColor
        });

      case LayerType.TEMPLATE:
        return this.layersRepository.manager.create(ComponentLayer, {
          ...baseProperties,
          childTemplate: dto.childTemplateId
            ? ({ id_template: dto.childTemplateId } as Template)
            : undefined,
        });

      case LayerType.IMAGE:
      default:
        return this.layersRepository.manager.create(ImageLayer, {
          ...baseProperties,
          imageUrl: dto.name,
        });
    }
  }

  async getTemplateWithResolvedComponents(id_template: number) {
    const template = await this.templateRepository.findOne({
      where: { id_template },
      relations: {
        creator: true,
        layers: {
          childTemplate: {
            layers: true,
          },
        },
      },
      order: {
        layers: { order_index: 'ASC' },
      },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const flatLayers: Layers[] = [];

    for (const layer of template.layers) {
      if (layer.type === LayerType.TEMPLATE && layer.childTemplate) {
        // Desplazamiento (offset) de la sub-plantilla contenedora
        const offsetX = layer.positionX || 0;
        const offsetY = layer.positionY || 0;

        // Resolvemos las capas hijas ajustando sus coordenadas X e Y
        for (const childLayer of layer.childTemplate.layers) {
          flatLayers.push({
            ...childLayer,
            positionX: childLayer.positionX + offsetX,
            positionY: childLayer.positionY + offsetY,
          });
        }
      } else {
        flatLayers.push(layer);
      }
    }

    return {
      id_template: template.id_template,
      title: template.title,
      is_public: template.is_public,
      creator: template.creator
        ? { id: template.creator.id_user, name: template.creator.name }
        : null,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      layers: flatLayers,
    };
  }
}
