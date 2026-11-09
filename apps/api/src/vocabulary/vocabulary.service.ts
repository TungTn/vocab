import {
  Injectable,
  NotFoundException,
  ForbiddenException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDeck, CreateFlashcard, UpdateFlashcard } from "@linguaflow/shared-types";

@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  async listDecks(userId: string, language: string = "en") {
    const decks = await this.prisma.deck.findMany({
      where: {
        language,
        OR: [{ isSystem: true }, { userId }]
      },
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }]
    });

    return decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description,
      language: deck.language,
      isSystem: deck.isSystem,
      userId: deck.userId,
      cardCount: deck._count.cards,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt
    }));
  }

  async getDeck(deckId: string, userId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: {
          include: {
            reviewStates: {
              where: { userId }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: { cards: true }
        }
      }
    });

    if (!deck) {
      throw new NotFoundException("Deck not found");
    }

    if (!deck.isSystem && deck.userId !== userId) {
      throw new ForbiddenException("You do not have access to this deck");
    }

    return {
      ...deck,
      cardCount: deck._count.cards,
      cards: deck.cards.map((card) => {
        const reviewState = card.reviewStates[0] || null;
        const { reviewStates: _, ...restCard } = card;
        return {
          ...restCard,
          reviewState
        };
      })
    };
  }

  async createDeck(userId: string, dto: CreateDeck) {
    return this.prisma.deck.create({
      data: {
        title: dto.title,
        description: dto.description,
        language: dto.language,
        isSystem: false,
        userId
      }
    });
  }

  async deleteDeck(deckId: string, userId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId }
    });

    if (!deck) {
      throw new NotFoundException("Deck not found");
    }

    if (deck.isSystem) {
      throw new ForbiddenException("Cannot delete system deck");
    }

    if (deck.userId !== userId) {
      throw new ForbiddenException("You can only delete your own decks");
    }

    return this.prisma.deck.delete({
      where: { id: deckId }
    });
  }

  async addCard(deckId: string, userId: string, dto: CreateFlashcard) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId }
    });

    if (!deck) {
      throw new NotFoundException("Deck not found");
    }

    if (!deck.isSystem && deck.userId !== userId) {
      throw new ForbiddenException("You cannot add cards to this deck");
    }

    return this.prisma.flashcard.create({
      data: {
        deckId,
        term: dto.term,
        ipa: dto.ipa,
        meaning: dto.meaning,
        pos: dto.pos,
        examples: dto.examples as unknown as object[],
        audioUrl: dto.audioUrl,
        imageUrl: dto.imageUrl
      }
    });
  }

  async updateCard(cardId: string, userId: string, dto: UpdateFlashcard) {
    const card = await this.prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { deck: true }
    });

    if (!card) {
      throw new NotFoundException("Flashcard not found");
    }

    if (!card.deck.isSystem && card.deck.userId !== userId) {
      throw new ForbiddenException("You can only edit cards in your own decks");
    }

    return this.prisma.flashcard.update({
      where: { id: cardId },
      data: {
        ...(dto.term && { term: dto.term }),
        ...(dto.ipa !== undefined && { ipa: dto.ipa }),
        ...(dto.meaning && { meaning: dto.meaning }),
        ...(dto.pos !== undefined && { pos: dto.pos }),
        ...(dto.examples && { examples: dto.examples as unknown as object[] }),
        ...(dto.audioUrl !== undefined && { audioUrl: dto.audioUrl }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl })
      }
    });
  }

  async deleteCard(cardId: string, userId: string) {
    const card = await this.prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { deck: true }
    });

    if (!card) {
      throw new NotFoundException("Flashcard not found");
    }

    if (!card.deck.isSystem && card.deck.userId !== userId) {
      throw new ForbiddenException("You can only delete cards from your own decks");
    }

    return this.prisma.flashcard.delete({
      where: { id: cardId }
    });
  }
}
