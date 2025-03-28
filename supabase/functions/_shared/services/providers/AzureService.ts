import { BaseExternalService } from "locals/services/_BaseExternalService";

const BASE_URL = "https://graph.microsoft.com";

const ENDPOINTS = {
  MESSAGES: `${BASE_URL}/v1.0/me/messages`,
};

export class AzureService extends BaseExternalService {
  private accessToken: string | null;

  constructor() {
    super();
    this.accessToken = null;
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

  async getEmail(messageId: string) {
    const response = await fetch(
      `${ENDPOINTS.MESSAGES}/${messageId}?$select=subject,body,from,toRecipients,receivedDateTime,attachments,bodyPreview`,
      {
        method: "GET",
        headers: {
          ...this.headers,
          Prefer: 'outlook.body-content-type="text"',
        },
      }
    );

    const json = await response.json();

    if (!response.ok) {
      this.throwError("Failed to fetch message", json, 500);
    }

    return json;
  }
}
