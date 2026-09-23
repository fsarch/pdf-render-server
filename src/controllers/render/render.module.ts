import { Module } from '@nestjs/common';
import { RenderController } from './render.controller.js';
import { RenderMcpToolProvider } from './render.mcp-tool.js';
import { RenderService } from './render.service.js';

@Module({
  imports: [],
  controllers: [RenderController, RenderMcpToolProvider],
  providers: [RenderService],
})
export class RenderModule {}
