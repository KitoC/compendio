export const streamResponse = ({
  externalReader,
  processStreamChunk,
  corsHeaders,
}: {
  externalReader: () => any;
  processStreamChunk: (chunk: Uint8Array) => any;
  corsHeaders: Record<string, string>;
}) => {
  // Process the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const reader = externalReader();

      if (!reader) {
        controller.error(new Error("Failed to get response reader"));
        return;
      }

      const pump = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          // Process the chunk
          const processedChunks = processStreamChunk(value);

          // Send each processed chunk to the client
          for (const chunk of processedChunks) {
            controller.enqueue(chunk);
          }

          // Continue pumping
          pump();
        } catch (error) {
          console.error("Error processing stream:", error);
          controller.error(error);
        }
      };

      await pump();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
};
