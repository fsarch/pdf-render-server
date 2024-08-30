import { Module } from '@nestjs/common';
import { RenderModule } from "./render/render.module.js";

@Module({
  imports: [RenderModule]
})
export class ControllersModule {}
