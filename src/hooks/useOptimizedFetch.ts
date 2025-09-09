// Custom hook for optimized data fetching with caching and memoization
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/apiClient';

interface UseOptimizedFetchOptions<T> {
    initialData?: T;
    enabled?: boolean;
    refetchOnMount?: boolean;
    staleTime?: number; // Time in milliseconds before data is considered stale
    cacheTime?: number; // Time in milliseconds to keep data in cache
    retry?: boolean;
    retryCount?: number;
    retryDelay?: number;
}

interface UseOptimizedFetchReturn<T> {
    data: T | null;
    error: string | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    refetch: () => Promise<void>;
    invalidate: () => void;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

const getCacheKey = (endpoint: string, params?: any): string => {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${endpoint}${paramsString}`;
};

const isDataStale = (timestamp: number, staleTime: number): boolean => {
    return Date.now() - timestamp > staleTime;
};

export function useOptimizedFetch<T>(
    fetchFn: () => Promise<{ data: T | null; error: string | null }>,
    options: UseOptimizedFetchOptions<T> = {}
): UseOptimizedFetchReturn<T> {
    const {
        initialData = null,
        enabled = true,
        refetchOnMount = true,
        staleTime = 5 * 60 * 1000, // 5 minutes default
        cacheTime = 30 * 60 * 1000, // 30 minutes default
        retry = true,
        retryCount = 3,
        retryDelay = 1000
    } = options;

    const [data, setData] = useState<T | null>(initialData);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryAttempts, setRetryAttempts] = useState(0);

    const fetchFnRef = useRef(fetchFn);
    const cacheKeyRef = useRef<string | null>(null);

    // Update refs when dependencies change
    useEffect(() => {
        fetchFnRef.current = fetchFn;
    }, [fetchFn]);

    const fetchData = useCallback(async (force = false) => {
        if (!enabled) return;

        const currentFetchFn = fetchFnRef.current;
        if (!currentFetchFn) return;

        // Generate cache key based on function name or endpoint
        const fnString = currentFetchFn.toString();
        const cacheKey = getCacheKey(fnString);
        cacheKeyRef.current = cacheKey;

        // Check cache first (unless force refresh)
        if (!force && cache.has(cacheKey)) {
            const cached = cache.get(cacheKey)!;
            if (!isDataStale(cached.timestamp, cached.staleTime)) {
                setData(cached.data);
                setError(null);
                return;
            }
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await currentFetchFn();

            if (result.error) {
                throw new Error(result.error);
            }

            setData(result.data);
            setError(null);
            setRetryAttempts(0);

            // Cache the result
            cache.set(cacheKey, {
                data: result.data,
                timestamp: Date.now(),
                staleTime
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            setData(null);

            // Retry logic
            if (retry && retryAttempts < retryCount) {
                setTimeout(() => {
                    setRetryAttempts(prev => prev + 1);
                    fetchData(force);
                }, retryDelay * Math.pow(2, retryAttempts)); // Exponential backoff
            }
        } finally {
            setIsLoading(false);
        }
    }, [enabled, staleTime, retry, retryCount, retryDelay, retryAttempts]);

    // Refetch function
    const refetch = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    // Invalidate cache
    const invalidate = useCallback(() => {
        if (cacheKeyRef.current) {
            cache.delete(cacheKeyRef.current);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        if (enabled && refetchOnMount) {
            fetchData();
        }
    }, [enabled, refetchOnMount, fetchData]);

    // Cleanup old cache entries
    useEffect(() => {
        const cleanup = () => {
            const now = Date.now();
            for (const [key, value] of cache.entries()) {
                if (now - value.timestamp > cacheTime) {
                    cache.delete(key);
                }
            }
        };

        const interval = setInterval(cleanup, 5 * 60 * 1000); // Cleanup every 5 minutes
        return () => clearInterval(interval);
    }, [cacheTime]);

    const isError = !!error;
    const isSuccess = !isLoading && !error && data !== null;

    return {
        data,
        error,
        isLoading,
        isError,
        isSuccess,
        refetch,
        invalidate
    };
}

// Specialized hooks for common API patterns
export function useProducts(branchId: number | null, options?: UseOptimizedFetchOptions<any[]>) {
    const fetchFn = useCallback(() => {
        if (!branchId) return Promise.resolve({ data: null, error: 'Branch ID is required' });
        return api.getProducts(branchId);
    }, [branchId]);

    return useOptimizedFetch(fetchFn, {
        staleTime: 2 * 60 * 1000, // 2 minutes for products
        ...options
    });
}

export function useCategories(options?: UseOptimizedFetchOptions<any[]>) {
    const fetchFn = useCallback(() => api.getCategories(), []);

    return useOptimizedFetch(fetchFn, {
        staleTime: 10 * 60 * 1000, // 10 minutes for categories (rarely change)
        ...options
    });
}

export function useBranches(options?: UseOptimizedFetchOptions<any[]>) {
    const fetchFn = useCallback(() => api.getBranches(), []);

    return useOptimizedFetch(fetchFn, {
        staleTime: 15 * 60 * 1000, // 15 minutes for branches (rarely change)
        ...options
    });
}

export function useAuditLogs(params?: any, options?: UseOptimizedFetchOptions<any>) {
    const fetchFn = useCallback(() => api.getAuditLogs(params), [params]);

    return useOptimizedFetch(fetchFn, {
        staleTime: 1 * 60 * 1000, // 1 minute for audit logs
        ...options
    });
}

// Hook for paginated data
export function usePaginatedData<T>(
    fetchFn: (page: number, limit: number) => Promise<{ data: T | null; error: string | null }>,
    page: number = 1,
    limit: number = 10,
    options?: UseOptimizedFetchOptions<T>
) {
    const fetchData = useCallback(() => {
        return fetchFn(page, limit);
    }, [fetchFn, page, limit]);

    return useOptimizedFetch(fetchData, {
        staleTime: 30 * 1000, // 30 seconds for paginated data
        ...options
    });
}

// Hook for real-time data that needs frequent updates
export function useRealtimeData<T>(
    fetchFn: () => Promise<{ data: T | null; error: string | null }>,
    interval: number = 30000, // 30 seconds default
    options?: UseOptimizedFetchOptions<T>
) {
    const result = useOptimizedFetch(fetchFn, {
        staleTime: 0, // Always consider stale for real-time data
        ...options
    });

    useEffect(() => {
        if (!options?.enabled) return;

        const intervalId = setInterval(() => {
            result.refetch();
        }, interval);

        return () => clearInterval(intervalId);
    }, [interval, result.refetch, options?.enabled]);

    return result;
}
