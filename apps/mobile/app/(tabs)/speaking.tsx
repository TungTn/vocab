import { audioRecorder } from "../../components/audio-recorder";
import { mobileApi } from "../../services/api";

export function MobileSpeakingScreen() {
  const startRecording = () => {
    return audioRecorder.startRecording();
  };

  const stopAndSubmit = async (sessionId: string, spokenText: string) => {
    const audio = audioRecorder.stopRecording();
    return mobileApi.submitSpeakingTurn(sessionId, spokenText);
  };

  return {
    screen: "Speaking",
    startRecording,
    stopAndSubmit
  };
}

export default MobileSpeakingScreen;
