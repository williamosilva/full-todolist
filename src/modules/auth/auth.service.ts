import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
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
      // Criar novo usuário se não existir
      user = this.userRepository.create({
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        displayName: firebaseUser.name || 'User',
        isActive: true,
      });
      await this.userRepository.save(user);
    } else if (user.firebaseUid !== firebaseUser.uid) {
      // Atualizar UID do Firebase se o usuário já existir mas o UID mudou
      user.firebaseUid = firebaseUser.uid;
      await this.userRepository.save(user);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      firebaseUid: user.firebaseUid,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }
}
