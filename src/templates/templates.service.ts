import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { Layers, LayerType } from '@/layers/entities/layer.entity';
import {
  CreateLayerDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto/create-template.dto';
import { TextLayer } from '@/layers/entities/text-layer.entity';
import {
  CircleLayer,
  RectangleLayer,
  ShapeLayer,
  WaveLayer,
} from '@/layers/entities/shape-layer.entity';
import { ComponentLayer } from '@/layers/entities/component-layer.entity';
import { ImageLayer } from '@/layers/entities/image-layer.entity';
import { PaginationDto } from '@/image/dto/image.dto';
import { DataSource } from 'typeorm/browser';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(Layers)
    private readonly layersRepository: Repository<Layers>,

    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getAll() {
    return this.templateRepository.find();
  }

  async findPublicTemplatesPaginated(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.id_template')
      .where('template.is_public = :isPublic', { isPublic: true })
      .orderBy('template.id_template', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const ids = items.map((item) => item.id_template);

    if (ids.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        },
      };
    }

    const templates = await this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .leftJoinAndSelect('template.layers', 'layers')
      .leftJoinAndSelect('layers.childTemplate', 'childTemplate')
      .leftJoinAndSelect('childTemplate.layers', 'childLayers')
      .where('template.id_template IN (:...ids)', { ids })
      .orderBy('template.id_template', 'DESC')
      .addOrderBy('layers.order_index', 'ASC')
      .getMany();

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
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mapeador helper de Entidad TypeORM -> DTO de Canvas
  private mapEntityToCanvasLayer(layer: any) {
    const basePosition = {
      positionX: layer.positionX,
      positionY: layer.positionY,
    };

    switch (layer.type) {
      case LayerType.IMAGE: {
        const imgLayer = layer as ImageLayer;
        return {
          type: 'image',
          imageUrl: imgLayer.imageUrl,
          width: imgLayer.width,
          height: imgLayer.height,
          flipX: imgLayer.flipX,
          flipY: imgLayer.flipY,
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
          width: textLayer.width,
          height: textLayer.height,
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

    const template = this.templateRepository.create({
      title,
      is_public: is_public ?? false,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      creator: userId ? ({ id_user: userId } as any) : null,
    });

    const layerEntities: Layers[] = layers.map((layerDto, index) => {
      return this.mapDtoToLayerEntity(layerDto, index);
    });

    template.layers = layerEntities;

    return await this.templateRepository.save(template);
  }

  private mapDtoToLayerEntity(dto: CreateLayerDto, orderIndex: number): Layers {
    const type = dto.type;

    const baseProperties = {
      type,
      order_index: orderIndex,
      positionX: dto.positionX,
      positionY: dto.positionY,
      width: dto.width,
      height: dto.height,
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
          textAlign: dto.textAlign,
        });

      case LayerType.RECTANGLE:
        return this.layersRepository.manager.create(RectangleLayer, {
          ...baseProperties,
          fillColor: dto.fillColor,
          strokeColor: dto.strokeColor,
        });

      case LayerType.WAVE:
        return this.layersRepository.manager.create(WaveLayer, {
          ...baseProperties,
          fillColor: dto.fillColor,
          strokeColor: dto.strokeColor,
          strokeWidth: dto.strokeWidth,
        });

      case LayerType.CIRCLE:
        return this.layersRepository.manager.create(CircleLayer, {
          ...baseProperties,
          fillColor: dto.fillColor,
          strokeColor: dto.strokeColor,
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
        const offsetX = layer.positionX || 0;
        const offsetY = layer.positionY || 0;

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

  async deleteTemplateAndLayers(id: number): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const template = await queryRunner.manager.findOne(Template, {
        where: { id_template: id },
      });

      if (!template) {
        throw new NotFoundException(`Template ${id} not found`);
      }

      await queryRunner.manager.delete(Layers, {
        template: { id_template: id },
      });

      await queryRunner.manager.delete(Template, id);

      await queryRunner.commitTransaction();

      return { message: `Template ${id} delete successfully` };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error to delete the template');
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateTemplateDto: UpdateTemplateDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const template = await queryRunner.manager.findOne(Template, {
        where: { id_template: id },
      });

      if (!template) {
        throw new NotFoundException(`Template con ID ${id} no encontrado`);
      }

      const { title, is_public, canvas, layers } = updateTemplateDto;

      if (title !== undefined) template.title = title;
      if (is_public !== undefined) template.is_public = is_public;
      if (canvas) {
        if (canvas.width !== undefined) template.canvasWidth = canvas.width;
        if (canvas.height !== undefined) template.canvasHeight = canvas.height;
      }

      await queryRunner.manager.save(Template, template);

      if (layers && layers.length > 0) {
        // delete the layers
        await queryRunner.manager.delete(Layers, {
          template: { id_template: id },
        });

        // create new layers
        const newLayerEntities: Layers[] = layers.map((layerDto, index) => {
          const layerEntity = this.mapDtoToLayerEntity(layerDto, index);
          layerEntity.template = template; // Asignar la plantilla padre
          return layerEntity;
        });

        // save the layers
        await queryRunner.manager.save(Layers, newLayerEntities);
      }

      await queryRunner.commitTransaction();

      // return the new template
      return this.getTemplateWithResolvedComponents(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al actualizar la plantilla: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
//IO
