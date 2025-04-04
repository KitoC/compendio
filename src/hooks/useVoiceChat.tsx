// NO_CHANGE

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { callSupabaseFunction } from "@/services/supabaseFunctionServices";
import { ChatMessage } from "@/types/chat";
import { useTenant } from "@/contexts/TenantContext";
// Google Cloud TTS voice configuration
interface GoogleCloudVoiceConfig {
  languageCode?: string; // e.g., "en-US", "fr-FR"
  name?: string; // e.g., "en-US-Standard-C"
  ssmlGender?: string; // "MALE", "FEMALE", or "NEUTRAL"
}

// Configuration options for the voice chat hook
interface UseVoiceChatOptions {
  agentId?: string; // Optional agent ID to specify which AI agent to talk to
  onMessageReceived?: (message: string, functionCall?: object) => void; // Callback for when a message is received
  voiceConfig?: GoogleCloudVoiceConfig; // Google Cloud TTS voice configuration
  conversationId?: string;
}

// Return type of the hook
interface UseVoiceChatReturn {
  isAgentSpeaking: boolean; // Whether the agent is currently speaking
  lastMessage: string | null; // Last message received from the agent
  errorMessage: string | null; // Any error message
  clearError: () => void; // Clear the error message
  sendMessageToAgent: (message: ChatMessage) => Promise<void>; // Send message to agent
}

/**
 * Hook for voice communication with AI agents using Google Cloud Text-to-Speech
 *
 * Usage with react-speech-recognition:
 * ```
 * const {
 *   isAgentSpeaking,
 *   lastMessage,
 *   errorMessage,
 *   sendMessageToAgent
 * } = useVoiceChat({
 *   agentId: "agent-id-here",
 *   onMessageReceived: (message) => console.log("New message:", message),
 *   voiceConfig: {
 *     languageCode: "en-US",
 *     name: "en-US-Wavenet-F",
 *     ssmlGender: "FEMALE"
 *   }
 * });
 * ```
 */
export const useVoiceChat = (
  options: UseVoiceChatOptions = {}
): UseVoiceChatReturn => {
  const {
    agentId,
    onMessageReceived,
    voiceConfig = {
      languageCode: "en-US",
      name: "en-US-Standard-C",
      ssmlGender: "FEMALE",
    },
    conversationId,
  } = options;

  // State
  const [isAgentSpeaking, setIsAgentSpeaking] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Array<string>>([]);
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      setIsAgentSpeaking(true);

      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      // Decode audio data and play it
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        bytes.buffer
      );
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        setIsAgentSpeaking(false);
        playNextInQueue();
      };

      source.start(0);
    } catch (error) {
      console.error("Error playing audio response", error);
      setErrorMessage(`Error playing audio response: ${error.message}`);
      setIsAgentSpeaking(false);
    }
  }, []);

  // Use browser's speech synthesis as fallback
  const speakWithBrowserSynthesis = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported");
      return;
    }

    setIsAgentSpeaking(true);

    speechSynthesisRef.current = new SpeechSynthesisUtterance(text);
    speechSynthesisRef.current.onend = () => {
      setIsAgentSpeaking(false);
      playNextInQueue();
    };

    window.speechSynthesis.speak(speechSynthesisRef.current);
  }, []);

  // Function to send a message to the AI agent
  const sendMessageToAgent = useCallback(
    async (message: ChatMessage) => {
      if (!user || !tenantId || !agentId) {
        setErrorMessage("Missing user, tenant, or agent information");
        return;
      }

      try {
        // Call the voice processing edge function
        const response = await callSupabaseFunction("voice-chat", {
          message,
          agent_id: agentId,
          tenant_id: tenantId,
          user_id: user.id,
          voice_config: voiceConfig,
          conversation_id: conversationId,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI chat error (${response.status}):`, errorText);
          throw new Error(`AI chat error: ${errorText}`);
        }
        const responseJson = await response.json();

        const { text, audioContent, functionCall } = responseJson;

        if (!audioContent && !text)
          throw new Error("No data returned from voice chat");

        // Update last message and trigger callback
        setLastMessage(text);
        if (onMessageReceived) onMessageReceived(text, functionCall);

        // Play audio response if available
        if (audioContent) {
          await playAudioResponse(audioContent);
        } else {
          // Fallback to browser's speech synthesis if no audio content is returned
          speakWithBrowserSynthesis(text);
        }
      } catch (error) {
        console.error("Error sending message to agent", error);
        setErrorMessage(`Error sending message to agent: ${error.message}`);
      }
    },
    [user, tenantId, agentId, onMessageReceived, voiceConfig, conversationId]
  );

  // Play audio response from the server

  // Manage audio queue to prevent overlapping speech
  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length > 0) {
      const nextText = audioQueueRef.current.shift();
      speakWithBrowserSynthesis(nextText);
    }
  }, [speakWithBrowserSynthesis]);

  // Clear error message
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Return the hook's API (simplified from previous version)
  return {
    isAgentSpeaking,
    lastMessage,
    errorMessage,
    clearError,
    sendMessageToAgent,
  };
};

// TypeScript definitions for Audio API
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}
