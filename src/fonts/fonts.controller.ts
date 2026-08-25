import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { FontsService } from './fonts.service';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';

@Controller('fonts')
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Post()
  create(@Body() createFontDto: CreateFontDto) {
    return this.fontsService.create(createFontDto);
  }

  @Get()
  findAll() {
    return this.fontsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fontsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFontDto: UpdateFontDto,
  ) {
    return this.fontsService.update(id, updateFontDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fontsService.remove(id);
  }
}