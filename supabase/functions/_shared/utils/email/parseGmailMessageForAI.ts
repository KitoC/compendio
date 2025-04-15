function decodeBase64Url(data: string): string {
  return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
}

function extractHeaderValue(
  headers: { name: string; value: string }[],
  name: string
): string | undefined {
  const found = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return found?.value;
}

interface IMessagePayloadPart {
  mimeType: string;
  body?: { data?: string };
  parts?: unknown[];
}

interface IMessagePayload {
  mimeType: string;
  body?: { data?: string };
  parts?: IMessagePayloadPart[];
  headers: { name: string; value: string }[];
}

interface IMessage {
  payload: IMessagePayload;
  threadId: string;
  snippet: string;
}

function extractEmailBody(payload: IMessagePayload): {
  html?: string;
  text?: string;
} {
  const decode = (data?: string) => (data ? decodeBase64Url(data) : undefined);

  const findPart = (
    part: IMessagePayloadPart,
    mimeType: string
  ): string | undefined => {
    if (part.mimeType === mimeType && part.body?.data) {
      return decode(part.body.data);
    }
    if (part.parts) {
      for (const p of part.parts) {
        const result = findPart(p as IMessagePayloadPart, mimeType);
        if (result) return result;
      }
    }
    return undefined;
  };

  return {
    html: findPart(payload, "text/html"),
    text: findPart(payload, "text/plain"),
  };
}

export function parseGmailMessageForAI(message: IMessage): {
  from?: string;
  to?: string;
  cc?: string;
  subject?: string;
  date?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  threadId: string;
  bodyHtml?: string;
  bodyText?: string;
} {
  const headers = message.payload?.headers || [];
  const body = extractEmailBody(message.payload || {});

  return {
    from: extractHeaderValue(headers, "From"),
    to: extractHeaderValue(headers, "To"),
    cc: extractHeaderValue(headers, "Cc"),
    subject: extractHeaderValue(headers, "Subject"),
    date: extractHeaderValue(headers, "Date"),
    messageId: extractHeaderValue(headers, "Message-ID"),
    inReplyTo: extractHeaderValue(headers, "In-Reply-To"),
    references: extractHeaderValue(headers, "References"),
    threadId: message.threadId,
    bodyHtml: body.html,
    bodyText: body.text ?? message.snippet, // fallback to snippet if no plain text
  };
}
