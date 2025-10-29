import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config/config";

interface UseBranchRequestCountsOptions {
  userId?: string;
  branchId?: number;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

export function useBranchRequestCounts(
  options: UseBranchRequestCountsOptions = {}
) {
  const {
    userId,
    branchId,
    refreshInterval = 300000,
    enabled = true,
  } = options; // Default 5 minutes
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [transferredCount, setTransferredCount] = useState<number>(0);
  const [requestedCount, setRequestedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchCounts = useCallback(
    async (forceRefresh = false) => {
      if (!enabled || !userId || !branchId) return;

      // Prevent too frequent requests (minimum 30 seconds between requests)
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      const minInterval = 30000; // 30 seconds minimum

      if (!forceRefresh && timeSinceLastFetch < minInterval) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setLastFetchTime(now);

        // Fetch pending requests count
        const pendingResponse = await fetch(
          `${API_BASE_URL}/api/product-requests/pending/${userId}`
        );

        if (!pendingResponse.ok) {
          throw new Error(
            `Failed to fetch pending requests count: ${pendingResponse.statusText}`
          );
        }

        const pendingData = await pendingResponse.json();
        setPendingCount(pendingData.length);

        // Fetch transferred items count
        const transferredResponse = await fetch(
          `${API_BASE_URL}/api/transfers/${branchId}`
        );

        if (!transferredResponse.ok) {
          throw new Error(
            `Failed to fetch transferred items count: ${transferredResponse.statusText}`
          );
        }

        const transferredData = await transferredResponse.json();
        // Count unique request IDs for transferred items
        const uniqueRequestIds = new Set(
          transferredData.map((item: any) => item.request_id)
        );
        setTransferredCount(uniqueRequestIds.size);

        // Fetch requested items count
        const requestedResponse = await fetch(
          `${API_BASE_URL}/api/product-requests/sent/${userId}`
        );

        if (!requestedResponse.ok) {
          throw new Error(
            `Failed to fetch requested items count: ${requestedResponse.statusText}`
          );
        }

        const requestedData = await requestedResponse.json();
        // Only count pending requests for notification
        const pendingRequests = requestedData.filter(
          (request: any) => request.status === "pending"
        );
        setRequestedCount(pendingRequests.length);
      } catch (err) {
        console.error("Error fetching branch request counts:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch branch request counts"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, userId, branchId, lastFetchTime]
  );

  useEffect(() => {
    fetchCounts();
  }, [userId, branchId, enabled]);

  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    const interval = setInterval(fetchCounts, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, enabled, fetchCounts]);

  const totalCount = pendingCount + transferredCount + requestedCount;

  return {
    pendingCount,
    transferredCount,
    requestedCount,
    totalCount,
    isLoading,
    error,
    refetch: () => fetchCounts(true), // Force refresh when manually triggered
  };
}
