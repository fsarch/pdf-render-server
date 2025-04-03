import { Module } from '@nestjs/common';
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
})
export class AppModule {}
