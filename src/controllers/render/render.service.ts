import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page, PDFOptions } from "puppeteer";
import { Span, withSpan } from "@fsarch/server/tracing";
import { PaperFormat, RenderPdfOptionsDto } from "../../models/render/RenderPdfDto.js";

let BROWSER: Promise<Browser> | undefined;

const logger = new Logger('render-service');

async function getBrowser(forceRecreate: boolean): Promise<Browser> {
  return withSpan(
    'render.acquire-browser',
    async (span) => {
      let shouldRecreateBrowser = forceRecreate;

      if (!BROWSER) {
        shouldRecreateBrowser = true;
        logger.log('no existing browser, creating new one');
      } else if (!shouldRecreateBrowser) {
        try {
          const browser = await BROWSER;

          if (!browser.connected) {
            shouldRecreateBrowser = true;
            logger.log('existing browser not connected, force recreating');
          }
        } catch (error) {
          shouldRecreateBrowser = true;
          logger.error('error while waiting for existing browser, force recreating', {
            error,
          });
        }
      }

      span.setAttribute('render.browser_recreated', shouldRecreateBrowser);

      if (shouldRecreateBrowser) {
        logger.log('creating new browser instance');
        // A fresh Chromium launch dominates render latency on this path (typically
        // an order of magnitude slower than reusing the pooled browser) — the
        // 'render.browser_recreated' attribute makes that cold-start cost visible
        // in traces instead of it looking like an unexplained slow render.
        BROWSER = puppeteer.launch({
          executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // The container's /dev/shm is typically capped at 64MB; Chromium's
            // default shared-memory rendering blows through that and the
            // renderer process silently dies mid-request (surfaces as
            // "TargetCloseError: Session closed"). Fall back to disk instead.
            '--disable-dev-shm-usage',
          ],
        });
      }

      return BROWSER;
    },
    { attributes: { 'render.force_recreate': forceRecreate } },
  );
}

function isTargetClosedError(error: unknown): boolean {
  return error instanceof Error && /session closed|target closed/i.test(error.message);
}

async function usePage<T>(cb: (page: Page) => Promise<T>): Promise<T> {
  // A crashed renderer only shows up once we try to use the page (e.g. on
  // setViewport), so retry once against a freshly created browser rather
  // than failing the whole request on what is usually a transient crash.
  for (let attempt = 0; attempt < 2; attempt++) {
    const browser = await getBrowser(attempt > 0);

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    page.on('request', interceptedRequest => {
      interceptedRequest.abort();
      // interceptedRequest.continue();
    });
    await page.setRequestInterception(true);

    try {
      return await cb(page);
    } catch (error) {
      if (attempt === 0 && isTargetClosedError(error)) {
        logger.warn('page crashed during rendering, retrying with a fresh browser', {
          error,
        });
        continue;
      }
      throw error;
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  // Unreachable, but keeps TypeScript happy.
  throw new Error('Failed to render PDF after retry');
}

@Injectable()
export class RenderService {

  @Span({ name: 'render.html-to-pdf' })
  public async RenderHtmlToPdf(html: string, options: RenderPdfOptionsDto): Promise<Uint8Array> {
    logger.log('Starting PDF rendering');
    logger.debug('Rendering options', {
      viewport: {
        width: options.viewport.width,
        height: options.viewport.height,
      },
      export: options.export,
    });

    return usePage(async (page) => {
      logger.debug('Setting viewport', {
        width: options.viewport.width,
        height: options.viewport.height,
      });

      await page.setViewport({
        width: options.viewport.width,
        height: options.viewport.height,
      });

      logger.debug('Setting page content, waiting for DOM content loaded');
      await withSpan(
        'render.set-content',
        () => page.setContent(html, {
          waitUntil: 'domcontentloaded',
          timeout: 10_000,
        }),
        { attributes: { 'render.html_size_bytes': Buffer.byteLength(html) } },
      );

      const pdfOptions: PDFOptions = {
        timeout: 5_000,
      };

      if (options.export.format === PaperFormat.CUSTOM) {
        pdfOptions.landscape = false;
        pdfOptions.width = options.export.width;
        pdfOptions.height = options.export.height;
        logger.debug('Using custom paper format', {
          width: options.export.width,
          height: options.export.height,
        });
      } else {
        pdfOptions.format = options.export.format;
        logger.debug('Using predefined paper format', {
          format: options.export.format,
        });
      }

      logger.debug('Generating PDF from page');
      const pdfBuffer = await withSpan(
        'render.generate-pdf',
        () => page.pdf(pdfOptions),
        { attributes: { 'render.paper_format': options.export.format } },
      );
      logger.log('PDF generated successfully', {
        size: pdfBuffer.length,
      });

      return pdfBuffer;
    });
  }
}
