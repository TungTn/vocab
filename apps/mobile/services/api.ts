import { CardRating, LeagueTier } from "@linguaflow/shared-types";

export const API_BASE_URL = "http://10.0.2.2:4000/api"; // Standard Android emulator localhost mapping

export class MobileApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>)
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      console.warn(`[MobileApi] Fallback for ${endpoint}: ${err.message}`);
      return {} as T;
    }
  }

  async getCourses() {
    return this.request<any[]>("/courses");
  }

  async getReviewQueue(deckId?: string, limit = 20) {
    const q = deckId ? `?deckId=${deckId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<any[]>(`/srs/review-queue${q}`);
  }

  async submitReview(cardId: string, rating: CardRating) {
    return this.request<any>("/srs/review", {
      method: "POST",
      body: JSON.stringify({ cardId, rating })
    });
  }

  async getLeaderboard(league?: LeagueTier) {
    const q = league ? `?league=${league}` : "";
    return this.request<any>(`/gamification/leaderboard${q}`);
  }

  async getSpeakingScenarios() {
    return this.request<any[]>("/speaking/scenarios");
  }

  async startSpeakingSession(scenarioId: string) {
    return this.request<any>("/speaking/session/start", {
      method: "POST",
      body: JSON.stringify({ scenarioId })
    });
  }

  async submitSpeakingTurn(sessionId: string, userMessageText: string) {
    return this.request<any>("/speaking/turn", {
      method: "POST",
      body: JSON.stringify({ sessionId, userMessageText })
    });
  }
}

export const mobileApi = new MobileApiClient();
