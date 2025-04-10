import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { MessageService } from "@/services/MessageService";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { MARKUP_BUILDER_MAP_ROLES } from "@/components/chat/MarkupBuilder";
import {
  EMAIL_STATUS_FILTER_KEY,
  EMAIL_STATUSES,
  PRIORITY_FILTER_KEY,
} from "@/components/chat/MarkupBuilder/EmailAgentMessage/consts";
import { useAiAgents } from "../AiAgents";

const DEFAULT_AGENT_FILTERS = {
  "email-assistant": {
    [PRIORITY_FILTER_KEY]: [3, 4],
    [EMAIL_STATUS_FILTER_KEY]: [EMAIL_STATUSES.draft.value],
  },
};

export const useInfiniteMessages = (conversationId) => {
  const { currentAgent } = useAiAgents();

  const [filter, setFilter] = useState(
    DEFAULT_AGENT_FILTERS[
      currentAgent?.name as keyof typeof DEFAULT_AGENT_FILTERS
    ] || {}
  );

  const limit = 20;
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["messages", conversationId, limit, filter],
      enabled: !!conversationId && !!currentAgent,
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        console.log("filter", filter);
        const query = {
          conversation_id: conversationId,
          order: "created_at",
          sort_direction: "desc",

          limit: String(limit),
          offset: String(pageParam),
          filter: JSON.stringify(filter),
        };

        const loaded = await MessageService.getMessages(conversationId, query);

        return loaded.messages || [];
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < limit) return undefined; // No more pages
        return allPages.flat().length;
      },
      // select: (data) => ({
      //   pages: [...data.pages].reverse(),
      //   pageParams: [...data.pageParams].reverse(),
      // }),
    });

  const messages = data?.pages.flat().slice().reverse() ?? [];

  const addMessage = useCallback(
    async (message, scrollToBottom?: boolean) => {
      let newLength = 0;

      await queryClient.setQueryData(
        ["messages", conversationId],
        (oldData: InfiniteData<ChatMessage[]>) => {
          if (!oldData) return;

          const pages = [
            [message, ...oldData.pages[0]],
            ...oldData.pages.slice(1),
          ];

          newLength = pages.flat().length;

          return {
            pageParams: oldData.pageParams,
            pages,
          };
        }
      );
    },
    [conversationId, queryClient]
  );

  const updateMessage = useCallback(
    (message) => {
      queryClient.setQueryData(
        ["messages", conversationId],
        (oldData: InfiniteData<ChatMessage[]>) => {
          if (!oldData) return;

          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((msg) => (msg.id === message.id ? message : msg))
            ),
          };
        }
      );
    },
    [conversationId, queryClient]
  );

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          addMessage(newMessage);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const updatedMessage = await MessageService.getMessageById(
            payload.new.id
          );

          updateMessage(updatedMessage);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, addMessage, updateMessage]);

  const filteredMessages = messages
    .filter((message) =>
      ["user", "assistant", ...MARKUP_BUILDER_MAP_ROLES].includes(message.role)
    )
    .filter((fm) => !fm.reply_to);

  return {
    messages,
    loadMessages: fetchNextPage,
    hasMore: hasNextPage,
    isFetchingMore: isFetchingNextPage,
    addMessage,
    updateMessage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    filteredMessages,
    filter,
    setFilter,
  };
};
