import { Test, TestingModule } from '@nestjs/testing';
import { ModuleConfigurationService } from './module-configuration.service';

describe('ModuleService', () => {
  let service: ModuleConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleConfigurationService],
    }).compile();

    service = module.get<ModuleConfigurationService>(
      ModuleConfigurationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
