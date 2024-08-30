import { Test, TestingModule } from '@nestjs/testing';
import { RenderController } from './render.controller.js';

describe('ClaimController', () => {
  let controller: RenderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RenderController],
    }).compile();

    controller = module.get<RenderController>(RenderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
