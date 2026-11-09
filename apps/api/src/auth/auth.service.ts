import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { UsersService } from "../users/users.service";
import { RegisterRequest, LoginRequest, ChangePassword } from "@linguaflow/shared-types";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private generateTokens(userId: string, email: string, role: string, username: string) {
    const jti = crypto.randomUUID();
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        username,
        jti
      },
      {
        secret: this.configService.get<string>(
          "JWT_ACCESS_SECRET",
          "super_secret_jwt_access_key_change_in_prod_123456"
        ),
        expiresIn: (this.configService.get<string>("JWT_ACCESS_EXPIRES_IN", "15m") || "15m") as any
      }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    return { accessToken, rawRefreshToken, jti };
  }

  async register(dto: RegisterRequest) {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException("Email already in use");
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException("Username already in use");
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.usersService.createUser({
      email: dto.email,
      username: dto.username,
      passwordHash,
      targetLang: dto.targetLang,
      nativeLang: dto.nativeLang
    });

    const tokens = this.generateTokens(user.id, user.email, user.role, user.username);
    await this.storeRefreshToken(user.id, tokens.rawRefreshToken);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      user: userWithoutPassword
    };
  }

  async login(dto: LoginRequest) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await this.verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = this.generateTokens(user.id, user.email, user.role, user.username);
    await this.storeRefreshToken(user.id, tokens.rawRefreshToken);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      user: userWithoutPassword
    };
  }

  private async storeRefreshToken(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });

    // Also cache active refresh token hash in Redis with 7 days TTL (604800s)
    await this.redis
      .getClient()
      .set(`refresh:${tokenHash}`, userId, "EX", 7 * 24 * 60 * 60);
  }

  async refreshTokens(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new BadRequestException("Refresh token is required");
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Replay attack detection: if token is already revoked, invalidate ALL tokens for this user!
    if (tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      this.logger.warn(`Suspicious refresh token reuse detected for user ${tokenRecord.userId}! Revoking all tokens.`);
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revoked: true }
      });
      throw new UnauthorizedException("Refresh token revoked or expired. Please sign in again.");
    }

    // Mark current refresh token as revoked (rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    });
    await this.redis.getClient().del(`refresh:${tokenHash}`);

    // Generate new tokens
    const { user } = tokenRecord;
    const tokens = this.generateTokens(user.id, user.email, user.role, user.username);
    await this.storeRefreshToken(user.id, tokens.rawRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken
    };
  }

  async logout(userId: string, rawRefreshToken?: string, jti?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true }
      });
      await this.redis.getClient().del(`refresh:${tokenHash}`);
    }

    // Blacklist access token JTI for 15 minutes (900 seconds)
    if (jti) {
      await this.redis.getClient().set(`blacklist:jti:${jti}`, "revoked", "EX", 900);
    }

    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePassword) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.passwordHash) {
      throw new BadRequestException("User has no password set (OAuth account)");
    }

    const isMatch = await this.verifyPassword(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException("Current password does not match");
    }

    const newHash = await this.hashPassword(dto.newPassword);
    await this.usersService.updatePassword(userId, newHash);

    // Invalidate all existing refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true }
    });

    return { success: true, message: "Password updated successfully" };
  }

  async oauthLogin(dto: {
    provider: "google" | "facebook" | "github";
    email: string;
    displayName?: string;
    avatarUrl?: string;
  }) {
    const email = dto.email.toLowerCase().trim();
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      // Generate clean username from email or display name
      const baseName = (dto.displayName || email.split("@")[0])
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase()
        .slice(0, 15) || "user";
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseName}_${randomSuffix}`;

      user = await this.prisma.user.create({
        data: {
          email,
          username,
          avatarUrl: dto.avatarUrl,
          role: "USER",
          profile: {
            create: {
              displayName: dto.displayName || username,
              targetLang: "en",
              nativeLang: "vi",
              currentLevel: "A1",
              dailyGoalMinutes: 15,
              dailyGoalXp: 30
            }
          }
        },
        include: { profile: true }
      });
    } else if (dto.avatarUrl && !user.avatarUrl) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: dto.avatarUrl },
        include: { profile: true }
      });
    }

    const tokens = this.generateTokens(user.id, user.email, user.role, user.username);
    await this.storeRefreshToken(user.id, tokens.rawRefreshToken);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      user: userWithoutPassword
    };
  }
}
