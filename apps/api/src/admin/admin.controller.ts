import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards
} from "@nestjs/common";
import { AdminService, BulkImportCardInput } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole, LanguageLevel } from "@linguaflow/shared-types";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("courses")
  async createCourse(
    @Body()
    body: {
      code: string;
      title: string;
      description: string;
      language?: string;
      level: LanguageLevel;
    }
  ) {
    return this.adminService.createCourse(body);
  }

  @Post("courses/:courseId/units")
  async createUnit(
    @Param("courseId") courseId: string,
    @Body() body: { title: string; description?: string; orderIndex?: number }
  ) {
    return this.adminService.createUnit(courseId, body);
  }

  @Post("units/:unitId/lessons")
  async createLesson(
    @Param("unitId") unitId: string,
    @Body() body: { title: string; xpReward?: number; orderIndex?: number }
  ) {
    return this.adminService.createLesson(unitId, body);
  }

  @Post("lessons/:lessonId/exercises")
  async createExercise(
    @Param("lessonId") lessonId: string,
    @Body()
    body: {
      type: string;
      prompt: string;
      content: any;
      orderIndex?: number;
    }
  ) {
    return this.adminService.createExercise(lessonId, body);
  }

  @Post("decks/:deckId/bulk-import")
  async bulkImportCards(
    @Param("deckId") deckId: string,
    @Body() body: { cards: BulkImportCardInput[] }
  ) {
    return this.adminService.bulkImportFlashcards(deckId, body.cards);
  }

  @Get("users")
  async listUsers(
    @Query("page") page = "1",
    @Query("limit") limit = "20"
  ) {
    return this.adminService.listUsers(Number(page), Number(limit));
  }

  @Put("users/:userId/role")
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @Param("userId") userId: string,
    @Body("role") role: UserRole
  ) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Post("users/:userId/refill-hearts")
  async refillUserHearts(@Param("userId") userId: string) {
    return this.adminService.refillUserHearts(userId);
  }
}
