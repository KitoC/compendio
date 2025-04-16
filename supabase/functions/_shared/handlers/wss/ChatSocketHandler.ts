import { AgentController } from "@/controllers/AgentController";
import { FunctionController } from "@/controllers/FunctionController";
import { getAgentController } from "@/factories/getAgentController";
import { AuthenticatedContext } from "@/middleware/withAuthenticatedContext";

type ChatSocketMessage = {
  type: string;
  conversation_id: string;
  agent_id: string;
  payload: {
    function_context: unknown;
    type: string;
  };
};

export class ChatSocketHandler {
  private context: AuthenticatedContext;
  private socket: WebSocket;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private functionAlreadyCalled = false;
  private decoder = new TextDecoder();
  private accumulated = "";
  private sessionContext: string;
  constructor(context: AuthenticatedContext, socket: WebSocket) {
    this.context = context;
    this.socket = socket;
    this.sessionContext = JSON.stringify({
      todaysDate: new Date().toISOString(),
      // TODO: get user timezone from sessionContext
      timezone: "Australia/Sydney",
    });
  }

  routeSocketMessage(data: ChatSocketMessage) {
    if (data.type === "chat:start") {
      return this.start(data.conversation_id, data.agent_id);
    }
    if (data.type === "chat:trigger_function_call") {
      return this.triggerFunctionCall(data);
    }

    if (data.type === "chat:stop") {
      return this.stop();
    }

    // if (data.type === "chat:initiateConversation") {
    //   return this.initiateConversation(data);
    // }

    return null;
  }

  // async initiateConversation(
  //   conversation_id: string,
  //   agent_id: string,
  //   initial_message: string
  // ) {
  //   const agentController = await getAgentController(
  //     this.context,
  //     new FunctionController(this.context),
  //     agent_id,
  //     {}
  //   );

  //   const stream = await agentController.talkToAgent(conversation_id);

  //   this.streamToSocket(stream);
  // }

  private getTextFromChunk(chunk: string) {
    const parsed = JSON.parse(chunk);
    return parsed.text;
  }

  private handleFunctionCall(chunk: string) {
    if (this.functionAlreadyCalled) return;
    const parsed = JSON.parse(chunk);

    if (parsed.function_call) {
      this.functionAlreadyCalled = true;
      this.socket.send(
        JSON.stringify({
          type: "function_call",
          value: { function_call: parsed.function_call },
        })
      );
    }
  }

  async streamToSocket(stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader();

    while (true) {
      const { value, done } = await this.reader.read();
      if (done) break;

      const chunk = this.decoder.decode(value, { stream: true });
      this.accumulated = chunk;
      this.handleFunctionCall(chunk);

      this.socket.send(
        JSON.stringify({
          type: "chat:update",
          value: { text: this.getTextFromChunk(chunk) },
        })
      );
    }

    this.socket.send(
      JSON.stringify({
        type: "chat:done",
        value: { text: this.getTextFromChunk(this.accumulated) },
      })
    );
  }

  async start(conversation_id: string, agent_id: string) {
    const agentController = await getAgentController(
      this.context,
      new FunctionController(this.context),
      agent_id,
      this.sessionContext
    );

    const stream = await agentController.talkToAgent(conversation_id);

    this.streamToSocket(stream);
  }

  async stop() {
    if (this.reader) {
      await this.reader.cancel("Client requested stop");
      this.socket.send(JSON.stringify({ type: "chat:stopped", value: true }));
    }
  }

  async triggerFunctionCall(payload: ChatSocketMessage) {
    const agentController = await AgentController.create({
      context: this.context,
      functionController: new FunctionController(this.context),
      agentId: payload.agent_id,
      sessionContext: this.sessionContext,
    });

    await agentController.triggerFunctionCall(payload.payload);

    // this.socket.send(
    //   JSON.stringify({
    //     type: "chat:trigger_function_call",
    //     value: payload,
    //   })
    // );
  }
}
