import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StaticAuthService } from './static/static-auth.service.js';
import type { IAuthService } from './types/auth-service.type.js';
import { ConfigAuthType } from '../configuration/config.type.js';
import { JwtJwkAuthService } from "./jwt-jwk/jwt-jwk-auth.service.js";

@Injectable()
export class AuthService implements IAuthService {
  private readonly authService: IAuthService;

  constructor(
    private readonly configService: ConfigService,
    private readonly staticAuthService: StaticAuthService,
    private readonly jwtJwkAuthService: JwtJwkAuthService,
  ) {
    const authType = configService.get<ConfigAuthType['type']>('auth.type');

    this.authService = authType === 'static' ? staticAuthService : jwtJwkAuthService;
  }

  validateRequest(request: any): Promise<boolean> {
    return this.authService.validateRequest(request);
  }

  signIn(username: string, password: string): Promise<{ accessToken: string }> {
    return this.authService.signIn(username, password);
  }
}
