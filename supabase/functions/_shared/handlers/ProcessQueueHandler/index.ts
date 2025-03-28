import { getEnvKey } from "locals/utils/env";
import { PublicContext } from "locals/middleware/withPublicContext";
import Logger from "locals/utils/Logger";
import { ProcessQueueError } from "locals/error-types";
import { EmailReceivedHandler } from "@/queue/tasks/EmailReceivedHandler";
import { ITaskHandler } from "locals/interfaces/ITaskHandler";

export const PROCESS_QUEUE_ACTIONS = {
  PROCESS_EMAIL_RECEIVED: "process_email_received",
} as const;

export interface ITask {
  id: string;
  action: string;
  payload: JSON;
  status: "pending" | "failed" | "passed";
  error?: string;
}

type TaskResult = {
  error?: ProcessQueueError;
  result?: unknown;
};

export class ProcessQueueHandler {
  private logger: Logger;
  private handlers: Record<string, ITaskHandler>;

  constructor(public context: PublicContext, public batchSize: number = 5) {
    this.logger = new Logger({ name: "ProcessQueueHandler" });

    this.handlers = {
      [PROCESS_QUEUE_ACTIONS.PROCESS_EMAIL_RECEIVED]: new EmailReceivedHandler(
        context
      ),
      // Add more here
    };
  }

  async handle(req: Request, context: PublicContext) {
    const { _task_id } = await req.json();
    const _encryption_key = getEnvKey("ENCRYPTION_KEY");

    const fetchArgs = { _encryption_key, _batch_size: this.batchSize };
    if (_task_id) Object.assign(fetchArgs, { _task_id });

    const { data: tasks, error } = await context.supabase.rpc(
      "get_next_decrypted_function_tasks",
      fetchArgs
    );

    if (error) this.throwError("Error fetching tasks", error);

    // const tasks = [
    //   {
    //     id: "0f6538cc-0b18-4e05-8e00-d07931cbbe6b",
    //     action: "process_email_received",
    //     status: "processing",
    //     payload: JSON.stringify({
    //       agentId: "d32fa9df-957a-482c-acc0-8a2b7f112ca5",
    //       connected_service_id: "81c8ddc9-7332-4bd5-90bd-37136200e153",
    //       email_event: {
    //         e_tag: "",
    //         email_id:
    //           "AQMkADAwATMwMAExLThmN2YtMjc2YS0wMAItMDAKAEYAAAOe26MAYzW5R7qU8QnjLgX9BwD1ptvIt132TZZIts-lBHnCAAACAQwAAAD1ptvIt132TZZIts-lBHnCAAAABMgwQQAAAA==",
    //       },
    //       provider: "azure",
    //       tenant_id: "24d940cf-490c-4806-a46f-e995132d0883",
    //     }),
    //     priority: "medium",
    //     created_at: "2025-03-28T16:40:09.065166+00:00",
    //   },
    // ];

    const results: TaskResult[] = await Promise.all(
      tasks.map(async (task: ITask) => {
        const parsedPayload = JSON.parse(task.payload as unknown as string);
        const result = await this.routeTask(
          { ...task, payload: parsedPayload },
          context
        );

        // Auto-mark status
        if (result?.error) {
          await context.supabase.rpc("mark_function_task_failed", {
            _id: task.id,
            _error: result.error.message || "Unknown error",
          });
        } else {
          await context.supabase.rpc("mark_function_task_passed", {
            _id: task.id,
          });
        }

        return result;
      })
    );

    return {
      failed: results.filter((result) => result?.error).length,
      passed: results.filter((result) => !result?.error).length,
    };
  }

  async routeTask(task: ITask, context: PublicContext): Promise<TaskResult> {
    const { action, payload } = task;

    const handler = this.handlers[action];

    if (!handler) {
      return {
        error: new ProcessQueueError(
          this.constructor.name,
          `Unknown action: ${action}`,
          400
        ),
      };
    }

    try {
      return {
        result: await handler.handle(payload, context),
      };
    } catch (e) {
      return {
        error: new ProcessQueueError(
          this.constructor.name,
          `Error processing task: ${action}`,
          500,
          e
        ),
      };
    }
  }

  throwError(message: string, errorOrStatus: object | number, status = 401) {
    const name = this.constructor.name;

    if (typeof errorOrStatus === "object") {
      this.logger.throwAndLog(
        new ProcessQueueError(name, message, status, errorOrStatus)
      );
    } else {
      this.logger.throwAndLog(
        new ProcessQueueError(name, message, errorOrStatus)
      );
    }
  }
}
