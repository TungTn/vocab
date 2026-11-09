import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates or returns an audio playback URL for the given text.
   * Can use Google Cloud TTS or a lightweight CDN-based streaming TTS service.
   */
  async getAudioUrlForText(text: string, lang = "en-US"): Promise<string> {
    const encoded = encodeURIComponent(text.trim());
    // Fallback lightweight speech synthesis stream URL
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;
  }
}
