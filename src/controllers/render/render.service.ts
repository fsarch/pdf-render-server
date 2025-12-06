import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page, PDFOptions } from "puppeteer";
import { PaperFormat, RenderPdfOptionsDto } from "../../models/render/RenderPdfDto.js";

let BROWSER: Promise<Browser>;

const logger = new Logger('render-service');

async function usePage<T>(cb: (page: Page) => Promise<T>): Promise<T> {
  let shouldRecreateBrowser = false;

  if (!BROWSER) {
    shouldRecreateBrowser = true;
    logger.log('no existing browser, creating new one');
  } else {
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

  if (shouldRecreateBrowser) {
    BROWSER = puppeteer.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    logger.log('creating new browser instance');
  }

  const browser = await BROWSER;

  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  page.on('request', interceptedRequest => {
    interceptedRequest.abort();
    // interceptedRequest.continue();
  });
  await page.setRequestInterception(true);

  try {
    return await cb(page);
  } finally {
    await page.close();
  }
}

@Injectable()
export class RenderService {

  public async RenderHtmlToPdf(html: string, options: RenderPdfOptionsDto): Promise<Uint8Array> {
    return usePage(async (page) => {
      console.log('viewport', {
        width: options.viewport.width,
        height: options.viewport.height,
      });

      await page.setViewport({
        width: options.viewport.width,
        height: options.viewport.height,
      });

      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      });

      const pdfOptions: PDFOptions = {
        timeout: 5_000,
      };

      if (options.export.format === PaperFormat.CUSTOM) {
        pdfOptions.landscape = false;
        pdfOptions.width = options.export.width;
        pdfOptions.height = options.export.height;
        console.log('custom export', {
          width: options.export.width,
          height: options.export.height,
        });
      } else {
        pdfOptions.format = options.export.format;
      }

      return await page.pdf(pdfOptions);
    });
  }
}
