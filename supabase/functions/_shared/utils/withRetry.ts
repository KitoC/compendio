interface ResponseError extends Error {
  response?: Response;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    retryOn?: (error: any, response?: Response) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    retryOn = (error, res) => {
      if (!res) return false;

      return !res?.ok && (res?.status >= 500 || res?.status === 429);
    },
  } = options;

  let attempt = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastError: any;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const result = await fn();

      return result; // 🎉 Success!
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (error as any)?.response;

      if (!retryOn(error, res) || attempt === maxAttempts) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
      const jitter = Math.floor(Math.random() * 200); // Add jitter
      const totalDelay = delay + jitter;

      console.warn(`🔁 Retry attempt ${attempt} after ${totalDelay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, totalDelay));

      lastError = error;
    }
  }

  throw lastError;
}
