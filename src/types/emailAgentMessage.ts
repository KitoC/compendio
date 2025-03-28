export interface NormalizedEmailThreadItem {
  body: string;
  from: string;
  timestamp: string; // ISO 8601
}

export interface NormalizedEmailReceived {
  from: string;
  to: string;
  subject: string;
  latest_message: NormalizedEmailThreadItem;
  thread: NormalizedEmailThreadItem[];
}

export interface NormalizedEmailDrafted {
  body: string;
  to: string;
}

export interface NormalizedEmailResponse {
  email_drafted?: NormalizedEmailDrafted | null;
  email_id: string;
  email_received: NormalizedEmailReceived;
  email_thread_id: string;
  event: "email_received" | "email_drafted" | "both";
  provider: "outlook" | "gmail";
  reasoning: string;
}
