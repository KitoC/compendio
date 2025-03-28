// ============================================
// EmailReceivedHandler.ts
// Handles 'process-email-received' task type
// ============================================

import { ITaskHandler } from "locals/interfaces/ITaskHandler";
import { PublicContext } from "locals/middleware/withPublicContext";
import type { ITask } from "../index";

export class EmailReceivedHandler implements ITaskHandler {
  async handle(payload: ITask, context: PublicContext): Promise<unknown> {
    // Example logic for processing an incoming email
    console.log("Processing email received:", payload);

    // TODO: Add email parsing, forwarding, saving to DB, etc.

    return { success: true };
  }
}
