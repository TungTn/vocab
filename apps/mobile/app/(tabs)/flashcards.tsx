import { offlineSrsService } from "../../services/offline-srs.service";
import { CardRating } from "@linguaflow/shared-types";

export function MobileFlashcardsScreen() {
  const dueCards = offlineSrsService.getDueCards();

  const handleRate = (cardId: string, rating: CardRating) => {
    return offlineSrsService.recordOfflineReview(cardId, rating);
  };

  const handleSync = async () => {
    return offlineSrsService.syncWithServer();
  };

  return {
    screen: "Flashcards",
    dueCardsCount: dueCards.length,
    dueCards,
    handleRate,
    handleSync
  };
}

export default MobileFlashcardsScreen;
