export interface IAuthService {
  signIn(username: string, password: string): Promise<{ accessToken: string; }>;
  validateRequest(request): Promise<boolean>;
}
