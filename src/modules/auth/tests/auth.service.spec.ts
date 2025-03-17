import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AuthService } from '../auth.service';
import { User } from '../entities/user.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let firebaseService: FirebaseService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    displayName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn<Promise<User | null>, [any]>(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn<Promise<User>, [User]>(),
  };

  const mockFirebaseAuth = {
    verifyIdToken: jest.fn(),
  };

  const mockFirebaseService = {
    getAuth: jest.fn(() => mockFirebaseAuth),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('15m'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserRepository', useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>('UserRepository');
    jwtService = module.get<JwtService>(JwtService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  describe('validateFirebaseToken', () => {
    it('should validate a valid Firebase token', async () => {
      const mockDecodedToken = {
        uid: 'firebase-uid',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.validateFirebaseToken('valid-token');
      expect(result).toEqual(mockDecodedToken);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockFirebaseAuth.verifyIdToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(
        service.validateFirebaseToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginWithFirebase', () => {
    const mockFirebaseUser = {
      uid: 'firebase-uid',
      email: 'test@example.com',
      name: 'Test User',
    };

    beforeEach(() => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue(mockFirebaseUser);
    });

    it('should create new user if not exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.loginWithFirebase('valid-token');

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: mockFirebaseUser.email,
        firebaseUid: mockFirebaseUser.uid,
        displayName: mockFirebaseUser.name,
        isActive: true,
      });
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should update user if firebaseUid differs', async () => {
      const existingUser = { ...mockUser, firebaseUid: 'old-uid' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.loginWithFirebase('valid-token');

      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        firebaseUid: mockFirebaseUser.uid,
      });
    });

    it('should return valid JWT with correct payload', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.loginWithFirebase('valid-token');

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          firebaseUid: mockUser.firebaseUid,
        },
        { expiresIn: '15m' },
      );
    });
  });
});
