import { AppModule } from './app.module.js';
import { FsArchAppBuilder } from "@fsarch/server";
import express from 'express';

const app = await new FsArchAppBuilder(AppModule, {
  name: 'PDF-Render-Server',
  version: '1.0.0',
})
  .addSwagger({
    title: 'PDF-Render-Server',
    description: 'The PDF-Render-Server API could be used to generate PDFs from simple HTML',
    version: '1.0',
  })
  .enableAuth()
  .build();

app.use(express.json({limit: '50mb'}));

await app.listen(process.env.PORT ?? 3000);
