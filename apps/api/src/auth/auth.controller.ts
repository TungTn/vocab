import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUserPayload } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  RegisterRequestSchema,
  RegisterRequest,
  LoginRequestSchema,
  LoginRequest,
  ChangePasswordSchema,
  ChangePassword
} from "@linguaflow/shared-types";

const REFRESH_COOKIE_NAME = "linguaflow_refresh_token";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
  }

  @Post("register")
  @UsePipes(new ZodValidationPipe(RegisterRequestSchema))
  async register(
    @Body() dto: RegisterRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginRequestSchema))
  async login(
    @Body() dto: LoginRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body("refreshToken") bodyToken?: string
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || bodyToken;
    const result = await this.authService.refreshTokens(rawRefreshToken);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body("refreshToken") bodyToken?: string
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || bodyToken;
    this.clearRefreshCookie(res);
    return this.authService.logout(user.userId, rawRefreshToken);
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(ChangePasswordSchema))
  async changePassword(
    @CurrentUser("userId") userId: string,
    @Body() dto: ChangePassword
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUserPayload) {
    return user;
  }
}
