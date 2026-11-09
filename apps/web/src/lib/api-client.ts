import {
  CardRating,
  LeagueTier,
  LanguageLevel,
  ExerciseType
} from "@linguaflow/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("lf_access_token", token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("lf_access_token");
    }
    return this.token;
  }

  logout() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("lf_access_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${res.status}`);
    }

    return (await res.json()) as T;
  }

  // Auth Endpoints
  async login(email: string, passwordHash: string) {
    return this.request<{ accessToken: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: passwordHash })
    });
  }

  async getProfile() {
    return this.request<any>("/users/me");
  }

  // Course & Lessons Endpoints
  async getCourses() {
    return this.request<any[]>("/courses");
  }

  async getLessonSession(lessonId: string) {
    return this.request<any>(`/lessons/${lessonId}/session`);
  }

  async checkAnswer(lessonId: string, exerciseId: string, answer: any) {
    return this.request<{
      isCorrect: boolean;
      correctAnswer: any;
      explanation?: string;
      heartsRemaining: number;
      isGameOver: boolean;
    }>(`/lessons/${lessonId}/check-answer`, {
      method: "POST",
      body: JSON.stringify({ exerciseId, answer })
    });
  }

  async completeLesson(lessonId: string, score: number, mistakes: number, durationSeconds = 0) {
    return this.request<any>(`/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ score, mistakes, durationSeconds })
    });
  }

  async submitLessonSession(lessonId: string, answers: any[], mistakes: number) {
    return this.completeLesson(lessonId, Math.max(0, 100 - mistakes * 15), mistakes);
  }

  // SRS Flashcards & Vocabulary
  async getDecks(language?: string) {
    const q = language ? `?language=${language}` : "";
    return this.request<any[]>(`/vocabulary/decks${q}`);
  }

  async getReviewQueue(deckId?: string, limit = 20) {
    const q = deckId ? `?deckId=${deckId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<any[]>(`/srs/review-queue${q}`);
  }

  async submitCardReview(cardId: string, rating: CardRating) {
    return this.request<any>("/srs/review", {
      method: "POST",
      body: JSON.stringify({ cardId, rating })
    });
  }

  async getSrsStats() {
    return this.request<any>("/srs/stats");
  }

  // Gamification & Shop
  async getLeaderboard(league?: LeagueTier) {
    const q = league ? `?league=${league}` : "";
    return this.request<any>(`/gamification/leaderboard${q}`);
  }

  async getShopCatalog() {
    return this.request<any[]>("/gamification/shop/catalog");
  }

  async buyShopItem(itemId: string) {
    return this.request<any>("/gamification/shop/buy", {
      method: "POST",
      body: JSON.stringify({ itemId })
    });
  }

  async getAchievements() {
    return this.request<any[]>("/gamification/achievements");
  }

  // Speaking & Pronunciation
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

  async assessPronunciation(referenceText: string, spokenText: string) {
    return this.request<any>("/speaking/assess-pronunciation", {
      method: "POST",
      body: JSON.stringify({ referenceText, spokenText })
    });
  }

  // Admin & Analytics Endpoints
  async adminGetUsers(page = 1, limit = 20) {
    return this.request<{ users: any[]; total: number; page: number; limit: number }>(
      `/admin/users?page=${page}&limit=${limit}`
    );
  }

  async adminUpdateUserRole(userId: string, role: string) {
    return this.request<any>(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role })
    });
  }

  async adminRefillUserHearts(userId: string) {
    return this.request<any>(`/admin/users/${userId}/refill-hearts`, {
      method: "POST"
    });
  }

  async adminCreateCourse(data: {
    code: string;
    title: string;
    description: string;
    language?: string;
    level: string;
  }) {
    return this.request<any>("/admin/courses", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async adminBulkImportCards(deckId: string, cards: any[]) {
    return this.request<any>(`/admin/decks/${deckId}/bulk-import`, {
      method: "POST",
      body: JSON.stringify({ cards })
    });
  }

  // Analytics Endpoints
  async getAnalyticsOverview() {
    return this.request<any>("/analytics/overview");
  }

  async getExerciseDropOff() {
    return this.request<any[]>("/analytics/exercise-dropoff");
  }

  async getStrugglingWords() {
    return this.request<any[]>("/analytics/struggling-words");
  }

  async getDauTrend() {
    return this.request<any[]>("/analytics/dau-trend");
  }
}

export const apiClient = new ApiClient();
