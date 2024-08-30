import {
  Controller,
  Post,
  UseGuards,
  Body, Res,
} from '@nestjs/common';
import { AuthGuard } from "../../fsarch/auth/guards/auth.guard.js";
import { Roles } from "../../fsarch/uac/decorators/roles.decorator.js";
import { Role } from "../../fsarch/auth/role.enum.js";
import { RenderPdfDto } from "../../models/render/RenderPdfDto.js";
import { RenderService } from "./render.service.js";
import { Readable } from 'node:stream';
import { Response } from 'express';

@Controller('pdf')
export class RenderController {
  constructor(private readonly renderService: RenderService) {
  }

  @Post('/_actions/render')
  @UseGuards(AuthGuard)
  @Roles(Role.render_pdf)
  async renderPdf(
    @Body() body: RenderPdfDto,
    @Res() res: Response,
  ) {
    const contentBuffer = Buffer.from(await this.renderService.RenderHtmlToPdf(body.content.html, body.options));


    const stream = new Readable();

    stream.push(contentBuffer);
    stream.push(null);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': contentBuffer.length,
    });

    stream.pipe(res);
  }
}
