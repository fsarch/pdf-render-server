import { Test, TestingModule } from '@nestjs/testing';
import { RenderController } from './render.controller.js';
import { AuthGuard, Public } from '@fsarch/server/auth';
import { Roles } from '@fsarch/server/uac';
import { RenderService } from './render.service.js';

describe('RenderController', () => {
  let controller: RenderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RenderController],
      providers: [RenderService],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RenderController>(RenderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
