import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module.js';

const PORT = process.env.PORT ? (parseInt(process.env.PORT) || 3000) : 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({limit: '50mb'}));
  await app.listen(PORT);
}
bootstrap();
