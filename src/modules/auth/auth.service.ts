import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    public userRepository: Repository<User>,
    public jwtService: JwtService,
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {}

  async validateFirebaseToken(token: string): Promise<any> {
    try {
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async loginWithFirebase(firebaseToken: string) {
    const firebaseUser = await this.validateFirebaseToken(firebaseToken);

    let user = await this.userRepository.findOne({
      where: { email: firebaseUser.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        displayName: firebaseUser.name || 'User',
        isActive: true,
      });
      await this.userRepository.save(user);
    } else if (user.firebaseUid !== firebaseUser.uid) {
      user.firebaseUid = firebaseUser.uid;
      await this.userRepository.save(user);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      firebaseUid: user.firebaseUid,
    };

    const jwtExpiration = this.configService.get<string>(
      'JWT_EXPIRATION',
      '15m',
    );

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: jwtExpiration }),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }
}
