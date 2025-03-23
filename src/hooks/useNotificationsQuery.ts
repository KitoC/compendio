
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Notification } from "@/types/notifications";

// Query keys for better cache management
export const QUERY_KEYS = {
  notifications: 'notifications',
};

export const useNotificationsQuery = () => {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.notifications, user?.id],
    queryFn: async () => {
      if (!user?.id || !tenantId) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id && !!tenantId,
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id || !tenantId) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .select();
      
      if (error) throw error;
      return data[0] as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications, user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update notification: ${error.message}`);
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id || !tenantId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .eq("is_read", false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications, user?.id] });
      toast.success("All notifications marked as read");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update notifications: ${error.message}`);
    },
  });

  // Set up real-time subscription
  const setupRealTimeSubscription = () => {
    if (!user?.id || !tenantId) return () => {};

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // When a new notification is inserted, show a toast and update the cache
          const newNotification = payload.new as Notification;
          toast.info(newNotification.message, {
            action: {
              label: "Mark as Read",
              onClick: () => markAsRead.mutate(notificationId),
            },
          });
          
          // Update the query cache with the new notification
          queryClient.setQueryData(
            [QUERY_KEYS.notifications, user.id],
            (old: Notification[] = []) => [newNotification, ...old]
          );
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    setupRealTimeSubscription,
  };
};
