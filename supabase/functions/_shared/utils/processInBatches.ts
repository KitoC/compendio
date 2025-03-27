interface ProcessInBatchesOptions<T, R> {
  items: T[];
  batchSize: number;
  processor: (item: T, index: number) => Promise<R>;
}

type Success<T, R> = { item: T; result: R };
type Failed<T> = { item: T; error: unknown };

type Result<T, R> = Promise<{
  success: Success<T, R>[];
  failed: Failed<T>[];
}>;

export async function processInBatches<T, R>({
  items,
  batchSize,
  processor,
}: ProcessInBatchesOptions<T, R>): Result<T, R> {
  const success: Success<T, R>[] = [];
  const failed: Failed<T>[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((item, idx) => processor(item, i + idx))
    );

    results.forEach((result, idx) => {
      const item = batch[idx];

      if (result.status === "fulfilled") {
        success.push({ item, result: result.value });
      } else {
        failed.push({
          item,
          error: result,
        });
      }
    });
  }

  return { success, failed };
}
