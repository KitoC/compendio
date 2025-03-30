import { AgentController } from "locals/controllers/AgentController";
import { FunctionController } from "locals/controllers/FunctionController";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";

export class ChatSocketHandler {
  private context: AuthenticatedContext;
  private socket: WebSocket;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private functionAlreadyCalled = false;
  private decoder = new TextDecoder();
  private accumulated = "";

  constructor(context: AuthenticatedContext, socket: WebSocket) {
    this.context = context;
    this.socket = socket;
  }

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

  async start(conversation_id: string, agent_id: string) {
    const agentController = await AgentController.create({
      context: this.context,
      functionController: new FunctionController(this.context),
      agentId: agent_id,
      sessionContext: {},
    });

    const stream = await agentController.talkToAgent(conversation_id);
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

  async stop() {
    if (this.reader) {
      await this.reader.cancel("Client requested stop");
      this.socket.send(JSON.stringify({ type: "chat:stopped", value: true }));
    }
  }
}
