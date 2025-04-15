import { getEnvKey } from "locals/utils/env";

// @ts-expect-error - djwt is not typed in Deno
import { create } from "djwt";

export class GoogleCloudHelper {
  private memoizedToken: string | null = null;
  private tokenExpiry: number | null = null;

  public async getServiceAccountAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    if (this.memoizedToken && this.tokenExpiry && now < this.tokenExpiry - 60) {
      return this.memoizedToken;
    }

    const raw = getEnvKey("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

    const creds = JSON.parse(raw);
    const payload = {
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/pubsub",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const header = { alg: "RS256", typ: "JWT" };

    const pemToArrayBuffer = (pem: string): ArrayBuffer => {
      const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\s+/g, "");
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    };

    const keyBuffer = pemToArrayBuffer(creds.private_key);
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const jwt = await create(header, payload, privateKey);

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("❌ Failed to get Google access token", json);
      throw new Error("Unable to get access token from service account");
    }

    this.memoizedToken = json.access_token;
    this.tokenExpiry = now + 3600;
    return json.access_token;
  }
}
