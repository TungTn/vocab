import { mobileApi } from "../../services/api";
import { LeagueTier } from "@linguaflow/shared-types";

export function MobileLeaderboardScreen() {
  const getLeaderboard = async (league: LeagueTier = LeagueTier.SILVER) => {
    return mobileApi.getLeaderboard(league);
  };

  return {
    screen: "Leaderboard",
    getLeaderboard
  };
}

export default MobileLeaderboardScreen;
