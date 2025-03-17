import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { firebaseToken: string }) {
    try {
      return await this.authService.loginWithFirebase(body.firebaseToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  // Adicionado apenas para fins de teste
  @Post('verify-token')
  @HttpCode(200)
  async verifyToken(@Body() body: { token: string }) {
    try {
      const decoded = this.authService.jwtService.decode(body.token);
      const user = await this.authService.userRepository.findOne({
        where: { id: decoded['sub'] },
      });

      return {
        tokenDecoded: decoded,
        userFound: !!user,
        userDetails: user
          ? {
              id: user.id,
              email: user.email,
              isActive: user.isActive,
            }
          : null,
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      return {
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
