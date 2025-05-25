import { getRealtimeSession } from "../queries/getRealtimeSession";
import { getSDCResponse } from "../queries/getSDCResponse";

export type InitializeWebRTCConnectionOpenProps = {
  dc: RTCDataChannel;
  pc: RTCPeerConnection;
  ms: MediaStream;
};

export interface InitializeWebRTCConnectionProps {
  onError?: (err: unknown) => void;
  onOpen?: (props: InitializeWebRTCConnectionOpenProps) => void;
  onMessage?: (
    message: Record<string, unknown>,
    event: MessageEvent<string>
  ) => void;
  url?: string;
  model?: string;
}

interface InitializeWebRTCConnectionReturn {
  startMicrophone: () => Promise<void>;
  dataChannel: RTCDataChannel;
}

const defaultURL = "https://api.openai.com/v1/realtime";
const defaultModel = "gpt-4o-mini-realtime-preview-2024-12-17";

export const initializeWebRTCConnection = async ({
  onError,
  onOpen,
  url = defaultURL,
  model = defaultModel,
  onMessage,
}: InitializeWebRTCConnectionProps): Promise<InitializeWebRTCConnectionReturn> => {
  try {
    // Get an ephemeral key from your server - see server code below
    const data = await getRealtimeSession({
      model,
      turn_detection: {
        type: "server_vad",
        silence_duration_ms: 1000,
      },
    });

    console.log("session", data);

    // Get the ephemeral key from the data
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");

    // Set up to play remote audio from the model
    const audioEl = document.createElement("audio");

    audioEl.autoplay = true;

    pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });

    pc.addTrack(ms.getTracks()[0]);

    // dc.addEventListener("message", (e) => {
    //   const data = JSON.parse(e.data);

    //   onMessage(data, e);
    // });

    // dc.addEventListener("message", (e) => {
    //   const data = JSON.parse(e.data);

    //   if (data.type === "transcription_session.created") {
    //     setIsListening(true);
    //   }

    //   if (data.type === "conversation.item.input_audio_transcription.delta") {
    //     setTranscript((prev) => prev + data.delta);
    //   }

    //   if (data.type === "error") {
    //     setError(data.error.message);
    //     setIsListening(false);
    //     console.error(data);
    //   }

    //   if (data.type === "response.function_call_arguments.done") {
    //     console.log("data", data);

    //     if (data.name === "changeBackgroundColor") {
    //       const color = JSON.parse(data.arguments).color;

    //       const el = document.querySelector(".page-container");
    //       if (el) {
    //         (el as HTMLElement).style.backgroundColor = color;
    //       }
    //     }

    //     if (data.name === "editJobDescription") {
    //       const jobDescription = JSON.parse(data.arguments).jobDescription;
    //       setTranscript(jobDescription);
    //     }

    //     if (data.name === "navigateTo") {
    //       const url = JSON.parse(data.arguments).url;
    //       navigate(`/${urlTenantAlias}/app${url}`);
    //     }
    //   }
    // });

    dc.addEventListener("open", () => {
      console.log("dc open");
      onOpen?.({ dc, pc, ms });
    });

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);

    const sdpResponse = await getSDCResponse({
      url,
      key: EPHEMERAL_KEY,
      offer,
    });

    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };

    await pc.setRemoteDescription(answer);

    return {
      dataChannel: dc,
      startMicrophone: async () => {
        // Set up to play remote audio from the model
        const audioEl = document.createElement("audio");

        audioEl.autoplay = true;

        pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

        // Add local audio track for microphone input in the browser
        const ms = await navigator.mediaDevices.getUserMedia({ audio: true });

        pc.addTrack(ms.getTracks()[0]);
      },
    };
  } catch (err: unknown) {
    console.error(err);
    onError?.(err);
  }
};
