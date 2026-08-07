import { ConflictException, Injectable } from '@nestjs/common';
import { createCanvas } from '@napi-rs/canvas';
import { GeneratePreviewDto, GenerateTagDto } from './dto/image.dto';
import { drawWave } from './draw/wave';
import { drawCircle } from './draw/circle';
import { drawRectangle } from './draw/rectangle';
import * as path from 'path';
import * as fs from 'fs';

import PDFDocument from 'pdfkit';
import { drawText } from './draw/text';
import { drawImage } from './draw/image';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ImageService {
  private registeredFonts = new Set<string>();

  private readonly assetsPath: string;
  private readonly uploadsPath: string;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {
    const assetsPath = process.env.ASSETS_PATH;

    if (!assetsPath) {
      throw new Error(
        "Missing environment variable 'ASSETS_PATH'. Add the following to your .env:\n\nASSETS_PATH=C:\\Etiquetas",
      );
    }

    this.assetsPath = assetsPath;

    // file to save image
    this.uploadsPath = path.join(process.cwd(), 'uploads', 'previews');
    if (!fs.existsSync(this.uploadsPath)) {
      fs.mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  async getImage() {
    return await this.imageRepository.find();
  }

  async findOne(name: string) {
    return await this.imageRepository.findOne({ where: { name } });
  }

  async createImage(name: string) {
    const image = await this.findOne(name);
    if (image) {
      throw new ConflictException('the image already exist');
    }

    const create = this.imageRepository.create({ name });

    return await this.imageRepository.save(create);
  }

  async generateCustomLabel(dto: GenerateTagDto): Promise<Buffer> {
    // create canvas
    const canvasWidth = dto.canvasWidth;
    const canvasHeight = dto.canvasHeight;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    for (const layer of dto.layers) {
      switch (layer.type) {
        case 'image':
          await drawImage(ctx, layer, this.assetsPath);
          break;

        case 'text':
          drawText(ctx, layer, this.assetsPath, this.registeredFonts);
          break;

        case 'wave':
          drawWave(ctx, layer);
          break;

        case 'circle':
          drawCircle(ctx, layer);
          break;

        case 'rectangle':
          drawRectangle(ctx, layer);
          break;
      }
    }

    const imageBuffer = canvas.toBuffer('image/png');

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    return imageBuffer;
  }

  async generateLabelPreview(
    dto: GeneratePreviewDto,
  ): Promise<{ url: string }> {
    const buffer = await this.generateCustomLabel(dto);

    const filename = `${dto.templateId}_${dto.canvasWidth}_${dto.canvasHeight}.webp`;
    const filePath = path.join(this.uploadsPath, filename);

    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `http://localhost:3001/uploads/previews/${filename}`,
    };
  }

  async generateCustomLabelPdf(dto: GenerateTagDto): Promise<Buffer> {
    const imageBuffer = await this.generateCustomLabel(dto);

    const widthInPoints = 20 * 28.3465; // ~566.93 puntos
    const heightInPoints = 26.5 * 28.3465; // ~751.18 puntos

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      //create the document without margin
      const doc = new PDFDocument({
        size: [widthInPoints, heightInPoints],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.image(imageBuffer, 0, 0);

      doc.end();
    });
  }

  async getAllPreviewImage(page: number = 1, limit: number = 10) {
    const currentPage = Math.max(1, Number(page) || 1);
    const currentLimit = Math.max(1, Number(limit) || 10);
    const skip = (currentPage - 1) * currentLimit;

    const [images, totalItems] = await this.imageRepository.findAndCount({
      order: { id_image: 'DESC' },
      take: currentLimit,
      skip: skip,
    });

    const baseUrl = 'http://localhost:3001';

    const formattedImages = images.map((img) => ({
      id_image: img.id_image,
      name: img.name,
      url: `${baseUrl}/uploads/original/${img.name}`,
      url_optimized:`${baseUrl}/uploads/optimized/${img.name}`,
    }));

    const totalPages = Math.ceil(totalItems / currentLimit);

    return {
      data: formattedImages,
      meta: {
        totalItems,
        itemCount: formattedImages.length,
        itemsPerPage: currentLimit,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }
}
//IO
