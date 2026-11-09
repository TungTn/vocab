import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { SpeakingService } from "./speaking.service";
import { PronunciationScorerService } from "./pronunciation-scorer.service";

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  namespace: "/speaking"
})
export class SpeakingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SpeakingGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly speakingService: SpeakingService,
    private readonly pronunciationScorer: PronunciationScorerService
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to speaking gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from speaking gateway: ${client.id}`);
  }

  @SubscribeMessage("join_session")
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; userId: string }
  ) {
    if (!payload?.sessionId) {
      client.emit("speaking_error", { message: "sessionId is required." });
      return;
    }

    const roomName = `session:${payload.sessionId}`;
    client.join(roomName);
    this.logger.log(`User ${payload.userId || client.id} joined ${roomName}`);
    client.emit("session_joined", { sessionId: payload.sessionId });
  }

  @SubscribeMessage("send_audio")
  async handleSendAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      sessionId: string;
      userId: string;
      text?: string;
      audioBase64?: string;
    }
  ) {
    try {
      if (!payload.sessionId || !payload.userId) {
        client.emit("speaking_error", { message: "sessionId and userId are required." });
        return;
      }

      // If user text is not directly passed, use speech transcription placeholder or decode audio
      const userSpokenText = payload.text || "Hello, I would like to practice speaking.";

      const result = await this.speakingService.processTurn(payload.userId, {
        sessionId: payload.sessionId,
        userMessageText: userSpokenText,
        audioBase64: payload.audioBase64
      });

      // Emit evaluation and partner response back to client
      client.emit("ai_response", {
        sessionId: payload.sessionId,
        ...result
      });
    } catch (err: any) {
      this.logger.error(`Error in send_audio: ${err.message}`);
      client.emit("speaking_error", {
        message: err.message || "Failed to process speaking audio turn."
      });
    }
  }

  @SubscribeMessage("assess_pronunciation")
  handleAssessPronunciation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { referenceText: string; spokenText: string }
  ) {
    try {
      if (!payload.referenceText || !payload.spokenText) {
        client.emit("speaking_error", {
          message: "referenceText and spokenText are required."
        });
        return;
      }

      const assessment = this.pronunciationScorer.assess(
        payload.referenceText,
        payload.spokenText
      );

      client.emit("pronunciation_result", assessment);
    } catch (err: any) {
      this.logger.error(`Error in assess_pronunciation: ${err.message}`);
      client.emit("speaking_error", {
        message: err.message || "Failed to assess pronunciation."
      });
    }
  }
}
