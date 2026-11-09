import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";
import { UsersService } from "../src/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ConflictException, UnauthorizedException } from "@nestjs/common";

describe("AuthService", () => {
  let authService: AuthService;
  let prisma: any;
  let redis: any;
  let usersService: any;
  let jwtService: any;
  let configService: any;

  beforeEach(() => {
    prisma = {
      refreshToken: {
        create: vi.fn().mockResolvedValue({ id: "rt-1" }),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn()
      },
      user: {
        update: vi.fn()
      }
    };

    const redisClient = {
      set: vi.fn().mockResolvedValue("OK"),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1)
    };
    redis = {
      getClient: vi.fn().mockReturnValue(redisClient)
    };

    usersService = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findById: vi.fn(),
      createUser: vi.fn(),
      updatePassword: vi.fn()
    };

    jwtService = {
      sign: vi.fn().mockReturnValue("mocked-jwt-token")
    };

    configService = {
      get: vi.fn((key: string, def: any) => def)
    };

    authService = new AuthService(prisma, redis, usersService, jwtService, configService);
  });

  describe("Password Hashing", () => {
    it("should hash and verify password correctly with Argon2id", async () => {
      const password = "SuperSecretPassword123!";
      const hash = await authService.hashPassword(password);

      expect(hash).toContain("$argon2id$");

      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await authService.verifyPassword("WrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Register", () => {
    it("should register a new user successfully", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue({
        id: "user-uuid-1",
        email: "test@linguaflow.com",
        username: "testuser",
        role: "USER"
      });

      const result = await authService.register({
        email: "test@linguaflow.com",
        username: "testuser",
        password: "Password123!"
      });

      expect(result.accessToken).toBe("mocked-jwt-token");
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe("test@linguaflow.com");
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it("should throw ConflictException if email exists", async () => {
      usersService.findByEmail.mockResolvedValue({ id: "existing-user" });

      await expect(
        authService.register({
          email: "duplicate@linguaflow.com",
          username: "uniqueuser",
          password: "Password123!"
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("Login", () => {
    it("should login user with valid credentials", async () => {
      const hashedPassword = await authService.hashPassword("CorrectPassword123!");
      usersService.findByEmail.mockResolvedValue({
        id: "user-1",
        email: "user@linguaflow.com",
        username: "user1",
        role: "USER",
        passwordHash: hashedPassword
      });

      const result = await authService.login({
        email: "user@linguaflow.com",
        password: "CorrectPassword123!"
      });

      expect(result.accessToken).toBe("mocked-jwt-token");
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe("user-1");
    });

    it("should throw UnauthorizedException on wrong password", async () => {
      const hashedPassword = await authService.hashPassword("CorrectPassword123!");
      usersService.findByEmail.mockResolvedValue({
        id: "user-1",
        email: "user@linguaflow.com",
        username: "user1",
        role: "USER",
        passwordHash: hashedPassword
      });

      await expect(
        authService.login({
          email: "user@linguaflow.com",
          password: "WrongPassword"
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("Token Refresh & Replay Detection", () => {
    it("should rotate refresh token when valid", async () => {
      const rawToken = "valid-raw-refresh-token";
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        userId: "user-1",
        revoked: false,
        expiresAt: new Date(Date.now() + 1000000),
        user: { id: "user-1", email: "user@linguaflow.com", role: "USER", username: "user1" }
      });

      const result = await authService.refreshTokens(rawToken);

      expect(result.accessToken).toBe("mocked-jwt-token");
      expect(result.refreshToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rt-1" },
          data: { revoked: true }
        })
      );
    });

    it("should revoke all user tokens when a revoked token is re-submitted (replay attack)", async () => {
      const rawToken = "stolen-raw-refresh-token";
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        userId: "user-victim-1",
        revoked: true,
        expiresAt: new Date(Date.now() + 1000000),
        user: { id: "user-victim-1", email: "user@linguaflow.com", role: "USER", username: "user1" }
      });

      await expect(authService.refreshTokens(rawToken)).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-victim-1" },
        data: { revoked: true }
      });
    });
  });
});
