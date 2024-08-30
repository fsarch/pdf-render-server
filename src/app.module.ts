import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { FsarchModule } from './fsarch/fsarch.module.js';
import { ControllersModule } from './controllers/controllers.module.js';

@Module({
  imports: [
    FsarchModule.register({
      auth: {},
      database: null,
    }),
    ControllersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
