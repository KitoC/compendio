import { IEmailEvent } from "@/handlers/WebhookEventHandler";
import { BaseExternalService } from "@/services/_BaseExternalService";

const BASE_URL = "https://gmail.googleapis.com";

const ENDPOINTS = {
  SEND_MAIL: `${BASE_URL}/v1.0/me/sendMail`,
  HISTORY: `${BASE_URL}/gmail/v1/users/me/history`,
  MESSAGES: `${BASE_URL}/gmail/v1/users/me/messages`,
  THREADS: `${BASE_URL}/gmail/v1/users/me/threads`,
};

export class GmailService extends BaseExternalService {
  private accessToken: string | null;

  constructor() {
    super();
    this.accessToken = null;
  }

  get emailNormalizationConfig() {
    return {
      provider: "gmail",
      messages: "Latest message is the most recent message in the thread.",
      thread_id_field: "threadId",
    };
  }

  get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getThread(threadId: string) {
    const response = await fetch(
      `${ENDPOINTS.THREADS}/${threadId}?format=full`,
      {
        method: "GET",
        headers: {
          ...this.headers,
        },
      }
    );

    const json = await response.json();

    if (!response.ok) {
      this.throwError("Failed to fetch message", json, 500);
    }

    return json;
  }

  async getEmail(emailEvent: IEmailEvent) {
    const response = await fetch(
      `${ENDPOINTS.MESSAGES}/${emailEvent.email_id}?format=full`,
      {
        method: "GET",
        headers: {
          ...this.headers,
        },
      }
    );

    const json = await response.json();

    if (!response.ok) {
      this.throwError("Failed to fetch message", json, 500);
    }

    return json;
  }

  async getHistory(historyId: string) {
    const response = await fetch(
      `${ENDPOINTS.HISTORY}?startHistoryId=${historyId}`,
      {
        method: "GET",
        headers: {
          ...this.headers,
        },
      }
    );

    const json = await response.json();

    if (!response.ok) {
      this.throwError("Failed to fetch message", json, 500);
    }

    return json;
  }

  async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
    contentType?: "HTML" | "Text";
  }) {
    const payload = {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    const response = await fetch(ENDPOINTS.SEND_MAIL, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to send email", json, 500);
    }

    return response;
  }

  async replyToEmail({
    originalMessageId,
    replyBody,
  }: {
    originalMessageId: string;
    replyBody: string;
    contentType?: "HTML" | "Text";
  }) {
    // Step 1: Create the reply draft
    const createReplyResponse = await fetch(
      `${BASE_URL}/v1.0/me/messages/${originalMessageId}/createReply`,
      {
        method: "POST",
        headers: this.headers,
      }
    );

    if (!createReplyResponse.ok) {
      const error = await createReplyResponse.json();
      this.throwError("Failed to create reply draft", error, 500);
    }

    const draft = await createReplyResponse.json();

    // Step 2: Update the draft message with content
    const updateResponse = await fetch(
      `${BASE_URL}/v1.0/me/messages/${draft.id}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          body: {
            contentType: "HTML",
            content: replyBody,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      this.throwError("Failed to update reply message", error, 500);
    }

    // Step 3: Send the reply
    const sendResponse = await fetch(
      `${BASE_URL}/v1.0/me/messages/${draft.id}/send`,
      {
        method: "POST",
        headers: this.headers,
      }
    );

    if (!sendResponse.ok) {
      const error = await sendResponse.json();
      this.throwError("Failed to send reply", error, 500);
    }

    return sendResponse;
  }
}
