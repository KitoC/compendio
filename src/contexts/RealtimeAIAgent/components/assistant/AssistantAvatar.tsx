import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import MicrophoneToggle from "../controls/MicrophoneToggle";
import ContextModal from "../modals/ContextModal";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";
import ControlButton from "../controls/ControlButton";
import SpeakingAnimation from "./SpeakingAnimation";
import { MessageCircle } from "lucide-react";

interface AssistantAvatarProps {
  toggleOpen: () => void;
  isOpen: boolean;
}

const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  toggleOpen,
  isOpen,
}) => {
  const {
    startListening,
    stopListening,
    isListening,
    isConnecting,
    assistantTalking,
    error,
  } = useRealtimeAiAgent();

  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 300);
    }, Math.random() * 4000 + 2000);

    return () => clearInterval(blinkInterval);
  }, [blinking]);

  const getEyeHeight = () => {
    if (!isListening) return "h-0.5";
    if ((isConnecting || isListening) && blinking) return "h-1";
    return "h-5";
  };

  return (
    <div
      className="pointer-events-auto relative flex items-end gap-1"
      id="avatar-container"
    >
      {!isOpen && (
        <div className="flex items-center justify-center gap-2 ml-auto">
          <ContextModal />
          <MicrophoneToggle />
          <ControlButton
            onClick={toggleOpen}
            isVisible={isListening}
            isListening={isListening}
            icon={<MessageCircle />}
            tooltip="Open chat"
          />
        </div>
      )}

      <div
        className={`
          ${!isOpen ? "bg-stone-600" : "bg-transparent"} 
          rounded-full h-20 w-20 flex items-center justify-center
          shadow-lg
        `}
      >
        <button
          onClick={isListening ? stopListening : startListening}
          className={`
            border-none text-gray-800 p-0.5  h-20 w-20 
            flex items-center justify-center relative z-50 
            ${isConnecting ? "animate-pulse" : ""} 
            cursor-pointer bg-transparent transform scale-75
          `}
        >
          <div
            className="
              bg-white rounded-2xl h-full w-full border border-stone-500
              flex items-center justify-center relative z-10 p-1
              shadow-lg
              scale-125
            "
          >
            {/* Inner head */}
            <div
              className={`
                bg-stone-600 border-[3px] border-stone-400 rounded-2xl h-full w-full relative flex items-center 
                justify-center z-20 text-lime-600
                ${isConnecting ? "animate-pulse" : ""}
             
              `}
            >
              {error ? (
                <div>
                  <span className="text-sm font-medium">ERROR</span>
                </div>
              ) : (
                <>
                  {/* Eyes */}
                  <div className="absolute -top-1.5 left-0 w-full h-full flex items-center justify-between px-2">
                    <div
                      className={`
                        w-4 ${getEyeHeight()} rounded-full transition-all duration-200
                        ${
                          isListening
                            ? "bg-lime-500 hover:bg-lime-500"
                            : "bg-slate-400 hover:bg-slate-500"
                        }
                      `}
                    />
                    <div
                      className={`
                        w-4 ${getEyeHeight()} rounded-full transition-all duration-200
                        ${
                          isListening
                            ? "bg-lime-500 hover:bg-lime-500"
                            : "bg-slate-400 hover:bg-slate-500"
                        }
                      `}
                    />
                  </div>

                  {/* Mouth */}
                  {assistantTalking ? (
                    <div className="scale-50 relative top-4">
                      <SpeakingAnimation
                        className=""
                        barClassName="bg-lime-500"
                      />
                    </div>
                  ) : (
                    <div
                      className={`
                        w-4 h-1 rounded-full relative top-4
                        ${isListening ? "bg-lime-500" : "bg-slate-400"}
                      `}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

AssistantAvatar.propTypes = {
  toggleOpen: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default AssistantAvatar;
