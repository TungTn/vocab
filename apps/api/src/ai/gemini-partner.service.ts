import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import { SystemScenario } from "./scenarios.data";

export interface PartnerTurnOutput {
  replyText: string;
  grammarCorrection: string | null;
  naturalAlternative: string | null;
}

@Injectable()
export class GeminiPartnerService {
  private readonly logger = new Logger(GeminiPartnerService.name);
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName = "gemini-2.0-flash";

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (apiKey && apiKey !== "mock" && apiKey.trim().length > 0) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log("Gemini AI Client initialized successfully.");
      } catch (err: any) {
        this.logger.warn(`Could not initialize Gemini Client: ${err?.message}`);
      }
    } else {
      this.logger.log("GEMINI_API_KEY not configured or mock. Using contextual conversation simulator.");
    }
  }

  async generateReply(
    scenario: SystemScenario,
    conversationHistory: { role: "user" | "assistant"; text: string }[],
    latestUserMessage: string
  ): Promise<PartnerTurnOutput> {
    if (this.aiClient) {
      try {
        return await this.callGemini(scenario, conversationHistory, latestUserMessage);
      } catch (err: any) {
        this.logger.warn(`Gemini API call failed: ${err?.message}. Falling back to contextual fallback.`);
      }
    }

    return this.generateFallbackReply(scenario, latestUserMessage);
  }

  private async callGemini(
    scenario: SystemScenario,
    conversationHistory: { role: "user" | "assistant"; text: string }[],
    latestUserMessage: string
  ): Promise<PartnerTurnOutput> {
    const systemInstruction = `${scenario.systemPrompt}

You MUST respond strictly with a valid JSON object matching this schema:
{
  "replyText": "your spoken reply in character, concise and natural",
  "grammarCorrection": "clear correction if user made a grammar error, otherwise null",
  "naturalAlternative": "a more idiomatic native way the user could express their message, or null"
}
Do not include markdown code block formatting around the JSON, return raw JSON only.`;

    const contents = [
      ...conversationHistory.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }]
      })),
      {
        role: "user",
        parts: [{ text: latestUserMessage }]
      }
    ];

    const response = await this.aiClient!.models.generateContent({
      model: this.modelName,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "";
    try {
      const parsed = JSON.parse(responseText);
      return {
        replyText: parsed.replyText || "Thank you. How else can I assist you?",
        grammarCorrection: parsed.grammarCorrection || null,
        naturalAlternative: parsed.naturalAlternative || null
      };
    } catch {
      return {
        replyText: responseText.trim(),
        grammarCorrection: null,
        naturalAlternative: null
      };
    }
  }

  private generateFallbackReply(scenario: SystemScenario, userMessage: string): PartnerTurnOutput {
    const text = userMessage.toLowerCase();

    // Check basic grammar rules (e.g. "I want go" -> "I want to go", "how much it is" -> "how much is it")
    let grammarCorrection: string | null = null;
    let naturalAlternative: string | null = null;

    if (text.includes("i want go")) {
      grammarCorrection = "Say 'I want to go' instead of 'I want go'.";
      naturalAlternative = "I'd like to head over to...";
    } else if (text.includes("how much it is")) {
      grammarCorrection = "In questions, invert verb and subject: 'How much is it?'.";
      naturalAlternative = "Could you tell me how much that costs?";
    } else if (text.includes("give me")) {
      naturalAlternative = "A more polite way is 'Could I please have...' or 'May I have...'.";
    }

    let replyText = "Certainly! Let's continue.";

    switch (scenario.id) {
      case "CAFE_LONDON":
        if (text.includes("cappuccino") || text.includes("latte") || text.includes("coffee")) {
          replyText = "Great choice! Would you like whole milk or oat milk with that?";
        } else if (text.includes("oat") || text.includes("whole") || text.includes("milk")) {
          replyText = "Perfect! That will be £3.80. Would you care for a freshly baked croissant as well?";
        } else if (text.includes("croissant") || text.includes("yes") || text.includes("pastry")) {
          replyText = "Splendid! The total comes to £6.20. Card or cash today?";
        } else if (text.includes("card") || text.includes("cash") || text.includes("pay")) {
          replyText = "Tap right on the terminal please... Cheers! Here is your receipt and order.";
        } else {
          replyText = "Certainly! We have fresh coffee and pastries today. What can I prepare for you?";
        }
        break;

      case "DIRECTIONS_TOKYO":
        if (text.includes("shibuya") || text.includes("sky") || text.includes("where")) {
          replyText = "Ah, Shibuya Sky is right above Shibuya Scramble Square! Head straight for about 200 meters and take the main elevator.";
        } else if (text.includes("walk") || text.includes("distance") || text.includes("far")) {
          replyText = "Yes, it is only a 3-minute walk from here! Just cross the famous Scramble Intersection.";
        } else {
          replyText = "You're very close! Just follow the signs toward the Hachiko exit, and look for the tall glass building.";
        }
        break;

      case "HOTEL_PARIS":
        if (text.includes("reservation") || text.includes("name") || text.includes("check in")) {
          replyText = "Welcome! I have found your booking. Here is your keycard for room 304 on the third floor.";
        } else if (text.includes("breakfast") || text.includes("wifi") || text.includes("time")) {
          replyText = "Breakfast is served downstairs from 7:00 AM to 10:30 AM, and the Wi-Fi network is HotelLumiere_Guest.";
        } else {
          replyText = "Certainly! Is there anything else our concierge team can assist you with this evening?";
        }
        break;

      case "INTERVIEW_NYC":
        if (text.includes("experience") || text.includes("developer") || text.includes("engineer")) {
          replyText = "That sounds like a solid background. Can you share an example of a challenging technical bug you resolved recently?";
        } else if (text.includes("challenge") || text.includes("bug") || text.includes("project")) {
          replyText = "Impressive problem-solving approach. What attracts you most to our engineering culture here?";
        } else {
          replyText = "Thank you for sharing that. Do you have any questions for me about the team or our tech stack?";
        }
        break;

      default:
        replyText = "That's wonderful! Tell me more about what you have in mind.";
    }

    return {
      replyText,
      grammarCorrection,
      naturalAlternative
    };
  }
}
