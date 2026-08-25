import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Font } from './entities/font.entity';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FontsService {
  constructor(
    @InjectRepository(Font)
    private readonly fontRepository: Repository<Font>,

    private readonly configService: ConfigService,
  ) {}

  async create(createFontDto: CreateFontDto): Promise<Font> {
    const existing = await this.fontRepository.findOne({
      where: { fileName: createFontDto.fileName },
    });

    if (existing) {
      throw new ConflictException(
        `La fuente con archivo "${createFontDto.fileName}" ya existe.`,
      );
    }

    const font = this.fontRepository.create(createFontDto);
    return await this.fontRepository.save(font);
  }

  async findAll() {
    const baseUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3001';

    const fonts = await this.fontRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return fonts.map((font) => ({
      ...font,
      url: `${baseUrl}/uploads/fonts/${font.fileName}`,
    }));
  }

  async findOne(id: number) {
    const baseUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3001';

    const font = await this.fontRepository.findOne({ where: { id_font: id } });
    if (!font) {
      throw new NotFoundException(`Fuente con ID ${id} no encontrada.`);
    }

    return {
      ...font,
      url: `${baseUrl}/uploads/fonts/${font.fileName}`,
    };
  }

  async update(id: number, updateFontDto: UpdateFontDto): Promise<Font> {
    const font = await this.findOne(id);
    Object.assign(font, updateFontDto);
    return await this.fontRepository.save(font);
  }

  async remove(id: number): Promise<void> {
    const font = await this.findOne(id);
    await this.fontRepository.remove(font);
  }
}
