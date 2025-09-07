import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../utils/apiClient';
import { useErrorHandler } from '../utils/errorHandler';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure storage utilities with persistence
class SecureStorage {
    private static instance: SecureStorage;
    private memoryStorage: Map<string, { value: any; expiry: number }> = new Map();
    private readonly STORAGE_PREFIX = 'izaj_inventory_';

    private constructor() {
        // Clean up expired entries every 5 minutes
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }

    public static getInstance(): SecureStorage {
        if (!SecureStorage.instance) {
            SecureStorage.instance = new SecureStorage();
        }
        return SecureStorage.instance;
    }

    private cleanupExpiredEntries(): void {
        const now = Date.now();

        // Clean memory storage
        for (const [key, data] of this.memoryStorage.entries()) {
            if (data.expiry < now) {
                this.memoryStorage.delete(key);
            }
        }

        // Clean localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.STORAGE_PREFIX)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.expiry && parsed.expiry < now) {
                                localStorage.removeItem(key);
                            }
                        } catch {
                            localStorage.removeItem(key);
                        }
                    }
                }
            });
        } catch (error) {
            console.warn('localStorage cleanup failed:', error);
        }
    }

    setItem(key: string, value: any, ttl: number = 24 * 60 * 60 * 1000): void {
        const expiry = Date.now() + ttl;
        const data = { value, expiry };

        // Store in memory for fast access
        this.memoryStorage.set(key, data);

        // Store in localStorage for persistence
        try {
            localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(data));
        } catch (error) {
            console.warn('localStorage setItem failed:', error);
        }
    }

    getItem(key: string): any | null {
        // Try memory first (faster)
        const memoryData = this.memoryStorage.get(key);
        if (memoryData && memoryData.expiry > Date.now()) {
            return memoryData.value;
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
            if (stored) {
                const data = JSON.parse(stored);
                if (data.expiry > Date.now()) {
                    // Update memory cache
                    this.memoryStorage.set(key, data);
                    return data.value;
                } else {
                    // Expired, remove it
                    localStorage.removeItem(this.STORAGE_PREFIX + key);
                }
            }
        } catch (error) {
            console.warn('localStorage getItem failed:', error);
        }

        return null;
    }

    removeItem(key: string): void {
        this.memoryStorage.delete(key);
        try {
            localStorage.removeItem(this.STORAGE_PREFIX + key);
        } catch (error) {
            console.warn('localStorage removeItem failed:', error);
        }
    }

    clear(): void {
        this.memoryStorage.clear();
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('localStorage clear failed:', error);
        }
    }
}

const secureStorage = SecureStorage.getInstance();

// Session management
class SessionManager {
    private static instance: SessionManager;
    private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours
    private refreshTimeout: NodeJS.Timeout | null = null;

    private constructor() { }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    setSession(user: User): void {
        secureStorage.setItem('user', user, this.sessionTimeout);
        secureStorage.setItem('isAuthenticated', true, this.sessionTimeout);
        secureStorage.setItem('sessionStart', Date.now(), this.sessionTimeout);

        // Set up session refresh
        this.setupSessionRefresh();
    }

    getSession(): { user: User | null; isAuthenticated: boolean } {
        const user = secureStorage.getItem('user');
        const isAuthenticated = secureStorage.getItem('isAuthenticated') === true;

        return { user, isAuthenticated };
    }

    clearSession(): void {
        secureStorage.clear();
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }

    private setupSessionRefresh(): void {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        // Show warning 30 minutes before expiry
        const warningTimeout = this.sessionTimeout - (30 * 60 * 1000);
        if (warningTimeout > 0) {
            setTimeout(() => {
                // Dispatch custom event for session warning
                window.dispatchEvent(new CustomEvent('session-warning', {
                    detail: { message: 'Your session will expire in 30 minutes' }
                }));
            }, warningTimeout);
        }

        // Refresh session 1 hour before expiry
        this.refreshTimeout = setTimeout(() => {
            this.refreshSession();
        }, this.sessionTimeout - (60 * 60 * 1000));
    }

    private async refreshSession(): Promise<void> {
        try {
            // In a real app, you'd call a refresh token endpoint
            // For now, we'll just extend the current session
            const { user } = this.getSession();
            if (user) {
                this.setSession(user);
            }
        } catch (error) {
            console.error('Session refresh failed:', error);
            this.clearSession();
        }
    }

    isSessionValid(): boolean {
        const sessionStart = secureStorage.getItem('sessionStart');
        if (!sessionStart) return false;

        return Date.now() - sessionStart < this.sessionTimeout;
    }
}

const sessionManager = SessionManager.getInstance();

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { handleError } = useErrorHandler();

    // Initialize auth state with server validation
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { user: storedUser, isAuthenticated: storedAuth } = sessionManager.getSession();

                if (storedAuth && storedUser && sessionManager.isSessionValid()) {
                    // Validate session with server
                    try {
                        const { data, error } = await api.validateSession(storedUser.user_id);

                        if (!error && data) {
                            setUser(storedUser);
                            setIsAuthenticated(true);
                        } else {
                            // Server says session is invalid
                            sessionManager.clearSession();
                            setUser(null);
                            setIsAuthenticated(false);
                        }
                    } catch (serverError) {
                        // If server validation fails, fall back to local validation
                        console.warn('Server validation failed, using local validation:', serverError);
                        setUser(storedUser);
                        setIsAuthenticated(true);
                    }
                } else {
                    // Clear invalid session
                    sessionManager.clearSession();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                sessionManager.clearSession();
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            const { data, error } = await api.login(email, password);

            if (error) {
                return { success: false, error };
            }

            if (data) {
                const { user: userData, branchId } = data as { user: any; role: string; branchId: number | null };

                const user: User = {
                    user_id: userData.user_id,
                    name: userData.name,
                    email: userData.email,
                    role_id: userData.role_id,
                    branch_id: branchId,
                    status: userData.status
                };

                setUser(user);
                setIsAuthenticated(true);
                sessionManager.setSession(user);

                return { success: true };
            }

            return { success: false, error: 'No data received' };
        } catch (err) {
            const errorMessage = handleError(err, 'Login');
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const logout = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        sessionManager.clearSession();
    }, []);

    const refreshUser = useCallback(async (): Promise<void> => {
        if (!user) return;

        try {
            // In a real app, you'd call an endpoint to refresh user data
            // For now, we'll just validate the current session
            if (!sessionManager.isSessionValid()) {
                logout();
                return;
            }

            // Extend session
            sessionManager.setSession(user);
        } catch (error) {
            console.error('User refresh failed:', error);
            logout();
        }
    }, [user, logout]);

    const updateUser = useCallback((userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            sessionManager.setSession(updatedUser);
        }
    }, [user]);

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P) => {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (!isAuthenticated) {
            return null; // Will be redirected by router
        }

        return <Component {...props} />;
    };
};

// Hook for role-based access control
export const useRole = () => {
    const { user } = useAuth();

    const hasRole = useCallback((requiredRoles: string[]): boolean => {
        if (!user) return false;

        // Map role_id to role name (you might want to fetch this from an API)
        const roleMap: Record<number, string> = {
            1: 'Super Admin',
            2: 'Branch Manager',
            3: 'Admin'
        };

        const userRole = roleMap[user.role_id] || 'Unknown';
        return requiredRoles.includes(userRole);
    }, [user]);

    const isSuperAdmin = useCallback(() => hasRole(['Super Admin']), [hasRole]);
    const isBranchManager = useCallback(() => hasRole(['Branch Manager', 'Super Admin']), [hasRole]);
    const isAdmin = useCallback(() => hasRole(['Admin', 'Branch Manager', 'Super Admin']), [hasRole]);

    return {
        hasRole,
        isSuperAdmin,
        isBranchManager,
        isAdmin,
        userRole: user ? `role_${user.role_id}` : null
    };
};
