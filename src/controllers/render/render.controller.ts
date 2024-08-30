import {
  Controller,
  Post,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthGuard } from "../../fsarch/auth/guards/auth.guard.js";
import { Roles } from "../../fsarch/uac/decorators/roles.decorator.js";
import { Role } from "../../fsarch/auth/role.enum.js";
import { RenderPdfDto } from "../../models/render/RenderPdfDto.js";

@Controller('pdf')
export class RenderController {
  constructor() {
  }

  @Post('/_actions/render')
  @UseGuards(AuthGuard)
  @Roles(Role.render_pdf)
  async renderPdf(@Body() body: RenderPdfDto) {
    return Buffer.from('test');
  }
}
