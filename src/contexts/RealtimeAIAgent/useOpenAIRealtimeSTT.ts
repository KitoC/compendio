import { useState, useRef, useCallback } from "react";
import { SupabaseFunctionService } from "@/services/supabaseFunctionServices";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { getEphemeralKey } from "./queries/getRealtimeSession";

function configureData(dc) {
  console.log("Configuring data channel");
  const event = {
    type: "session.update",
    session: {
      modalities: ["text", "audio"],
      // Provide the tools. Note they match the keys in the `fns` object above
      tools: [
        {
          type: "function",
          name: "changeBackgroundColor",
          description: "Changes the background color of a web page",
          parameters: {
            type: "object",
            properties: {
              color: {
                type: "string",
                description: "A hex value of the color",
              },
            },
          },
        },
        {
          type: "function",
          name: "editJobDescription",
          description: "Edits the job description",
          parameters: {
            type: "object",
            properties: {
              jobDescription: {
                type: "string",
                description: "The job description",
              },
            },
          },
        },

        {
          type: "function",
          name: "navigateTo",
          description: "Navigates to a new page",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to navigate to",
                enum: [
                  "/dashboard",
                  "/clients",
                  "/staff-members",
                  "/quotes",
                  "/quotes/new",
                ],
              },
            },
            required: ["url"],
          },
        },
      ],
    },
  };
  dc.send(JSON.stringify(event));
}

export function useOpenAIRealtimeSTT() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const signalingRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const { urlTenantAlias } = useTenant();
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);

  // 2. Start listening and connect to OpenAI via WebRTC
  const startListening = useCallback(async () => {
    setTranscript("");
    setError(null);

    try {
      // Get an ephemeral key from your server - see server code below
      const data = await getEphemeralKey();

      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a peer connection
      const pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

      // Add local audio track for microphone input in the browser
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel("oai-events");

      dc.addEventListener("message", (e) => {
        const data = JSON.parse(e.data);

        if (data.type === "transcription_session.created") {
          setIsListening(true);
        }

        if (data.type === "conversation.item.input_audio_transcription.delta") {
          setTranscript((prev) => prev + data.delta);
        }

        if (data.type === "error") {
          setError(data.error.message);
          setIsListening(false);
          console.error(data);
        }

        if (data.type === "response.function_call_arguments.done") {
          console.log("data", data);

          if (data.name === "changeBackgroundColor") {
            const color = JSON.parse(data.arguments).color;

            const el = document.querySelector(".page-container");
            if (el) {
              (el as HTMLElement).style.backgroundColor = color;
            }
          }

          if (data.name === "editJobDescription") {
            const jobDescription = JSON.parse(data.arguments).jobDescription;
            setTranscript(jobDescription);
          }

          if (data.name === "navigateTo") {
            const url = JSON.parse(data.arguments).url;
            navigate(`/${urlTenantAlias}/app${url}`);
          }
        }
      });

      dc.addEventListener("open", () => {
        console.log("dc open");
        configureData(dc);
      });

      // Start the session using the Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-mini-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsListening(false);
    }
  }, []);

  // 3. Stop listening and clean up
  const stopListening = useCallback(() => {
    peerRef.current?.close();
    signalingRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    setIsListening(false);
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    error,
  };
}
