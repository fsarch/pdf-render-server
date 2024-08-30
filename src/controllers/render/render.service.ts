import { Injectable } from '@nestjs/common';
import puppeteer, { Page, PDFOptions } from "puppeteer";
import { PaperFormat, RenderPdfOptionsDto } from "../../models/render/RenderPdfDto.js";

const BROWSER = puppeteer.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

let PAGE: Page | undefined;

async function usePage<T>(cb: (page: Page) => Promise<T>): Promise<T> {
  const browser = await BROWSER;

  if (!PAGE) {
    PAGE = await browser.newPage();
    await PAGE.setJavaScriptEnabled(false);
    PAGE.on('request', interceptedRequest => {
      interceptedRequest.abort();
      // interceptedRequest.continue();
    });
    await PAGE.setRequestInterception(true);
  }
  // const page = await browser.newPage();
  const page = PAGE;

  try {
    return await cb(page);
  } finally {
  }
}

@Injectable()
export class RenderService {

  public async RenderHtmlToPdf(html: string, options: RenderPdfOptionsDto): Promise<Uint8Array> {
    return usePage(async (page) => {
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
        pdfOptions.width = options.export.width;
        pdfOptions.height = options.export.height;
      } else {
        pdfOptions.format = options.export.format;
      }

      return await page.pdf(pdfOptions);
    });
  }
}
