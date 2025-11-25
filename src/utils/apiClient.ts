// API Client with proper error handling and retry logic
import { errorHandler } from "./errorHandler";
import { API_BASE_URL } from "../config/config";

// Ensure we always call the backend under the /api path
const API_ROOT = API_BASE_URL.replace(/\/$/, "") + "/api";

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || API_ROOT,
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    const url = `${this.config.baseURL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await errorHandler.fetchWithRetry(
        url,
        defaultOptions,
        this.config.retries,
        this.config.retryDelay
      );

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

          return {
            data: null,
            error: `Rate limit exceeded. Please wait ${Math.ceil(
              waitTime / 1000
            )} seconds before trying again.`,
          };
        }

        const apiError = await errorHandler.handleApiError(response);
        const errorType = errorHandler.categorizeError(apiError, response);
        const errorMessage = errorHandler.getErrorMessage(apiError, errorType);

        return { data: null, error: errorMessage };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      const errorType = errorHandler.categorizeError(error);
      const errorMessage = errorHandler.getErrorMessage(error, errorType);

      return { data: null, error: errorMessage };
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<{ data: T | null; error: string | null }> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.makeRequest<T>(url, { method: "GET" });
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: any
  ): Promise<{ data: T | null; error: string | null }> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: any
  ): Promise<{ data: T | null; error: string | null }> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(
    endpoint: string
  ): Promise<{ data: T | null; error: string | null }> {
    return this.makeRequest<T>(endpoint, { method: "DELETE" });
  }

  // Upload file
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<{ data: T | null; error: string | null }> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Specific API methods for the application
export const api = {
  // Authentication
  login: (email: string, password: string) =>
    apiClient.post("/login", { email, password }),

  validateSession: (userId: string) =>
    apiClient.post("/validate-session", { user_id: userId }),

  // Products
  getProducts: (branchId: number) =>
    apiClient.get("/products", { branch_id: branchId }),

  getAllProducts: (branchId?: number) =>
    apiClient.get("/products/all", branchId ? { branch_id: branchId } : undefined),

  createProduct: (productData: any, userId: string) =>
    apiClient.post("/products", { ...productData, user_id: userId }),

  updateProduct: (id: number, productData: any, userId: string) =>
    apiClient.put(`/products/${id}`, { ...productData, user_id: userId }),

  deleteProduct: (id: number, userId: string) =>
    apiClient.delete(`/products/${id}?user_id=${userId}`),

  bulkImportProducts: (products: any[], userId: string) =>
    apiClient.post("/products/bulk-import", { products, user_id: userId }),

  // Categories
  getCategories: () => apiClient.get("/categories"),

  // Branches
  getBranches: () => apiClient.get("/branches"),

  getBranchProducts: (branchId: number) =>
    apiClient.get(`/branches/${branchId}/products`),

  // Users
  getUsers: (branchId: number) =>
    apiClient.get("/users", { branch_id: branchId }),

  createUser: (userData: any) => apiClient.post("/create_users", userData),

  createPendingUser: (userData: any) =>
    apiClient.post("/create_pending_user", userData),

  completeUserSetup: (token: string, password: string) =>
    apiClient.post("/complete_user_setup", { token, password }),

  getUserByToken: (token: string) => apiClient.get(`/user_by_token/${token}`),

  // Password reset
  forgotPassword: (email: string) =>
    apiClient.post("/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post("/reset-password", { token, password }),

  getUserByResetToken: (token: string) =>
    apiClient.get(`/user_by_reset_token/${token}`),

  // Product requests
  createProductRequest: (requestData: any) =>
    apiClient.post("/product-requests", requestData),

  getPendingRequests: (userId: string) =>
    apiClient.get(`/product-requests/pending/${userId}`),

  getSentRequests: (userId: string) =>
    apiClient.get(`/product-requests/sent/${userId}`),

  reviewRequest: (
    requestId: number,
    action: string,
    reviewedBy: string,
    notes?: string
  ) =>
    apiClient.put(`/product-requests/${requestId}/review`, {
      action,
      reviewedBy,
      notes,
    }),

  getPendingRequestsForBranch: (branchId: number) =>
    apiClient.get(`/product-requests/pending-for-branch/${branchId}`),

  getAllRequests: () => apiClient.get("/product-requests/all"),

  // Audit logs
  getAuditLogs: (params?: any) => apiClient.get("/audit-logs", params),

  getUserAuditLogs: (userId: string, params?: any) =>
    apiClient.get(`/audit-logs/user/${userId}`, params),

  getAuditLogStats: (params?: any) =>
    apiClient.get("/audit-logs/stats", params),

  // Product transfers
  getTransferredProducts: (branchId: number) =>
    apiClient.get(`/transfers/${branchId}`),
};

// Export the client and API methods
export default apiClient;
