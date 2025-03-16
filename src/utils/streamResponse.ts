export const streamResponse = async (
  response: Response,
  onContentReady: (content: string) => void
) => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = new TextDecoder().decode(value);

    onContentReady(chunk);
  }
};
