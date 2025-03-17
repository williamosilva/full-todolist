import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { User } from '../../users/entities/user.entity';
import { FirebaseService } from '../../firebase/firebase.service';

describe('Auth', () => {
  // Testes unitários para o AuthService
  describe('AuthService', () => {
    let service: AuthService;
    let firebaseService: FirebaseService;
    let jwtService: JwtService;
    let userRepository: Repository<User>;

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firebaseUid: 'firebase-uid-123',
      displayName: 'Test User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    const mockFirebaseUser = {
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockFirebaseService = {
      getAuth: jest.fn(() => ({
        verifyIdToken: jest.fn(),
      })),
    };

    const mockJwtService = {
      sign: jest.fn(() => 'mock-jwt-token'),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: FirebaseService,
            useValue: mockFirebaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
        ],
      }).compile();

      service = module.get<AuthService>(AuthService);
      firebaseService = module.get<FirebaseService>(FirebaseService);
      jwtService = module.get<JwtService>(JwtService);
      userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('validateFirebaseToken', () => {
      it('should successfully validate a firebase token', async () => {
        const verifyIdTokenMock = jest.fn().mockResolvedValue(mockFirebaseUser);
        jest.spyOn(mockFirebaseService, 'getAuth').mockReturnValue({
          verifyIdToken: verifyIdTokenMock,
        });

        const result = await service.validateFirebaseToken('valid-token');

        expect(verifyIdTokenMock).toHaveBeenCalledWith('valid-token');
        expect(result).toEqual(mockFirebaseUser);
      });

      it('should throw UnauthorizedException for invalid token', async () => {
        const verifyIdTokenMock = jest
          .fn()
          .mockRejectedValue(new Error('Invalid token'));
        jest.spyOn(mockFirebaseService, 'getAuth').mockReturnValue({
          verifyIdToken: verifyIdTokenMock,
        });

        await expect(
          service.validateFirebaseToken('invalid-token'),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('loginWithFirebase', () => {
      beforeEach(() => {
        const verifyIdTokenMock = jest.fn().mockResolvedValue(mockFirebaseUser);
        jest.spyOn(mockFirebaseService, 'getAuth').mockReturnValue({
          verifyIdToken: verifyIdTokenMock,
        });
      });

      it('should login an existing user', async () => {
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

        const result = await service.loginWithFirebase('valid-token');

        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { email: mockFirebaseUser.email },
        });
        expect(jwtService.sign).toHaveBeenCalledWith({
          sub: mockUser.id,
          email: mockUser.email,
          firebaseUid: mockUser.firebaseUid,
        });
        expect(result).toEqual({
          access_token: 'mock-jwt-token',
          user: {
            id: mockUser.id,
            email: mockUser.email,
            displayName: mockUser.displayName,
          },
        });
      });

      it('should create a new user if not exists', async () => {
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
        jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
        jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

        const result = await service.loginWithFirebase('valid-token');

        expect(userRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: mockFirebaseUser.email,
            firebaseUid: mockFirebaseUser.uid,
            displayName: mockFirebaseUser.name || 'User',
            isActive: true,
          }),
        );
        expect(userRepository.save).toHaveBeenCalledWith(mockUser);
        expect(result.access_token).toBe('mock-jwt-token');
      });

      it('should update firebaseUid if changed', async () => {
        const userWithDifferentUid = {
          ...mockUser,
          firebaseUid: 'old-firebase-uid',
        } as User;

        jest
          .spyOn(userRepository, 'findOne')
          .mockResolvedValue(userWithDifferentUid);

        const updatedUser = {
          ...userWithDifferentUid,
          firebaseUid: mockFirebaseUser.uid,
        } as User;

        jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);

        await service.loginWithFirebase('valid-token');

        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            ...userWithDifferentUid,
            firebaseUid: mockFirebaseUser.uid,
          }),
        );
      });
    });
  });

  // Testes de integração com Supertest
  describe('AuthController (Integration)', () => {
    let app: INestApplication;
    let authService: AuthService;

    const mockAuthService = {
      loginWithFirebase: jest.fn(),
    };

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: mockAuthService,
          },
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      authService = moduleFixture.get<AuthService>(AuthService);
    });

    afterEach(async () => {
      await app.close();
      jest.clearAllMocks();
    });

    describe('POST /auth/login', () => {
      it('should return 201 and login data when successful', async () => {
        const loginResponse = {
          access_token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            displayName: 'Test User',
          },
        };

        jest
          .spyOn(authService, 'loginWithFirebase')
          .mockResolvedValue(loginResponse);

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ firebaseToken: 'valid-firebase-token' })
          .expect(201)
          .expect(loginResponse);
      });

      it('should return 401 when login fails', async () => {
        jest
          .spyOn(authService, 'loginWithFirebase')
          .mockRejectedValue(new Error('Invalid credentials'));

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ firebaseToken: 'invalid-firebase-token' })
          .expect(401)
          .expect({
            statusCode: 401,
            message: 'Invalid credentials',
            error: 'Unauthorized',
          });
      });

      it('should return 401 if firebaseToken is missing', async () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({})
          .expect(401)
          .expect((res) => {
            expect(res.body).toHaveProperty('statusCode', 401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
            expect(res.body).toHaveProperty('error', 'Unauthorized');
          });
      });
    });
  });

  // E2E testes mais completos
  describe('Auth (E2E)', () => {
    let app: INestApplication;

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firebaseUid: 'firebase-uid-123',
      displayName: 'Test User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    const mockFirebaseUser = {
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockFirebaseService = {
      getAuth: jest.fn(() => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseUser),
      })),
    };

    const mockJwtService = {
      sign: jest.fn(() => 'mock-jwt-token'),
    };

    const mockUserRepository = {
      findOne: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockReturnValue(mockUser),
      save: jest.fn().mockResolvedValue(mockUser),
    };

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          AuthService,
          {
            provide: FirebaseService,
            useValue: mockFirebaseService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should authenticate a user with valid firebase token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ firebaseToken: 'valid-firebase-token' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token', 'mock-jwt-token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id', mockUser.id);
          expect(res.body.user).toHaveProperty('email', mockUser.email);
          expect(res.body.user).toHaveProperty(
            'displayName',
            mockUser.displayName,
          );
        });
    });
  });
});
