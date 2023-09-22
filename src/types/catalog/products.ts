import { Product } from '../shared';

export interface GetProductsResponse {
    data: Product[];
    code?: number;
    error?: {
        reason: string;
        message: string;
    }
    paging: {
        total: number;
        offset: number;
        limit: number;
    };
    _links: {
        self: {
            href: string;
        };
        next?: {
            href: string;
        };
        first: {
            href: string;
        };
        last: {
            href: string;
        };
    };
}

export interface GetProductResponse {
    data: Product;
    code?: number;
    error?: {
        reason: string;
        message: string;
    }
    paging: {
        total: number;
        offset: number;
        limit: number;
    };
    _links: {
        self: {
            href: string;
        };
        next?: {
            href: string;
        };
        first: {
            href: string;
        };
        last: {
            href: string;
        };
    };
}
