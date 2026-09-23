import { randomUUID } from 'node:crypto';
import { AuthGuard } from '@fsarch/server/auth';
import { McpController, Tool } from '@fsarch/server/mcp';
import { Roles, RolesGuard } from '@fsarch/server/uac';
import { UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { Role } from '../../constants/role.enum.js';
import {
  PaperFormat,
  RenderPdfOptionsDto,
} from '../../models/render/RenderPdfDto.js';
import { RenderService } from './render.service.js';

const RenderPdfParamsSchema = z
  .object({
    html: z
      .string()
      .min(1)
      .describe(
        'The HTML document to render. JavaScript execution and all network requests are ' +
          'disabled while rendering, so the HTML must be fully self-contained (inline CSS, ' +
          'inline/data-URI images and fonts).',
      ),
    viewport: z
      .object({
        width: z.number().positive().describe('Viewport width in pixels'),
        height: z.number().positive().describe('Viewport height in pixels'),
      })
      .default({ width: 1240, height: 1754 })
      .describe(
        'Viewport size used while laying out the HTML before printing to PDF',
      ),
    format: z
      .nativeEnum(PaperFormat)
      .default(PaperFormat.A4)
      .describe(
        `Paper format, or "${PaperFormat.CUSTOM}" to use the width/height fields`,
      ),
    width: z
      .number()
      .positive()
      .optional()
      .describe(
        `Custom page width, only used when format is "${PaperFormat.CUSTOM}"`,
      ),
    height: z
      .number()
      .positive()
      .optional()
      .describe(
        `Custom page height, only used when format is "${PaperFormat.CUSTOM}"`,
      ),
  })
  .refine(
    (data) =>
      data.format !== PaperFormat.CUSTOM ||
      (data.width != null && data.height != null),
    {
      message: `width and height are required when format is "${PaperFormat.CUSTOM}"`,
      path: ['width'],
    },
  );

// @Roles(...) on an MCP tool only takes effect with an explicit @UseGuards(AuthGuard, RolesGuard)
// here: both are already registered globally, but Nest's global guards aren't applied to the
// RPC-typed execution context MCP tool calls run in, so without this they'd be a silent no-op
// (see @fsarch/server/mcp's README, "Auth & UAC roles on tools").
@McpController()
@UseGuards(AuthGuard, RolesGuard)
export class RenderMcpToolProvider {
  constructor(private readonly renderService: RenderService) {}

  @Tool({
    name: 'render_pdf',
    description: 'Render a self-contained HTML document to a PDF file.',
    parameters: RenderPdfParamsSchema,
  })
  @Roles(Role.render_pdf)
  async renderPdf({
    html,
    viewport,
    format,
    width,
    height,
  }: z.infer<typeof RenderPdfParamsSchema>) {
    const options: RenderPdfOptionsDto = {
      viewport,
      export:
        format === PaperFormat.CUSTOM ? { format, width, height } : { format },
    };

    const pdfBytes = await this.renderService.RenderHtmlToPdf(html, options);

    return {
      content: [
        {
          type: 'resource' as const,
          resource: {
            uri: `pdf-render:///${randomUUID()}.pdf`,
            mimeType: 'application/pdf',
            blob: Buffer.from(pdfBytes).toString('base64'),
          },
        },
      ],
    };
  }
}
