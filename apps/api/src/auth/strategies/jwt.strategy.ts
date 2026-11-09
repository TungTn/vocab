import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../redis/redis.service";
import { AuthenticatedUserPayload } from "../../common/decorators/current-user.decorator";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  username: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_ACCESS_SECRET", "super_secret_jwt_access_key_change_in_prod_123456")
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUserPayload> {
    if (!payload.sub) {
      throw new UnauthorizedException("Invalid token payload");
    }

    // Check Redis blacklist if token was explicitly revoked
    if (payload.jti) {
      const isBlacklisted = await this.redisService.getClient().get(`blacklist:jti:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException("Token has been revoked");
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      username: payload.username
    };
  }
}
