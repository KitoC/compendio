
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// Google Cloud TTS voice configuration
interface GoogleCloudVoiceConfig {
  languageCode?: string;  // e.g., "en-US", "fr-FR"
  name?: string;          // e.g., "en-US-Standard-C"
  ssmlGender?: string;    // "MALE", "FEMALE", or "NEUTRAL"
}

// Configuration options for the voice chat hook
interface UseVoiceChatOptions {
  agentId?: string;  // Optional agent ID to specify which AI agent to talk to
  onMessageReceived?: (message: string) => void;  // Callback for when a message is received
  autoStart?: boolean; // Whether to start listening automatically
  voiceConfig?: GoogleCloudVoiceConfig; // Google Cloud TTS voice configuration
}

// Return type of the hook
interface UseVoiceChatReturn {
  isListening: boolean;  // Whether the microphone is currently listening
  isAgentSpeaking: boolean;  // Whether the agent is currently speaking
  toggle: () => Promise<void>;  // Toggle voice chat on/off
  start: () => Promise<void>;  // Start voice chat
  stop: () => void;  // Stop voice chat
  lastMessage: string | null;  // Last message received from the agent
  lastUserMessage: string | null;  // Last message sent by the user
  errorMessage: string | null;  // Any error message
  clearError: () => void;  // Clear the error message
}

/**
 * Hook for voice communication with AI agents using Google Cloud Text-to-Speech
 * 
 * Usage:
 * ```
 * const { 
 *   isListening,
 *   isAgentSpeaking,
 *   toggle,
 *   lastMessage,
 *   lastUserMessage,
 *   errorMessage
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
export const useVoiceChat = (options: UseVoiceChatOptions = {}): UseVoiceChatReturn => {
  const { 
    agentId, 
    onMessageReceived, 
    autoStart = false, 
    voiceConfig = {
      languageCode: "en-US",
      name: "en-US-Standard-C",
      ssmlGender: "FEMALE"
    }
  } = options;
  
  // State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Array<string>>([]);
  const { user, tenantId } = useAuth();

  // Initialize the speech recognition API
  const initSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage("Speech recognition is not supported in this browser.");
      return false;
    }

    // Create a speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configure the speech recognition
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    // Set up event handlers
    recognitionRef.current.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
    };
    
    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setErrorMessage(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ');
      
      // Only send complete sentences
      if (event.results[0].isFinal) {
        setLastUserMessage(transcript);
        sendMessageToAgent(transcript);
      }
    };
    
    return true;
  }, []);

  // Function to send a message to the AI agent
  const sendMessageToAgent = useCallback(async (message: string) => {
    if (!user || !tenantId || !agentId) {
      setErrorMessage("Missing user, tenant, or agent information");
      return;
    }
    
    try {
      // Call the voice processing edge function
      const { data, error } = await supabase.functions.invoke('voice-chat', {
        body: {
          message,
          agent_id: agentId,
          tenant_id: tenantId,
          user_id: user.id,
          voice_config: voiceConfig
        }
      });
      
      if (error) throw error;
      
      const { text, audioContent } = data;
      
      // Update last message and trigger callback
      setLastMessage(text);
      if (onMessageReceived) onMessageReceived(text);
      
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
  }, [user, tenantId, agentId, onMessageReceived, voiceConfig]);

  // Play audio response from the server
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
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Decode audio data and play it
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
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
    if (!('speechSynthesis' in window)) {
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

  // Manage audio queue to prevent overlapping speech
  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length > 0) {
      const nextText = audioQueueRef.current.shift();
      speakWithBrowserSynthesis(nextText);
    }
  }, [speakWithBrowserSynthesis]);

  // Start voice chat
  const start = useCallback(async () => {
    if (isListening) return; // Already listening
    
    // Initialize speech recognition if needed
    if (!recognitionRef.current) {
      const initialized = initSpeechRecognition();
      if (!initialized) return;
    }
    
    try {
      recognitionRef.current.start();
      toast.success("Voice chat activated");
    } catch (error) {
      console.error("Error starting speech recognition", error);
      setErrorMessage(`Error starting speech recognition: ${error.message}`);
    }
  }, [isListening, initSpeechRecognition]);

  // Stop voice chat
  const stop = useCallback(() => {
    if (!isListening) return; // Not listening
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        toast.info("Voice chat deactivated");
      } catch (error) {
        console.error("Error stopping speech recognition", error);
      }
    }
    
    // Stop any ongoing speech
    if (speechSynthesisRef.current && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsAgentSpeaking(false);
    }
    
    // Clear audio queue
    audioQueueRef.current = [];
  }, [isListening]);

  // Toggle voice chat on/off
  const toggle = useCallback(async () => {
    if (isListening) {
      stop();
    } else {
      await start();
    }
  }, [isListening, start, stop]);

  // Clear error message
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }

    // Cleanup on unmount
    return () => {
      stop();
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [autoStart, start, stop]);

  // Return the hook's API
  return {
    isListening,
    isAgentSpeaking,
    toggle,
    start,
    stop,
    lastMessage,
    lastUserMessage,
    errorMessage,
    clearError
  };
};

// TypeScript definitions for Speech Recognition API
// These are needed because TypeScript doesn't include these by default
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}
