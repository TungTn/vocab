import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes
} from "@nestjs/common";
import { VocabularyService } from "./vocabulary.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  CreateDeckSchema,
  CreateDeck,
  CreateFlashcardSchema,
  CreateFlashcard,
  UpdateFlashcardSchema,
  UpdateFlashcard
} from "@linguaflow/shared-types";

@Controller("vocabulary")
@UseGuards(JwtAuthGuard)
export class VocabularyController {
  constructor(private readonly vocabService: VocabularyService) {}

  @Get("decks")
  async listDecks(
    @CurrentUser("userId") userId: string,
    @Query("language") language?: string
  ) {
    return this.vocabService.listDecks(userId, language || "en");
  }

  @Post("decks")
  @UsePipes(new ZodValidationPipe(CreateDeckSchema))
  async createDeck(
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateDeck
  ) {
    return this.vocabService.createDeck(userId, dto);
  }

  @Get("decks/:id")
  async getDeck(
    @CurrentUser("userId") userId: string,
    @Param("id") deckId: string
  ) {
    return this.vocabService.getDeck(deckId, userId);
  }

  @Delete("decks/:id")
  async deleteDeck(
    @CurrentUser("userId") userId: string,
    @Param("id") deckId: string
  ) {
    return this.vocabService.deleteDeck(deckId, userId);
  }

  @Post("decks/:id/cards")
  @UsePipes(new ZodValidationPipe(CreateFlashcardSchema))
  async addCard(
    @CurrentUser("userId") userId: string,
    @Param("id") deckId: string,
    @Body() dto: CreateFlashcard
  ) {
    return this.vocabService.addCard(deckId, userId, dto);
  }

  @Put("cards/:id")
  @UsePipes(new ZodValidationPipe(UpdateFlashcardSchema))
  async updateCard(
    @CurrentUser("userId") userId: string,
    @Param("id") cardId: string,
    @Body() dto: UpdateFlashcard
  ) {
    return this.vocabService.updateCard(cardId, userId, dto);
  }

  @Delete("cards/:id")
  async deleteCard(
    @CurrentUser("userId") userId: string,
    @Param("id") cardId: string
  ) {
    return this.vocabService.deleteCard(cardId, userId);
  }
}
