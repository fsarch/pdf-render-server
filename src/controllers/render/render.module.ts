import { Module } from '@nestjs/common';
import { RenderController } from './render.controller.js';
import { RenderService } from './render.service.js';

@Module({
  imports: [],
  controllers: [RenderController],
  providers: [RenderService]
})
export class RenderModule {}
