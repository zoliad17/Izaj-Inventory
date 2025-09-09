import { useState, useEffect, useCallback } from 'react';

interface UsePendingRequestsCountOptions {
    userId?: string;
    refreshInterval?: number; // in milliseconds
    enabled?: boolean;
}

export function usePendingRequestsCount(options: UsePendingRequestsCountOptions = {}) {
    const { userId, refreshInterval = 300000, enabled = true } = options; // Default 5 minutes
    const [count, setCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);

    const fetchCount = useCallback(async (forceRefresh = false) => {
        if (!enabled || !userId) return;

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

            const response = await fetch(
                `http://localhost:5000/api/product-requests/pending/${userId}`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch pending requests count: ${response.statusText}`);
            }

            const data = await response.json();
            setCount(data.length);
        } catch (err) {
            console.error('Error fetching pending requests count:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch pending requests count');
        } finally {
            setIsLoading(false);
        }
    }, [enabled, userId, lastFetchTime]);

    useEffect(() => {
        fetchCount();
    }, [userId, enabled]);

    useEffect(() => {
        if (!enabled || !refreshInterval) return;

        const interval = setInterval(fetchCount, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval, enabled, fetchCount]);

    return {
        count,
        isLoading,
        error,
        refetch: () => fetchCount(true) // Force refresh when manually triggered
    };
}
