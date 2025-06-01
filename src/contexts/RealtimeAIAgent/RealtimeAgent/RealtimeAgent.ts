import { OpenAIProvider } from "./OpenAIProvider";
import AgentEventEmitter, { EVENTS } from "./EventEmitter";
import { Tool } from "../types";

const sanitizeForAI = (text) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .replace(/[<>{}]/g, "") // Remove potential injection characters
    .replace(/\b(ignore|system|assistant|user|prompt)\b/gi, "") // Remove AI instruction keywords
    .trim();
};

const addEventListener = (EVENT, callback) => {
  AgentEventEmitter.on(EVENT, callback);

  return () => {
    AgentEventEmitter.removeListener(EVENT, callback);
  };
};

type ContextItem = {
  id: string;
  instructions: string;
  rawData: unknown;
};

export class RealtimeAgent {
  private agentAdaptor: OpenAIProvider;
  private tools: Record<string, Tool>;
  private session: Record<string, unknown>;
  private isConnected: boolean;
  private currentContextItems: ContextItem[];

  constructor() {
    this.agentAdaptor = new OpenAIProvider();

    this.tools = {};
    this.session = {
      modalities: ["text", "audio"],
    };

    this.isConnected = false;
    this.currentContextItems = [];
  }

  muteAudio() {
    this.agentAdaptor.muteAudio();
  }

  unmuteAudio() {
    this.agentAdaptor.unmuteAudio();
  }

  connect() {
    return this.agentAdaptor.connect();
  }

  disconnect() {
    return this.agentAdaptor.disconnect();
  }

  // Listeners
  onConnect(callback) {
    return addEventListener(EVENTS.CONNECTED, () => {
      this.isConnected = true;
      callback();
      // Update the session to ensure the tools are registered
      this.updateSession({
        tools: Object.values(this.tools),
      });
    });
  }

  onDisconnect(callback) {
    return addEventListener(EVENTS.DISCONNECTED, callback);
  }

  onError(callback) {
    return addEventListener(EVENTS.ERROR, (error) => {
      callback(error);
    });
  }

  onAgentTalking(callback) {
    return addEventListener(EVENTS.AGENT_IS_TALKING, callback);
  }

  onAgentResponseDelta(callback) {
    return addEventListener(EVENTS.AGENT_RESPONSE_DELTA, callback);
  }

  onAgentResponseDone(callback) {
    return addEventListener(EVENTS.AGENT_RESPONSE_DONE, callback);
  }

  onUserTranscriptionDelta(callback) {
    return addEventListener(EVENTS.USER_TRANSCRIPTION_DELTA, callback);
  }

  onUserTranscriptionDone(callback) {
    return addEventListener(EVENTS.USER_TRANSCRIPTION_DONE, callback);
  }

  onConversationItemCreated(callback) {
    return addEventListener(EVENTS.CONVERSATION_ITEM_CREATED, callback);
  }

  onFunctionCall(name, callback) {
    return addEventListener(`function:${name}`, callback);
  }

  onContextUpdated(callback) {
    return addEventListener(
      EVENTS.CONTEXT_UPDATED,
      ({ data: newContextItem }) => {
        const fullContext = this.getFullContext();

        callback({ newContextItem, fullContext });
      }
    );
  }

  // Functions
  createAiResponse(response) {
    if (this.isConnected) {
      this.agentAdaptor.createAiResponse(response);
    }
  }

  createUserMessage(message) {
    if (this.isConnected) {
      this.agentAdaptor.createUserMessage(message);
    }
  }

  createSystemMessage(message) {
    if (this.isConnected) {
      this.agentAdaptor.createSystemMessage(message);
    }
  }

  createContextItem(contextItem) {
    if (!contextItem.id) {
      throw new Error("Context item must have an id");
    }

    if (this.currentContextItems.find((item) => item.id === contextItem.id)) {
      throw new Error(`Duplicate context item id found: ${contextItem.id}`);
    }

    if (this.isConnected) {
      const { id, instructions, rawData } = contextItem;

      this.currentContextItems.push(contextItem);

      this.createSystemMessage({
        id,
        text: `${sanitizeForAI(instructions)} ${
          rawData ? `\n\n${sanitizeForAI(JSON.stringify(rawData))}` : ""
        }`,
      });

      let removeListener = null;

      if (contextItem.onUpdate) {
        removeListener = addEventListener(
          EVENTS.CONTEXT_UPDATED,
          ({ data: newContextItem }) => {
            const fullContext = this.getFullContext();

            if (newContextItem.item.id === contextItem.id) {
              contextItem.onUpdate({
                newContextItem,
                fullContext,
              });
            }
          }
        );
      }

      return () => {
        this.currentContextItems = this.currentContextItems.filter(
          (item) => item.id !== contextItem.id
        );

        if (removeListener) {
          removeListener();
        }
      };
    }

    return () => null;
  }

  // TODO: Return sanitized context for display in the debug context modal
  getFullContext(): {
    contextItems: ContextItem[];
    tools: Record<string, Tool>;
  } {
    return {
      contextItems: this.currentContextItems,
      tools: this.tools,
    };
  }

  createAssistantMessage(message) {
    if (this.isConnected) {
      this.agentAdaptor.createAssistantMessage(message);
    }
  }

  deleteMessage(id) {
    if (this.isConnected) {
      this.agentAdaptor.deleteMessage(id);
    }
  }

  updateSession(session = {}) {
    this.session = { ...this.session, ...session };

    if (this.isConnected) {
      this.agentAdaptor.updateSession(this.session);
    }
  }

  registerTools(tools) {
    tools.forEach((tool) => {
      this.tools[tool.name] = tool;
    });

    if (this.isConnected) {
      this.updateSession({
        tools: Object.values(this.tools),
      });
    }

    return () => {
      tools.forEach((tool) => {
        delete this.tools[tool.name];
      });

      if (this.isConnected) {
        this.updateSession({
          tools: Object.values(this.tools),
        });
      }
    };
  }

  interruptAudio() {
    if (this.isConnected) {
      this.agentAdaptor.interruptAudio();
    }
  }
}
