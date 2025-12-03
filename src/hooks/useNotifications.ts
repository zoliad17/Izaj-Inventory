import { useCallback, useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../config/config";
import { getSupabaseClient } from "../lib/supabaseClient";

export interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  link?: string;
  type?: string;
  read?: boolean;
  metadata?: any;
  created_at?: string;
}

interface UseNotificationsOptions {
  pollInterval?: number; // ms, default 30000
  enabled?: boolean;
  // If your app uses Bearer tokens instead of cookie-based auth, pass getToken to return the token string
  getToken?: () => string | null;
  // User ID for authentication (required for backend authentication)
  userId?: string | null;
  // If true and SUPABASE env vars are present, the hook will attempt to subscribe to realtime updates
  realtime?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    pollInterval = 30000,
    enabled = true,
    getToken,
    userId,
    realtime = true,
  } = options;
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchUnread = useCallback(async () => {
    if (!userId) return; // Skip if no user ID provided
    
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      // Support optional Bearer token
      const token = getToken ? getToken() : null;
      const fetchOptions: RequestInit = token
        ? { headers: { Authorization: `Bearer ${token}`, ...headers } }
        : { credentials: "include", headers };

      // Call the unread endpoint with user_id as query parameter for authentication
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/unread/me?user_id=${encodeURIComponent(userId)}`,
        fetchOptions as RequestInit
      );
      if (!res.ok) throw new Error("Failed to fetch unread count");
      const json = await res.json();
      if (!mounted.current) return;
      setUnreadCount(json.count || 0);
    } catch (err: any) {
      console.error("useNotifications.fetchUnread:", err);
      if (!mounted.current) return;
      setError(err.message || String(err));
    }
  }, [getToken, userId]);

  const fetchList = useCallback(async (limit = 20, offset = 0) => {
    if (!userId) return; // Skip if no user ID provided
    
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = getToken ? getToken() : null;
      const fetchOptions: RequestInit = token
        ? { headers: { Authorization: `Bearer ${token}`, ...headers } }
        : { credentials: "include", headers };

      const res = await fetch(
        `${API_BASE_URL}/api/notifications?limit=${limit}&offset=${offset}&user_id=${encodeURIComponent(userId)}`,
        fetchOptions
      );
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const json = await res.json();
      if (!mounted.current) return;
      setNotifications(json.notifications || []);
    } catch (err: any) {
      console.error("useNotifications.fetchList:", err);
      if (!mounted.current) return;
      setError(err.message || String(err));
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [getToken, userId]);

  const markRead = useCallback(
    async (ids?: string[], link?: string) => {
      if (!userId) return; // Skip if no user ID provided
      
      try {
        const body: any = { user_id: userId };
        if (link) body.link = link;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const token = getToken ? getToken() : null;
        const fetchOptions: RequestInit = token
          ? {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}`, ...headers },
              body: JSON.stringify(body),
            }
          : {
              method: "PUT",
              credentials: "include",
              headers,
              body: JSON.stringify(body),
            };

        // server derives user from auth; ids not currently supported by API
        await fetch(
          `${API_BASE_URL}/api/notifications/mark-read`,
          fetchOptions
        );
        // update local state conservatively
        if (link) {
          setNotifications((prev) =>
            prev.map((n) => (n.link === link ? { ...n, read: true } : n))
          );
        } else if (ids && ids.length > 0) {
          setNotifications((prev) =>
            prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
          );
        } else {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
        // refresh unread count
        fetchUnread();
      } catch (err) {
        console.error("useNotifications.markRead:", err);
      }
    },
    [fetchUnread]
  );

  const markAllRead = useCallback(async () => {
    await markRead(undefined, undefined);
  }, [markRead]);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return;
    // initial load
    fetchUnread();
    fetchList();

    let interval: any = null;
    if (realtime) {
      // attempt to wire Supabase realtime subscription for instant updates
      (async () => {
        try {
          const supabase = await getSupabaseClient();
          if (!supabase) {
            // fallback to polling when no client or env not provided
            interval = setInterval(() => fetchUnread(), pollInterval);
            return;
          }

          // Use userId from options if provided, otherwise derive via api/whoami
          let currentUserId: string | null = userId || null;
          if (!currentUserId) {
            try {
              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };
              const token = getToken ? getToken() : null;
              const fetchOptions: RequestInit = token
                ? { headers: { Authorization: `Bearer ${token}`, ...headers } }
                : { credentials: "include", headers };
              // Note: whoami endpoint requires user_id in query params for authentication
              // If userId is not provided in options, we can't authenticate, so skip realtime
              if (userId) {
                const whoami = await fetch(
                  `${API_BASE_URL}/api/whoami?user_id=${encodeURIComponent(userId)}`,
                  fetchOptions as RequestInit
                );
                if (whoami.ok) {
                  const json = await whoami.json();
                  currentUserId = json.user_id || null;
                }
              }
            } catch (e) {
              // ignore — we may still subscribe via RLS or public channels
            }
          }

          if (!currentUserId) {
            // Unable to derive current user id; skip realtime subscription to avoid receiving unrelated rows
            console.warn(
              "useNotifications: could not determine current user id; realtime disabled"
            );
            interval = setInterval(() => fetchUnread(), pollInterval);
          } else {
            const filter = `user_id=eq.${currentUserId}`;
            const channel = supabase
              .channel(`notifications:user:${currentUserId}`)
              .on(
                "postgres_changes",
                {
                  event: "INSERT",
                  schema: "public",
                  table: "notifications",
                  filter,
                },
                (payload: any) => {
                  try {
                    const newRow = payload.new as any;
                    // Only update when notification is for current user
                    if (newRow.user_id === currentUserId) {
                      setUnreadCount((prev) => prev + 1);
                      setNotifications((prev) => [newRow, ...prev]);
                    }
                  } catch (e) {
                    console.error("Supabase subscription handler error", e);
                  }
                }
              );

            await channel.subscribe();
          }
        } catch (err) {
          console.warn("Realtime subscription not available:", err);
          // fallback to polling
          interval = setInterval(() => fetchUnread(), pollInterval);
        }
      })();
    } else {
      interval = setInterval(() => fetchUnread(), pollInterval);
    }

    return () => {
      mounted.current = false;
      if (interval) clearInterval(interval);
    };
  }, [enabled, pollInterval, fetchList, fetchUnread, getToken, realtime]);

  return {
    unreadCount,
    notifications,
    isLoading,
    error,
    refresh: () => {
      fetchUnread();
      fetchList();
    },
    fetchList,
    markRead,
    markAllRead,
  };
}

export default useNotifications;
