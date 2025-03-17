import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

describe('AuthController', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockAuthService = {
    loginWithFirebase: jest.fn<Promise<any>, [string]>(),
    jwtService: {
      decode: jest.fn<any, [string]>(),
    },
    userRepository: {
      findOne: jest.fn<Promise<User | null>, [any]>(),
    } as unknown as Repository<User>,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: { decode: jest.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    authService = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return access token for valid credentials', async () => {
      const mockResponse = {
        access_token: 'mock-jwt-token',
        user: { id: 1, email: 'test@example.com' },
      };
      mockAuthService.loginWithFirebase.mockResolvedValue(mockResponse);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ firebaseToken: 'valid-token' })
        .expect(200)
        .expect(mockResponse);
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.loginWithFirebase.mockRejectedValue(
        new UnauthorizedException(),
      );

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ firebaseToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /auth/verify-token', () => {
    it('should verify valid token', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { sub: 1, email: 'test@example.com' };
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        isActive: true,
        firebaseUid: 'uid',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.jwtService.decode as jest.Mock).mockReturnValue(mockDecoded);
      (authService.userRepository.findOne as jest.Mock).mockResolvedValue(
        mockUser,
      );

      return request(app.getHttpServer())
        .post('/auth/verify-token')
        .send({ token: mockToken })
        .expect(200)
        .expect({
          tokenDecoded: mockDecoded,
          userFound: true,
          userDetails: {
            id: mockUser.id,
            email: mockUser.email,
            isActive: mockUser.isActive,
          },
        });
    });
  });
});
