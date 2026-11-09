import { Controller, Get, Put, Body, UseGuards, UsePipes } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { UpdateProfileSchema, UpdateProfile } from "@linguaflow/shared-types";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  async getProfile(@CurrentUser("userId") userId: string) {
    return this.usersService.getUserProfile(userId);
  }

  @Put("profile")
  @UsePipes(new ZodValidationPipe(UpdateProfileSchema))
  async updateProfile(
    @CurrentUser("userId") userId: string,
    @Body() dto: UpdateProfile
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
