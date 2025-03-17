import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { firebaseToken: string }) {
    try {
      return await this.authService.loginWithFirebase(body.firebaseToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
