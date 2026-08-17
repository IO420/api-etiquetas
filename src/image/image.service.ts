import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import sharp from 'sharp';

@Injectable()
export class ImageService {
  private registeredFonts = new Set<string>();

  private readonly assetsPath: string;
  private readonly uploadsPath: string;

  private readonly originalPath: string;
  private readonly optimizedPath: string;

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

    this.originalPath = path.join(process.cwd(), 'uploads', 'original');
    if (!fs.existsSync(this.originalPath)) {
      fs.mkdirSync(this.originalPath, { recursive: true });
    }

    this.optimizedPath = path.join(process.cwd(), 'uploads', 'optimized');
    if (!fs.existsSync(this.optimizedPath)) {
      fs.mkdirSync(this.optimizedPath, { recursive: true });
    }
  }

  async getImage() {
    return await this.imageRepository.find();
  }

  async findOneByName(name: string) {
    return await this.imageRepository.findOne({ where: { name } });
  }

  async findOneById(id_image: number) {
    return await this.imageRepository.findOne({ where: { id_image } });
  }

  async createImageName(name: string) {
    const image = await this.findOneByName(name);
    if (image) {
      throw new ConflictException(
        `The image name "${name}" already exist. change the name.`,
      );
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
      width: img.width,
      height: img.height,
      url: `${baseUrl}/uploads/original/${img.name}`,
      url_optimized: `${baseUrl}/uploads/optimized/${img.name}`,
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

  async processAndSaveImage(file: Express.Multer.File) {
    const parsedPath = path.parse(file.originalname);
    const baseName = parsedPath.name;
    const filename = `${baseName}.webp`;

    const existingImage = await this.findOneByName(filename);

    if (existingImage) {
      throw new ConflictException(
        `The image name "${filename}" already exist. change the name.`,
      );
    }

    const originalFilePath = path.join(this.originalPath, filename);
    const optimizedFilePath = path.join(this.optimizedPath, filename);

    try {
      const metadata = await sharp(file.buffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // save the file in normal size
      await sharp(file.buffer).webp({ quality: 80 }).toFile(originalFilePath);

      // save the new file widgt
      await sharp(file.buffer)
        .resize(150) // this adjusts the width
        .webp({ quality: 75 })
        .toFile(optimizedFilePath);

      // save the information in the database
      const newImage = this.imageRepository.create({
        name: filename,
        width,
        height,
      });
      const savedImage = await this.imageRepository.save(newImage);

      const baseUrl = 'http://localhost:3001';
      return {
        id_image: savedImage.id_image,
        name: savedImage.name,
        width: savedImage.width,
        height: savedImage.height,
        url: `${baseUrl}/uploads/original/${filename}`,
        url_optimized: `${baseUrl}/uploads/optimized/${filename}`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error to save the image: ${error.message}`,
      );
    }
  }

  async deleteImage(id: number) {
    const image = await this.findOneById(id);

    if (!image) {
      throw new NotFoundException(`doesnt found the image ${id}`);
    }

    const originalFilePath = path.join(this.originalPath, image.name);
    const optimizedFilePath = path.join(this.optimizedPath, image.name);

    // delete the files
    const deleteFilePromises = [originalFilePath, optimizedFilePath].map(
      async (filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        } catch (error) {
          console.error(`Error to delete the file image  ${filePath}:`, error);
        }
      },
    );

    await Promise.all(deleteFilePromises);

    await this.imageRepository.remove(image);

    return {
      message: 'Image delete successfully',
      id_image: id,
    };
  }
}
//IO
