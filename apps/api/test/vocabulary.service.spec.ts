import { describe, it, expect, beforeEach, vi } from "vitest";
import { VocabularyService } from "../src/vocabulary/vocabulary.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe("VocabularyService", () => {
  let service: VocabularyService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      deck: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
      },
      flashcard: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }
    };

    service = new VocabularyService(prisma);
  });

  it("should list system and user custom decks", async () => {
    prisma.deck.findMany.mockResolvedValue([
      {
        id: "deck-sys",
        title: "Oxford 3000",
        description: "System deck",
        language: "en",
        isSystem: true,
        userId: null,
        _count: { cards: 50 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "deck-user",
        title: "My Custom Deck",
        description: "User deck",
        language: "en",
        isSystem: false,
        userId: "user-1",
        _count: { cards: 10 },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const result = await service.listDecks("user-1", "en");

    expect(result.length).toBe(2);
    expect(result[0].cardCount).toBe(50);
    expect(result[1].cardCount).toBe(10);
  });

  it("should create custom deck for user", async () => {
    prisma.deck.create.mockResolvedValue({
      id: "new-deck",
      title: "Business English",
      language: "en",
      isSystem: false,
      userId: "user-1"
    });

    const result = await service.createDeck("user-1", {
      title: "Business English",
      language: "en"
    });

    expect(result.id).toBe("new-deck");
    expect(prisma.deck.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", isSystem: false })
      })
    );
  });

  it("should prevent deleting a system deck", async () => {
    prisma.deck.findUnique.mockResolvedValue({
      id: "sys-deck",
      isSystem: true,
      userId: null
    });

    await expect(service.deleteDeck("sys-deck", "user-1")).rejects.toThrow(
      ForbiddenException
    );
  });

  it("should prevent non-owner from deleting another user's deck", async () => {
    prisma.deck.findUnique.mockResolvedValue({
      id: "other-deck",
      isSystem: false,
      userId: "user-2"
    });

    await expect(service.deleteDeck("other-deck", "user-1")).rejects.toThrow(
      ForbiddenException
    );
  });

  it("should add card to custom deck when owner", async () => {
    prisma.deck.findUnique.mockResolvedValue({
      id: "custom-deck",
      isSystem: false,
      userId: "user-1"
    });

    prisma.flashcard.create.mockResolvedValue({
      id: "card-1",
      term: "eloquent",
      meaning: "hùng biện"
    });

    const result = await service.addCard("custom-deck", "user-1", {
      term: "eloquent",
      meaning: "hùng biện",
      pos: "adjective"
    });

    expect(result.id).toBe("card-1");
  });
});
