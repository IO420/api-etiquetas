import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LayersService } from './layers.service';

@Controller('layers')
export class LayersController {
  constructor(private readonly layersService: LayersService) {}

  @Get()
  findAll() {
    return this.layersService.findAll();
  }
}
