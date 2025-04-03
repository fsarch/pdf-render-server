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


  // region Swagger
  let swaggerConfigBuilder = new DocumentBuilder()
    .setTitle('PDF-Render-Server')
    .setDescription('The PDF-Render-Server API could be used to generate PDFs from simple HTML')
    .addBearerAuth()
    .setVersion('1.0');

  if (process.env.OPENID_CONNECT_DISCOVERY_URL) {
    swaggerConfigBuilder = swaggerConfigBuilder.addOAuth2({
      type: 'openIdConnect',
      openIdConnectUrl: process.env.OPENID_CONNECT_DISCOVERY_URL,
      in: 'header',
    });
  }

  const swaggerConfig = swaggerConfigBuilder.build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      initOAuth: {
        clientId: process.env.OPENID_CONNECT_CLIENT_ID,
      },
    },
  });
  // endregion

  app.use(express.json({limit: '50mb'}));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
