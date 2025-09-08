// Branch interfaces
export interface Branch {
    id: number;
    location: string;
    address: string;
}

// Product interfaces
export interface Product {
    id: number;
    product_name: string;
    category_name: string;
    price: number;
    quantity: number;
    status: string;
    category?: {
        id: number;
        category_name: string;
    };
}

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}
