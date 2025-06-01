import React from "react";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";
import ControlButton from "./ControlButton";
import { Mic, MicOff } from "lucide-react";

const MicrophoneToggle = () => {
  const { toggleMute, isListening, isMuted } = useRealtimeAiAgent();

  return (
    <ControlButton
      onClick={toggleMute}
      icon={isMuted ? <MicOff /> : <Mic />}
      tooltip={isMuted ? "Unmute microphone" : "Mute microphone"}
      isVisible={isListening}
      isListening={isListening}
    />
  );
};

export default MicrophoneToggle;
