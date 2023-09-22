
import { Variant } from '../shared';

export interface GetProductVariantResponse {
    data: Variant;
    error?: {
        reason: string
        message: string
    },
    code?: number;
    _links: {
        self: {
            href: string;
        };
        product_variants: {
            href: string;
        };
        product_details: {
            href: string;
        };
        variant_prices: {
            href: string;
        };
        variant_images: {
            href: string;
        };
    };
}

export interface GetVariantRequest {
    id: number;
}

export interface GetProductVariantsRequest {
    id: number;
}

export interface GetProductVariantsResponse {
    data: Variant[];
    error?: {
        reason: string
        message: string
    },
    code?: number;
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
        previous?: {
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




