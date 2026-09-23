import { AuthGuard } from '@fsarch/server/auth';
import { RolesGuard } from '@fsarch/server/uac';
import { Test, TestingModule } from '@nestjs/testing';
import { PaperFormat } from '../../models/render/RenderPdfDto.js';
import { RenderMcpToolProvider } from './render.mcp-tool.js';
import { RenderService } from './render.service.js';

describe('RenderMcpToolProvider', () => {
  let provider: RenderMcpToolProvider;
  let renderService: { RenderHtmlToPdf: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    renderService = {
      RenderHtmlToPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RenderMcpToolProvider],
      providers: [{ provide: RenderService, useValue: renderService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    provider = module.get<RenderMcpToolProvider>(RenderMcpToolProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('renders the HTML and returns the PDF as a base64 embedded resource', async () => {
    const result = await provider.renderPdf({
      html: '<p>hello</p>',
      viewport: { width: 1240, height: 1754 },
      format: PaperFormat.A4,
    });

    expect(renderService.RenderHtmlToPdf).toHaveBeenCalledWith('<p>hello</p>', {
      viewport: { width: 1240, height: 1754 },
      export: { format: PaperFormat.A4 },
    });
    expect(result.content).toEqual([
      {
        type: 'resource',
        resource: {
          uri: expect.stringMatching(/^pdf-render:\/\/\/.+\.pdf$/),
          mimeType: 'application/pdf',
          blob: Buffer.from([1, 2, 3]).toString('base64'),
        },
      },
    ]);
  });
});
