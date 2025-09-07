import { useState, useEffect } from 'react';

interface DashboardStats {
    totalStock: number;
    totalProducts: number;
    totalCategories: number;
    totalBranches: number;
    lowStockCount: number;
    outOfStockCount: number;
    recentActivity: number;
    lastUpdated: string;
}

interface UseDashboardStatsOptions {
    branchId?: string | number;
    refreshInterval?: number; // in milliseconds
    enabled?: boolean;
}

export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
    const { branchId, refreshInterval = 300000, enabled = true } = options; // Default 5 minutes
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);

    const fetchStats = async (forceRefresh = false) => {
        if (!enabled) return;

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

            const params = new URLSearchParams();
            if (branchId) {
                params.append('branch_id', branchId.toString());
            }

            const response = await fetch(`http://localhost:5000/api/dashboard/stats?${params}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch dashboard statistics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [branchId, enabled]);

    useEffect(() => {
        if (!enabled || !refreshInterval) return;

        const interval = setInterval(fetchStats, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval, enabled]);

    return {
        stats,
        isLoading,
        error,
        refetch: () => fetchStats(true) // Force refresh when manually triggered
    };
}
