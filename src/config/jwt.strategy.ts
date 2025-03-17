import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/auth/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    console.log('JwtStrategy initialized');
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload);

    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      console.log(
        'User search result:',
        user
          ? {
              id: user.id,
              email: user.email,
              isActive: user.isActive,
            }
          : 'User not found',
      );

      if (!user || !user.isActive) {
        console.log('Authentication failed: User not found or inactive');
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        id: user.id,
        email: user.email,
        firebaseUid: user.firebaseUid,
      };
    } catch (error) {
      console.error('Error during JWT validation:', error);
      throw error;
    }
  }
}
