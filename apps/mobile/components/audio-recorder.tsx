export interface AudioRecorderState {
  isRecording: boolean;
  durationMs: number;
  uri?: string;
}

export class AudioRecorderController {
  private state: AudioRecorderState = {
    isRecording: false,
    durationMs: 0
  };

  private timer: any = null;

  startRecording(): AudioRecorderState {
    this.state = {
      isRecording: true,
      durationMs: 0
    };

    return this.state;
  }

  stopRecording(): { uri: string; durationMs: number; audioBase64: string } {
    this.state.isRecording = false;
    const duration = this.state.durationMs || 2500;

    return {
      uri: "file:///mock/recording.m4a",
      durationMs: duration,
      audioBase64: "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
    };
  }

  getState(): AudioRecorderState {
    return { ...this.state };
  }
}

export const audioRecorder = new AudioRecorderController();
