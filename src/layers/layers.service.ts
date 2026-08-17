import { Injectable } from '@nestjs/common';

@Injectable()
export class LayersService {
  findAll() {
    return `This action returns all layers`;
  }
}
