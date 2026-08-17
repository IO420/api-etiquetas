import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ImageService } from '@/image/image.service';
import { PaginationDto } from '@/image/dto/image.dto';

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly imageService: ImageService,
  ) {}

  @Get('public/previews')
  @HttpCode(HttpStatus.OK)
  async getPublicTemplatesWithPreviews(@Query() paginationDto: PaginationDto) {
    // 1. Traer datos de la BD paginados del más nuevo al más viejo
    const result = await this.templatesService.findPublicTemplatesPaginated(paginationDto);

    // 2. Generar las imágenes de preview para cada plantilla obtenida
    const templatesWithPreviews = await Promise.all(
      result.data.map(async (template) => {
        const preview = await this.imageService.generateLabelPreview({
          templateId: template.id_template,
          canvasWidth: template.canvasWidth,
          canvasHeight: template.canvasHeight,
          layers: template.layers,
        });

        return {
          id_template: template.id_template,
          title: template.title,
          createdAt: template.createdAt,
          previewUrl: preview.url, // URL estática generada
        };
      }),
    );

    return {
      data: templatesWithPreviews,
      meta: result.meta,
    };
  }

  @Post()
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    return await this.templatesService.create(createTemplateDto);
  }

  @Get(':id/resolved')
  async getResolved(@Param('id') id: number) {
    return await this.templatesService.getTemplateWithResolvedComponents(id);
  }
}
