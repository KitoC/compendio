import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Loader from "@/components/ui/loader";

export const useVirtuoso = ({
  messages,
  isFetchingMore,
  isLoading,
  loadMessages,
}) => {
  const [firstItemIndex, setFirstItemIndex] = useState(null);
  const virtuosoRef = useRef(null);

  const previousMessageCount = useRef(0);
  const previousIsFetchingMore = useRef(false);
  const justPrepended = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const currentCount = messages.length;
    const previousCount = previousMessageCount.current;
    const hasFetchedMore = previousIsFetchingMore.current;

    const addedCount = currentCount - previousCount;

    const isPrepending = hasFetchedMore && addedCount > 0;

    if (isPrepending) {
      // When NOT reversing pages, new pages go at the END,
      // so if you're prepending manually (e.g. via flat().reverse()),
      // adjust firstItemIndex accordingly
      setFirstItemIndex((prev) => prev - addedCount);
    }

    previousMessageCount.current = currentCount;
    previousIsFetchingMore.current = isFetchingMore;
    justPrepended.current = isPrepending;
  }, [messages.length, isFetchingMore, isLoading]);

  useEffect(() => {
    if (!justPrepended.current) {
      virtuosoRef?.current?.scrollToIndex(messages.length - 1, {
        align: "start",
        offset: 100,
      });
    }
  }, [messages.length]);

  const filteredMessagesLength = useMemo(() => messages.length, [messages]);

  useEffect(() => {
    if (!isLoading && firstItemIndex === null) {
      setFirstItemIndex(-(filteredMessagesLength - 1));
    }
  }, [filteredMessagesLength, isLoading, firstItemIndex]);

  const initialTopMostItemIndex = messages.length - 1;

  return {
    firstItemIndex,
    virtuosoRef,
    initialTopMostItemIndex,
    ref: virtuosoRef,
    data: messages,
    startReached: loadMessages,
    components: {
      Header: () =>
        isFetchingMore ? (
          <div className="flex justify-center items-center w-full p-2">
            <Loader size="large" />
          </div>
        ) : null,
      Footer: () => <div className="h-10" />,
    },
  };
};
