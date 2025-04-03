import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module.js';
import { VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const config = new DocumentBuilder()
    .setTitle('Material-Tracing-Server')
    .setDescription('The Material-Tracing-Server API description')
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  app.use(express.json({limit: '50mb'}));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
