import AgentEventEmitter, { EVENTS } from "./EventEmitter";
import { AudioHandler } from "./AudioHandler";
import { getRealtimeSession } from "../queries/getRealtimeSession";
const BASE_URL = "https://api.openai.com/v1/realtime";

// Events sent FROM the OpenAI server
const OPENAI_SERVER_EVENTS = {
  ERROR: "error",
  OUTPUT_AUDIO_BUFFER_STARTED: "output_audio_buffer.started",
  OUTPUT_AUDIO_BUFFER_STOPPED: "output_audio_buffer.stopped",
  RESPONSE_AUDIO_TRANSCRIPT_DELTA: "response.audio_transcript.delta",
  RESPONSE_AUDIO_TRANSCRIPT_DONE: "response.audio_transcript.done",
  RESPONSE_CREATED: "response.created",
  RESPONSE_UPDATED: "response.updated",
  RESPONSE_FINISHED: "response.finished",
  RESPONSE_DONE: "response.done",
  RESPONSE_ERROR: "response.error",
  RESPONSE_CANCELLED: "response.cancelled",
  CONVERSATION_ITEM_TRANSCRIPT_DELTA:
    "conversation.item.input_audio_transcription.delta",
  CONVERSATION_ITEM_TRANSCRIPT_DONE:
    "conversation.item.input_audio_transcription.completed",
  CONVERSATION_ITEM_CREATED: "conversation.item.created",
  ASSISTANT_RESPONSE_DELTA: "response.audio_transcript.delta",
  ASSISTANT_RESPONSE_DONE: "response.audio_transcript.done",
  FUNCTION_CALL_ARGUMENTS_DONE: "response.function_call_arguments.done",
};

// Events sent TO the OpenAI server
const OPENAI_CLIENT_EVENTS = {
  CONVERSATION_ITEM_CREATE: "conversation.item.create",
  CONVERSATION_ITEM_DELETE: "conversation.item.delete",
  RESPONSE_CREATE: "response.create",
  SESSION_UPDATE: "session.update",
  INTERRUPT_AUDIO: "output_audio_buffer.clear",
};

export const ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};

export interface OpenaiSession {
  model: string;
  input_audio_transcription: {
    language: string;
    model: string;
  };
  instructions: string;
  client_secret: {
    value: string;
  };
}

export class OpenAIProvider {
  private sessionConfig: Omit<OpenaiSession, "client_secret">;
  private pc: RTCPeerConnection | null;
  private dc: RTCDataChannel | null;
  private audioHandler: AudioHandler;
  private session: OpenaiSession | null;

  constructor() {
    this.sessionConfig = {
      model: "gpt-4o-mini-realtime-preview",
      input_audio_transcription: {
        language: "en",
        model: "gpt-4o-mini-transcribe",
      },
      instructions:
        "You are a helpful assistant that can answer questions and help with tasks. You must speak in english.",
    };

    this.pc = null;
    this.dc = null;
    this.audioHandler = new AudioHandler(this.pc);
    this.session = null;
  }

  muteAudio() {
    this.audioHandler.muteAudio();
  }

  unmuteAudio() {
    this.audioHandler.unmuteAudio();
  }

  async connect() {
    if (!this.session) {
      this.session = await this.createSession();
    }
    // Get the ephemeral key from the data
    const EPHEMERAL_KEY = this.session.client_secret.value;

    // Create a peer connection
    this.pc = new RTCPeerConnection();
    this.audioHandler.setPC(this.pc);

    // Set up data channel for sending and receiving events
    this.dc = this.pc.createDataChannel("oai-events");

    await this.audioHandler.startAudioCapture();

    // Start the session using the Session Description Protocol (SDP)
    const offer = await this.pc.createOffer();

    await this.pc.setLocalDescription(offer);

    const sdpResponse = await this.getSDCResponse({
      url: BASE_URL,
      key: EPHEMERAL_KEY,
      offer,
    });

    const answer = {
      type: "answer" as RTCSdpType,
      sdp: await sdpResponse.text(),
    };

    await this.pc.setRemoteDescription(answer);
    this.setupListeners();
  }

  setupListeners() {
    this.dc.onopen = () => {
      AgentEventEmitter.emit(EVENTS.CONNECTED);
    };

    this.dc.onclose = () => {
      AgentEventEmitter.emit(EVENTS.DISCONNECTED);
    };

    this.dc.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === OPENAI_SERVER_EVENTS.ERROR) {
        AgentEventEmitter.emit(EVENTS.ERROR, data);

        this.disconnect();
      }

      if (data.type === OPENAI_SERVER_EVENTS.OUTPUT_AUDIO_BUFFER_STARTED) {
        AgentEventEmitter.emit(EVENTS.AGENT_IS_TALKING, true);
      }

      if (data.type === OPENAI_SERVER_EVENTS.OUTPUT_AUDIO_BUFFER_STOPPED) {
        AgentEventEmitter.emit(EVENTS.AGENT_IS_TALKING, false);
      }

      if (data.type === OPENAI_SERVER_EVENTS.ASSISTANT_RESPONSE_DELTA) {
        AgentEventEmitter.emit(EVENTS.AGENT_RESPONSE_DELTA, {
          text: data.delta,
          done: false,
          data,
        });
      }

      if (data.type === OPENAI_SERVER_EVENTS.ASSISTANT_RESPONSE_DONE) {
        AgentEventEmitter.emit(EVENTS.AGENT_RESPONSE_DONE, {
          text: data.transcript,
          done: true,
          data,
        });
      }

      if (
        data.type === OPENAI_SERVER_EVENTS.CONVERSATION_ITEM_TRANSCRIPT_DELTA
      ) {
        AgentEventEmitter.emit(EVENTS.USER_TRANSCRIPTION_DELTA, {
          text: data.delta,
          done: false,
          data,
        });
      }

      if (
        data.type === OPENAI_SERVER_EVENTS.CONVERSATION_ITEM_TRANSCRIPT_DONE
      ) {
        AgentEventEmitter.emit(EVENTS.USER_TRANSCRIPTION_DONE, {
          text: data.transcript,
          done: true,
          data,
        });
      }

      if (data.type === OPENAI_SERVER_EVENTS.FUNCTION_CALL_ARGUMENTS_DONE) {
        AgentEventEmitter.emit(`function:${data.name}`, {
          arguments: JSON.parse(data.arguments),
          data,
        });
      }

      if (data.type === OPENAI_SERVER_EVENTS.CONVERSATION_ITEM_CREATED) {
        AgentEventEmitter.emit(EVENTS.CONVERSATION_ITEM_CREATED, { data });
      }

      if (
        data.type === OPENAI_SERVER_EVENTS.CONVERSATION_ITEM_CREATED &&
        data.item.role === ROLES.SYSTEM
      ) {
        AgentEventEmitter.emit(EVENTS.CONTEXT_UPDATED, { data });
      }
    };
  }

  async disconnect() {
    this.pc?.close();
    this.dc?.close();
    this.audioHandler.stopAudioCapture();
    AgentEventEmitter.emit(EVENTS.DISCONNECTED);
  }

  getApiKey() {
    if (process.env.REACT_APP_OPENAI_KEY) {
      return process.env.REACT_APP_OPENAI_KEY;
    }

    if (localStorage.getItem("openai_api_key")) {
      return localStorage.getItem("openai_api_key");
    }

    throw new Error("No API key found");
  }

  // TODO: Move this to the backend
  async createSession() {
    return getRealtimeSession(this.sessionConfig);
  }

  async getSDCResponse({ url, key, offer }) {
    const sdpResponse = await fetch(`${url}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/sdp",
      },
    });

    return sdpResponse;
  }

  sendServerEvent(event) {
    if (this.dc.readyState === "open") {
      this.dc.send(JSON.stringify(event));
    }
  }

  createAiResponse(response) {
    const newResponse = {
      type: OPENAI_CLIENT_EVENTS.RESPONSE_CREATE,
      response,
    };
    this.sendServerEvent(newResponse);
  }

  createTextMessage(role, message) {
    const newMessage = {
      type: OPENAI_CLIENT_EVENTS.CONVERSATION_ITEM_CREATE,
      item: {
        id: message.id,
        type: "message",
        role,
        content: [{ type: "input_text", text: message.text }],
      },
    };

    this.sendServerEvent(newMessage);
  }

  deleteMessage(id) {
    this.sendServerEvent({
      type: OPENAI_CLIENT_EVENTS.CONVERSATION_ITEM_DELETE,
      item_id: id,
    });
  }

  createUserMessage(message) {
    this.createTextMessage(ROLES.USER, message);
  }

  createAssistantMessage(message) {
    this.createTextMessage(ROLES.ASSISTANT, message);
  }

  createSystemMessage(message) {
    this.createTextMessage(ROLES.SYSTEM, message);
  }

  updateSession(session) {
    this.sendServerEvent({
      type: OPENAI_CLIENT_EVENTS.SESSION_UPDATE,
      session,
    });
  }

  interruptAudio() {
    this.sendServerEvent({
      type: OPENAI_CLIENT_EVENTS.INTERRUPT_AUDIO,
    });
  }
}
